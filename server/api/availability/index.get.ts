import { getCurrentUser } from '../../utils/auth'
import { getSlotAvailability } from '../../utils/availability'
import { handleApiError } from '../../utils/errors'
import { AppError, ErrorCodes } from '../../../shared/errors'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const date = query.date as string | undefined

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError(ErrorCodes.INVALID_DATE, 'Valid date (YYYY-MM-DD) required', 400)
    }

    const user = await getCurrentUser(event)
    const slots = await getSlotAvailability(date, user)

    return { date, slots }
  } catch (error) {
    return handleApiError(event, error)
  }
})
