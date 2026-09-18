import { requireAdmin } from '../../../utils/auth'
import { adminCreateBookingSchema } from '../../../utils/validation'
import { createBooking } from '../../../utils/booking-engine'
import { handleApiError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    const body = await readBody(event)
    const data = adminCreateBookingSchema.parse(body)

    const result = await createBooking(
      admin,
      {
        carId: data.carId,
        bookingDate: data.bookingDate,
        bookingTime: data.bookingTime,
        mainServiceId: data.mainServiceId,
        additionalServiceIds: data.additionalServiceIds,
        notes: data.notes ?? undefined,
      },
      {
        isAdmin: true,
        targetUserId: data.userId,
      },
    )

    return {
      booking: result.booking,
      services: result.items,
    }
  } catch (error) {
    return handleApiError(event, error)
  }
})
