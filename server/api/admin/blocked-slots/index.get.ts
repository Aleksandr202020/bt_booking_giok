import { desc } from 'drizzle-orm'
import { db } from '../../../database'
import { blockedSlots } from '../../../database/schema'
import { requireAdmin } from '../../../utils/auth'
import { handleApiError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)

    const slots = await db
      .select()
      .from(blockedSlots)
      .orderBy(desc(blockedSlots.bookingDate))

    return { blockedSlots: slots }
  } catch (error) {
    return handleApiError(event, error)
  }
})
