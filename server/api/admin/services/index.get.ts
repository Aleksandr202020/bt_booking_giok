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

    const servicesWithPrices = allServices.map((service) => ({
      ...service,
      prices: allPrices
        .filter((p) => p.serviceId === service.id)
        .map((p) => ({
          carCategory: p.carCategory,
          priceCents: p.priceCents,
        })),
    }))

    return { services: servicesWithPrices }
  } catch (error) {
    return handleApiError(event, error)
  }
})
