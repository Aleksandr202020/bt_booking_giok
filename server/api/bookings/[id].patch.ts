import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { cancelBooking } from '../../utils/booking-engine'
import { handleApiError } from '../../utils/errors'
import { AppError, ErrorCodes } from '../../../shared/errors'

const cancelSchema = z.object({
  action: z.literal('cancel'),
})

export default defineEventHandler(async (event) => {
  try {
    const user = await requireUser(event)
    const bookingId = getRouterParam(event, 'id')

    if (!bookingId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Booking ID required', 400)
    }

    const body = await readBody(event)
    const data = cancelSchema.parse(body)

    if (data.action === 'cancel') {
      const updated = await cancelBooking(user, bookingId)
      return { booking: updated }
    }

    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Unknown action', 400)
  } catch (error) {
    return handleApiError(event, error)
  }
})
