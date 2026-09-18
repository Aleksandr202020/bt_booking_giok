import { eq, desc } from 'drizzle-orm'
import { db } from '../../database'
import { cars } from '../../database/schema'
import { requireUser } from '../../utils/auth'
import { handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireUser(event)

    const userCars = await db
      .select()
      .from(cars)
      .where(eq(cars.userId, user.id))
      .orderBy(desc(cars.createdAt))

    return { cars: userCars }
  } catch (error) {
    return handleApiError(event, error)
  }
})
