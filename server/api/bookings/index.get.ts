import { eq, desc } from 'drizzle-orm'
import { db } from '../../database'
import { bookings, cars, bookingServices, services } from '../../database/schema'
import { requireUser } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireUser(event)

    const userBookings = await db
      .select({
        booking: bookings,
        car: cars,
      })
      .from(bookings)
      .innerJoin(cars, eq(bookings.carId, cars.id))
      .where(eq(bookings.userId, user.id))
      .orderBy(desc(bookings.bookingDate), desc(bookings.bookingTime))

    const result = []
    for (const row of userBookings) {
      const svcRows = await db
        .select({
          serviceId: bookingServices.serviceId,
          priceCents: bookingServices.priceCents,
          nameLv: services.nameLv,
          nameRu: services.nameRu,
          nameEn: services.nameEn,
          type: services.type,
        })
        .from(bookingServices)
        .innerJoin(services, eq(bookingServices.serviceId, services.id))
        .where(eq(bookingServices.bookingId, row.booking.id))

      result.push({
        ...row.booking,
        car: row.car,
        services: svcRows,
      })
    }

    return { bookings: result }
  } catch (error) {
    return handleApiError(event, error)
  }
})
