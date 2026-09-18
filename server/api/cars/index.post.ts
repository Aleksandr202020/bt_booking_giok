import { db } from '../../database'
import { cars } from '../../database/schema'
import { requireUser } from '../../utils/auth'
import { carSchema } from '../../utils/validation'
import { handleApiError } from '../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireUser(event)
    const body = await readBody(event)
    const data = carSchema.parse(body)

    const [car] = await db
      .insert(cars)
      .values({
        userId: user.id,
        make: data.make,
        model: data.model,
        registrationNumber: data.registrationNumber ?? null,
        category: data.category,
      })
      .returning()

    return { car }
  } catch (error) {
    return handleApiError(event, error)
  }
})
