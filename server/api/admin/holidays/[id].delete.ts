import { eq } from 'drizzle-orm'
import { db } from '../../../database'
import { holidays, auditLogs } from '../../../database/schema'
import { requireAdmin } from '../../../utils/auth'
import { handleApiError } from '../../../utils/errors'
import { AppError, ErrorCodes } from '../../../../shared/errors'

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'ID required', 400)
    }

    const [existing] = await db
      .select()
      .from(holidays)
      .where(eq(holidays.id, id))
      .limit(1)

    if (!existing) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Holiday not found', 404)
    }

    await db.delete(holidays).where(eq(holidays.id, id))

    await db.insert(auditLogs).values({
      actorId: admin.id,
      action: 'DELETE_HOLIDAY',
      targetId: id,
      metadata: JSON.stringify({ date: existing.date, name: existing.name }),
    })

    return { success: true }
  } catch (error) {
    return handleApiError(event, error)
  }
})
