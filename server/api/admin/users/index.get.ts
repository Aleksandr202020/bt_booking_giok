import { desc } from 'drizzle-orm'
import { db } from '../../../database'
import { users } from '../../../database/schema'
import { requireAdmin, toPublicUser } from '../../../utils/auth'
import { handleApiError } from '../../../utils/errors'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)

    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))

    return {
      users: allUsers.map(toPublicUser),
    }
  } catch (error) {
    return handleApiError(event, error)
  }
})
