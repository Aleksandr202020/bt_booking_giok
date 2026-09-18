import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../database'
import { bookings, blockedSlots, holidays } from '../database/schema'
import {
  WORKING_SLOTS,
  ACTIVE_BOOKING_STATUSES,
  type SlotStatus,
  type WorkingSlot,
} from './constants'
import {
  isWithinCustomerBookingWindow,
  isSlotPast,
} from './datetime'
import type { User } from '../database/schema'

export interface SlotInfo {
  time: WorkingSlot
  status: SlotStatus
}

export async function getSlotAvailability(
  dateStr: string,
  user?: User | null,
): Promise<SlotInfo[]> {
  const isAdmin = user?.role === 'admin'

  const [holiday] = await db
    .select()
    .from(holidays)
    .where(and(eq(holidays.date, dateStr), eq(holidays.active, true)))
    .limit(1)

  if (holiday) {
    return WORKING_SLOTS.map((time) => ({
      time,
      status: 'holiday' as SlotStatus,
    }))
  }

  if (!isAdmin && !isWithinCustomerBookingWindow(dateStr)) {
    return WORKING_SLOTS.map((time) => ({
      time,
      status: 'outside_booking_window' as SlotStatus,
    }))
  }

  const activeBookings = await db
    .select({ bookingTime: bookings.bookingTime })
    .from(bookings)
    .where(
      and(
        eq(bookings.bookingDate, dateStr),
        inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
      ),
    )

  const bookedTimes = new Set(
    activeBookings.map((b) => String(b.bookingTime).slice(0, 5)),
  )

  const blocks = await db
    .select()
    .from(blockedSlots)
    .where(eq(blockedSlots.bookingDate, dateStr))

  const wholeDayBlocked = blocks.some((b) => b.bookingTime === null)
  const blockedTimes = new Set(
    blocks
      .filter((b) => b.bookingTime !== null)
      .map((b) => String(b.bookingTime).slice(0, 5)),
  )

  return WORKING_SLOTS.map((time) => {
    let status: SlotStatus

    if (isSlotPast(dateStr, time)) {
      status = 'past'
    } else if (wholeDayBlocked || blockedTimes.has(time)) {
      status = 'blocked'
    } else if (bookedTimes.has(time)) {
      status = 'booked'
    } else {
      status = 'available'
    }

    return { time, status }
  })
}
