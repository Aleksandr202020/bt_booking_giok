import { db } from '../../../database'
import { services, servicePrices, auditLogs } from '../../../database/schema'
import { requireAdmin } from '../../../utils/auth'
import { serviceSchema } from '../../../utils/validation'
import { handleApiError } from '../../../utils/errors'
import { CAR_CATEGORIES } from '../../../utils/constants'
import { z } from 'zod'

const createServiceSchema = serviceSchema.extend({
  prices: z
    .array(
      z.object({
        carCategory: z.enum(CAR_CATEGORIES),
        priceCents: z.number().int().min(0),
      }),
    )
    .optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    const body = await readBody(event)
    const data = createServiceSchema.parse(body)

    const [service] = await db
      .insert(services)
      .values({
        nameLv: data.nameLv,
        nameRu: data.nameRu ?? null,
        nameEn: data.nameEn ?? null,
        type: data.type,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning()

    if (data.prices && data.prices.length > 0) {
      await db.insert(servicePrices).values(
        data.prices.map((p) => ({
          serviceId: service.id,
          carCategory: p.carCategory,
          priceCents: p.priceCents,
          updatedBy: admin.id,
        })),
      )
    }

    await db.insert(auditLogs).values({
      actorId: admin.id,
      action: 'CREATE_SERVICE',
      targetId: service.id,
      metadata: JSON.stringify({ nameLv: data.nameLv, type: data.type }),
    })

    return { service }
  } catch (error) {
    return handleApiError(event, error)
  }
})
