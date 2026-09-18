import { desc } from 'drizzle-orm'
import { db } from '../../../database'
import { holidays } from '../../../database/schema'
import { requireAdmin } from '../../../utils/auth'
import { handleApiError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)

    const list = await db
      .select()
      .from(holidays)
      .orderBy(desc(holidays.date))

    return { holidays: list }
  } catch (error) {
    return handleApiError(event, error)
  }
})
