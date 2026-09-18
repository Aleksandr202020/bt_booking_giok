import { eq, and } from 'drizzle-orm'
import { db } from '../../../database'
import { servicePrices, services, auditLogs } from '../../../database/schema'
import { requireAdmin } from '../../../utils/auth'
import { servicePricesUpdateSchema } from '../../../utils/validation'
import { handleApiError } from '../../../utils/errors'
import { AppError, ErrorCodes } from '../../../../shared/errors'

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    const body = await readBody(event)
    const data = servicePricesUpdateSchema.parse(body)

    const updated = []

    for (const item of data.prices) {
      const [service] = await db
        .select({ id: services.id })
        .from(services)
        .where(eq(services.id, item.serviceId))
        .limit(1)

      if (!service) {
        throw new AppError(
          ErrorCodes.SERVICE_NOT_FOUND,
          `Service ${item.serviceId} not found`,
          404,
        )
      }

      const [existing] = await db
        .select()
        .from(servicePrices)
        .where(
          and(
            eq(servicePrices.serviceId, item.serviceId),
            eq(servicePrices.carCategory, item.carCategory),
          ),
        )
        .limit(1)

      if (existing) {
        const [row] = await db
          .update(servicePrices)
          .set({
            priceCents: item.priceCents,
            updatedAt: new Date(),
            updatedBy: admin.id,
          })
          .where(eq(servicePrices.id, existing.id))
          .returning()
        updated.push(row)
      } else {
        const [row] = await db
          .insert(servicePrices)
          .values({
            serviceId: item.serviceId,
            carCategory: item.carCategory,
            priceCents: item.priceCents,
            updatedBy: admin.id,
          })
          .returning()
        updated.push(row)
      }
    }

    await db.insert(auditLogs).values({
      actorId: admin.id,
      action: 'UPDATE_PRICING',
      metadata: JSON.stringify({ count: data.prices.length }),
    })

    return { prices: updated }
  } catch (error) {
    return handleApiError(event, error)
  }
})
