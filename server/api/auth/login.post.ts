import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { users } from '../../database/schema'
import { verifyPassword } from '../../utils/password'
import { loginSchema } from '../../utils/validation'
import { setSessionCookie, toPublicUser } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'
import { AppError, ErrorCodes } from '../../../shared/errors'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const data = loginSchema.parse(body)

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1)

    if (!user) {
      throw new AppError(ErrorCodes.AUTH_REQUIRED, 'Invalid email or password', 401)
    }

    const valid = await verifyPassword(data.password, user.passwordHash)
    if (!valid) {
      throw new AppError(ErrorCodes.AUTH_REQUIRED, 'Invalid email or password', 401)
    }

    await setSessionCookie(event, user.id)

    return {
      user: toPublicUser(user),
    }
  } catch (error) {
    return handleApiError(event, error)
  }
})
