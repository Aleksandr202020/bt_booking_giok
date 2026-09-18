import { eq, and, inArray, sql, count } from 'drizzle-orm'
import { db } from '../database'
import {
  bookings,
  bookingServices,
  cars,
  blockedSlots,
  holidays,
  auditLogs,
} from '../database/schema'
import type { User } from '../database/schema'
import { calculateBookingPrice } from './pricing'
import {
  isValidWorkingSlot,
  isWithinCustomerBookingWindow,
  isSlotPast,
  canCustomerCancel,
  formatDateRiga,
  nowInRiga,
} from './datetime'
import {
  ACTIVE_BOOKING_STATUSES,
  MAX_CUSTOMER_BOOKINGS_IN_WINDOW,
  MAX_CUSTOMER_BOOKINGS_PER_CAR_IN_WINDOW,
  CUSTOMER_BOOKING_WINDOW_DAYS,
  type CarCategory,
} from './constants'
import { AppError, ErrorCodes } from '../../shared/errors'
import { addDays } from 'date-fns'

export interface CreateBookingInput {
  carId: string
  bookingDate: string
  bookingTime: string
  mainServiceId: string
  additionalServiceIds?: string[]
  notes?: string
}

export async function createBooking(
  user: User,
  input: CreateBookingInput,
  options: { isAdmin?: boolean; targetUserId?: string } = {},
) {
  const isAdmin = options.isAdmin ?? user.role === 'admin'
  const ownerId = options.targetUserId ?? user.id

  if (!isAdmin && user.banned) {
    throw new AppError(ErrorCodes.CLIENT_BANNED, 'Your account is banned', 403)
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.bookingDate)) {
    throw new AppError(ErrorCodes.INVALID_DATE, 'Invalid date format', 400)
  }

  if (!isValidWorkingSlot(input.bookingTime)) {
    throw new AppError(ErrorCodes.INVALID_SLOT, 'Invalid time slot', 400)
  }

  if (isSlotPast(input.bookingDate, input.bookingTime)) {
    throw new AppError(ErrorCodes.INVALID_SLOT, 'Cannot book a past slot', 400)
  }

  const [holiday] = await db
    .select()
    .from(holidays)
    .where(and(eq(holidays.date, input.bookingDate), eq(holidays.active, true)))
    .limit(1)

  if (holiday) {
    throw new AppError(ErrorCodes.HOLIDAY, 'Cannot book on a holiday', 400)
  }

  if (!isAdmin && !isWithinCustomerBookingWindow(input.bookingDate)) {
    throw new AppError(
      ErrorCodes.BOOKING_DATE_OUT_OF_RANGE,
      'Date is outside the booking window',
      400,
    )
  }

  const [car] = await db
    .select()
    .from(cars)
    .where(eq(cars.id, input.carId))
    .limit(1)

  if (!car) {
    throw new AppError(ErrorCodes.CAR_NOT_FOUND, 'Car not found', 404)
  }

  if (!isAdmin && car.userId !== user.id) {
    throw new AppError(ErrorCodes.CAR_NOT_OWNED, 'You do not own this car', 403)
  }

  if (isAdmin && options.targetUserId && car.userId !== options.targetUserId) {
    throw new AppError(ErrorCodes.CAR_NOT_OWNED, 'Car does not belong to the selected customer', 403)
  }

  const category = car.category as CarCategory

  const blocks = await db
    .select()
    .from(blockedSlots)
    .where(eq(blockedSlots.bookingDate, input.bookingDate))

  const wholeDayBlocked = blocks.some((b) => b.bookingTime === null)
  const timeBlocked = blocks.some((b) => {
    if (b.bookingTime === null) return false
    return String(b.bookingTime).slice(0, 5) === input.bookingTime
  })

  if (wholeDayBlocked || timeBlocked) {
    throw new AppError(ErrorCodes.SLOT_BLOCKED, 'This slot is blocked', 400)
  }

  if (!isAdmin) {
    const windowStart = formatDateRiga(nowInRiga())
    const windowEnd = formatDateRiga(addDays(nowInRiga(), CUSTOMER_BOOKING_WINDOW_DAYS))

    const [totalResult] = await db
      .select({ cnt: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, user.id),
          inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
          sql`${bookings.bookingDate} >= ${windowStart}`,
          sql`${bookings.bookingDate} <= ${windowEnd}`,
        ),
      )

    if (Number(totalResult.cnt) >= MAX_CUSTOMER_BOOKINGS_IN_WINDOW) {
      throw new AppError(
        ErrorCodes.BOOKING_LIMIT_REACHED,
        'Maximum number of active bookings reached',
        400,
      )
    }

    const [carResult] = await db
      .select({ cnt: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, user.id),
          eq(bookings.carId, input.carId),
          inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
          sql`${bookings.bookingDate} >= ${windowStart}`,
          sql`${bookings.bookingDate} <= ${windowEnd}`,
        ),
      )

    if (Number(carResult.cnt) >= MAX_CUSTOMER_BOOKINGS_PER_CAR_IN_WINDOW) {
      throw new AppError(
        ErrorCodes.CAR_BOOKING_LIMIT_REACHED,
        'Maximum bookings for this car reached',
        400,
      )
    }
  }

  const { totalCents, items } = await calculateBookingPrice(
    category,
    input.mainServiceId,
    input.additionalServiceIds ?? [],
  )

  try {
    const [booking] = await db
      .insert(bookings)
      .values({
        userId: ownerId,
        carId: input.carId,
        mainServiceId: input.mainServiceId,
        bookingDate: input.bookingDate,
        bookingTime: input.bookingTime,
        priceCents: totalCents,
        status: 'pending',
        notes: input.notes ?? null,
      })
      .returning()

    await db.insert(bookingServices).values(
      items.map((item) => ({
        bookingId: booking.id,
        serviceId: item.serviceId,
        priceCents: item.priceCents,
      })),
    )

    await db.insert(auditLogs).values({
      actorId: user.id,
      action: 'CREATE_BOOKING',
      targetId: booking.id,
      metadata: JSON.stringify({
        date: input.bookingDate,
        time: input.bookingTime,
        priceCents: totalCents,
        isAdmin,
      }),
    })

    return { booking, items }
  } catch (error: any) {
    if (error?.code === '23505') {
      throw new AppError(ErrorCodes.SLOT_UNAVAILABLE, 'This slot is already booked', 409)
    }
    throw error
  }
}

export async function cancelBooking(
  user: User,
  bookingId: string,
  options: { isAdmin?: boolean } = {},
) {
  const isAdmin = options.isAdmin ?? user.role === 'admin'

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (!booking) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Booking not found', 404)
  }

  if (!isAdmin && booking.userId !== user.id) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Not your booking', 403)
  }

  if (
    ['cancelled_customer', 'cancelled_admin', 'completed', 'no_show'].includes(
      booking.status,
    )
  ) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Booking cannot be cancelled', 400)
  }

  if (!isAdmin) {
    const timeStr = String(booking.bookingTime).slice(0, 5)
    if (!canCustomerCancel(booking.bookingDate, timeStr)) {
      throw new AppError(
        ErrorCodes.CANCEL_TOO_LATE,
        'Too late to cancel this booking',
        400,
      )
    }
  }

  const newStatus = isAdmin ? 'cancelled_admin' : 'cancelled_customer'

  const [updated] = await db
    .update(bookings)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning()

  await db.insert(auditLogs).values({
    actorId: user.id,
    action: 'CANCEL_BOOKING',
    targetId: bookingId,
    metadata: JSON.stringify({ status: newStatus, isAdmin }),
  })

  return updated
}
