import { eq, and, asc } from 'drizzle-orm'
import { db } from '../../database'
import { services, servicePrices } from '../../database/schema'
import { handleApiError } from '../../utils/errors'
import { CAR_CATEGORIES } from '../../utils/constants'
import { AppError, ErrorCodes } from '../../../shared/errors'

/**
 * GET /api/services?category=passenger
 * Returns active services with prices for the given car category.
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const category = query.category as string | undefined

    if (!category || !CAR_CATEGORIES.includes(category as any)) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Valid category required (passenger | crossover | minibus)',
        400,
      )
    }

    const activeServices = await db
      .select({
        id: services.id,
        nameLv: services.nameLv,
        nameRu: services.nameRu,
        nameEn: services.nameEn,
        type: services.type,
        sortOrder: services.sortOrder,
        priceCents: servicePrices.priceCents,
      })
      .from(services)
      .leftJoin(
        servicePrices,
        and(
          eq(servicePrices.serviceId, services.id),
          eq(servicePrices.carCategory, category as any),
        ),
      )
      .where(eq(services.isActive, true))
      .orderBy(asc(services.sortOrder))

    const main = activeServices.filter((s) => s.type === 'main')
    const additional = activeServices.filter((s) => s.type === 'additional')

    return {
      category,
      main,
      additional,
    }
  } catch (error) {
    return handleApiError(event, error)
  }
})
