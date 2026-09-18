import { eq } from 'drizzle-orm'
import { db } from '../../../database'
import { services, auditLogs } from '../../../database/schema'
import { requireAdmin } from '../../../utils/auth'
import { serviceUpdateSchema } from '../../../utils/validation'
import { handleApiError } from '../../../utils/errors'
import { AppError, ErrorCodes } from '../../../../shared/errors'

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    const serviceId = getRouterParam(event, 'id')

    if (!serviceId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Service ID required', 400)
    }

    const body = await readBody(event)
    const data = serviceUpdateSchema.parse(body)

    const [existing] = await db
      .select()
      .from(services)
      .where(eq(services.id, serviceId))
      .limit(1)

    if (!existing) {
      throw new AppError(ErrorCodes.SERVICE_NOT_FOUND, 'Service not found', 404)
    }

    const [updated] = await db
      .update(services)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(services.id, serviceId))
      .returning()

    await db.insert(auditLogs).values({
      actorId: admin.id,
      action: 'UPDATE_SERVICE',
      targetId: serviceId,
      metadata: JSON.stringify(data),
    })

    return { service: updated }
  } catch (error) {
    return handleApiError(event, error)
  }
})
