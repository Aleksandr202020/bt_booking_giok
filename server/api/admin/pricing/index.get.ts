import { asc } from 'drizzle-orm'
import { db } from '../../../database'
import { services, servicePrices } from '../../../database/schema'
import { requireAdmin } from '../../../utils/auth'
import { handleApiError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)

    const allServices = await db
      .select()
      .from(services)
      .orderBy(asc(services.sortOrder))

    const allPrices = await db.select().from(servicePrices)

    const result = allServices.map((service) => ({
      id: service.id,
      nameLv: service.nameLv,
      nameRu: service.nameRu,
      nameEn: service.nameEn,
      type: service.type,
      isActive: service.isActive,
      prices: {
        passenger: allPrices.find(
          (p) => p.serviceId === service.id && p.carCategory === 'passenger',
        )?.priceCents ?? null,
        crossover: allPrices.find(
          (p) => p.serviceId === service.id && p.carCategory === 'crossover',
        )?.priceCents ?? null,
        minibus: allPrices.find(
          (p) => p.serviceId === service.id && p.carCategory === 'minibus',
        )?.priceCents ?? null,
      },
    }))

    return { services: result }
  } catch (error) {
    return handleApiError(event, error)
  }
})
