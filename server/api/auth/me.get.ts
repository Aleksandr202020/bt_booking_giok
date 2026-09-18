import { getCurrentUser, toPublicUser } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'
import { AppError, ErrorCodes } from '../../../shared/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await getCurrentUser(event)

    if (!user) {
      throw new AppError(ErrorCodes.AUTH_REQUIRED, 'Not authenticated', 401)
    }

    return {
      user: toPublicUser(user),
    }
  } catch (error) {
    return handleApiError(event, error)
  }
})
