import { eq } from 'drizzle-orm'
import { db } from '../../database'
import { users } from '../../database/schema'
import { hashPassword } from '../../utils/password'
import { registerSchema } from '../../utils/validation'
import { setSessionCookie, toPublicUser } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'
import { AppError, ErrorCodes } from '../../../shared/errors'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const data = registerSchema.parse(body)

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1)

    if (existing.length > 0) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Email already registered', 409)
    }

    const passwordHash = await hashPassword(data.password)

    const [user] = await db
      .insert(users)
      .values({
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        passwordHash,
        role: 'customer',
      })
      .returning()

    await setSessionCookie(event, user.id)

    return {
      user: toPublicUser(user),
    }
  } catch (error) {
    return handleApiError(event, error)
  }
})
