import { clearSessionCookie } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await clearSessionCookie(event)
    return { success: true }
  } catch (error) {
    return handleApiError(event, error)
  }
})
