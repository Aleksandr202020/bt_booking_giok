import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../../database'
import { users, auditLogs } from '../../../database/schema'
import { requireAdmin, toPublicUser } from '../../../utils/auth'
import { handleApiError } from '../../../utils/errors'
import { AppError, ErrorCodes } from '../../../../shared/errors'

const banSchema = z.object({
  banned: z.boolean(),
  banReason: z.string().max(500).optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    const userId = getRouterParam(event, 'id')

    if (!userId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'User ID required', 400)
    }

    const body = await readBody(event)
    const data = banSchema.parse(body)

    if (userId === admin.id) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot ban yourself', 403)
    }

    const [target] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!target) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'User not found', 404)
    }

    if (target.role === 'admin') {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot ban admin users', 403)
    }

    const [updated] = await db
      .update(users)
      .set({
        banned: data.banned,
        banReason: data.banned ? (data.banReason ?? null) : null,
        bannedAt: data.banned ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning()

    await db.insert(auditLogs).values({
      actorId: admin.id,
      action: data.banned ? 'BAN_USER' : 'UNBAN_USER',
      targetId: userId,
      metadata: JSON.stringify({
        banReason: data.banReason ?? null,
      }),
    })

    return {
      user: toPublicUser(updated),
    }
  } catch (error) {
    return handleApiError(event, error)
  }
})
