import { eq } from 'drizzle-orm'
import { db } from '../../../database'
import { blockedSlots, auditLogs } from '../../../database/schema'
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
      .from(blockedSlots)
      .where(eq(blockedSlots.id, id))
      .limit(1)

    if (!existing) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Blocked slot not found', 404)
    }

    await db.delete(blockedSlots).where(eq(blockedSlots.id, id))

    await db.insert(auditLogs).values({
      actorId: admin.id,
      action: 'UNBLOCK_SLOT',
      targetId: id,
      metadata: JSON.stringify({
        date: existing.bookingDate,
        time: existing.bookingTime,
      }),
    })

    return { success: true }
  } catch (error) {
    return handleApiError(event, error)
  }
})
