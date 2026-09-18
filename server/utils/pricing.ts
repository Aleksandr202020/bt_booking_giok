import { eq, and, inArray } from 'drizzle-orm'
import { db } from '../database'
import { services, servicePrices } from '../database/schema'
import type { CarCategory } from './constants'
import { AppError, ErrorCodes } from '../../shared/errors'

export interface PricedService {
  serviceId: string
  type: 'main' | 'additional'
  nameLv: string
  priceCents: number
}

/**
 * Calculate total price for a booking.
 * - Exactly one main service required
 * - Zero or more additional services
 * - Prices taken from current service_prices by car category
 * - Returns frozen prices to store in booking
 */
export async function calculateBookingPrice(
  carCategory: CarCategory,
  mainServiceId: string,
  additionalServiceIds: string[] = [],
): Promise<{ totalCents: number; items: PricedService[] }> {
  const allIds = [mainServiceId, ...additionalServiceIds]

  const serviceRows = await db
    .select()
    .from(services)
    .where(and(inArray(services.id, allIds), eq(services.isActive, true)))

  if (serviceRows.length !== allIds.length) {
    throw new AppError(ErrorCodes.SERVICE_NOT_FOUND, 'One or more services not found or inactive', 404)
  }

  const mainService = serviceRows.find((s) => s.id === mainServiceId)
  if (!mainService || mainService.type !== 'main') {
    throw new AppError(
      ErrorCodes.INVALID_SERVICE_COMBINATION,
      'Main service must be of type "main"',
      400,
    )
  }

  for (const id of additionalServiceIds) {
    const s = serviceRows.find((r) => r.id === id)
    if (!s || s.type !== 'additional') {
      throw new AppError(
        ErrorCodes.INVALID_SERVICE_COMBINATION,
        'Additional services must be of type "additional"',
        400,
      )
    }
  }

  const priceRows = await db
    .select()
    .from(servicePrices)
    .where(
      and(
        inArray(servicePrices.serviceId, allIds),
        eq(servicePrices.carCategory, carCategory),
      ),
    )

  const items: PricedService[] = []

  for (const service of serviceRows) {
    const price = priceRows.find((p) => p.serviceId === service.id)
    if (!price) {
      throw new AppError(
        ErrorCodes.SERVICE_NOT_FOUND,
        `No price defined for service "${service.nameLv}" and category "${carCategory}"`,
        400,
      )
    }

    items.push({
      serviceId: service.id,
      type: service.type as 'main' | 'additional',
      nameLv: service.nameLv,
      priceCents: price.priceCents,
    })
  }

  const totalCents = items.reduce((sum, i) => sum + i.priceCents, 0)

  return { totalCents, items }
}
