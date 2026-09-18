import { eq, and } from 'drizzle-orm'
import { db } from '../../database'
import { cars } from '../../database/schema'
import { requireUser } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'
import { AppError, ErrorCodes } from '../../../shared/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireUser(event)
    const carId = getRouterParam(event, 'id')

    if (!carId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Car ID required', 400)
    }

    const [existing] = await db
      .select()
      .from(cars)
      .where(and(eq(cars.id, carId), eq(cars.userId, user.id)))
      .limit(1)

    if (!existing) {
      throw new AppError(ErrorCodes.CAR_NOT_FOUND, 'Car not found', 404)
    }

    await db.delete(cars).where(eq(cars.id, carId))

    return { success: true }
  } catch (error) {
    return handleApiError(event, error)
  }
})
