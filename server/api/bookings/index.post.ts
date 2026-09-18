import { requireNotBanned } from '../../utils/auth'
import { createBookingSchema } from '../../utils/validation'
import { createBooking } from '../../utils/booking-engine'
import { handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireNotBanned(event)
    const body = await readBody(event)
    const data = createBookingSchema.parse(body)

    const result = await createBooking(user, {
      carId: data.carId,
      bookingDate: data.bookingDate,
      bookingTime: data.bookingTime,
      mainServiceId: data.mainServiceId,
      additionalServiceIds: data.additionalServiceIds,
      notes: data.notes ?? undefined,
    })

    return {
      booking: result.booking,
      services: result.items,
    }
  } catch (error) {
    return handleApiError(event, error)
  }
})
