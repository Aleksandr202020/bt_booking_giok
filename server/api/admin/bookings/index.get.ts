import { desc, eq } from 'drizzle-orm'
import { db } from '../../../database'
import { bookings, cars, users } from '../../../database/schema'
import { requireAdmin } from '../../../utils/auth'
import { handleApiError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)

    const query = getQuery(event)
    const date = query.date as string | undefined

    let rows

    if (date) {
      rows = await db
        .select({
          booking: bookings,
          car: cars,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
          },
        })
        .from(bookings)
        .innerJoin(cars, eq(bookings.carId, cars.id))
        .innerJoin(users, eq(bookings.userId, users.id))
        .where(eq(bookings.bookingDate, date))
        .orderBy(bookings.bookingTime)
    } else {
      rows = await db
        .select({
          booking: bookings,
          car: cars,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
          },
        })
        .from(bookings)
        .innerJoin(cars, eq(bookings.carId, cars.id))
        .innerJoin(users, eq(bookings.userId, users.id))
        .orderBy(desc(bookings.bookingDate), desc(bookings.bookingTime))
        .limit(100)
    }

    return {
      bookings: rows.map((r) => ({
        ...r.booking,
        car: r.car,
        user: r.user,
      })),
    }
  } catch (error) {
    return handleApiError(event, error)
  }
})
