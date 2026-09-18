import { z } from 'zod'
import { db } from '../../../database'
import { holidays, auditLogs } from '../../../database/schema'
import { requireAdmin } from '../../../utils/auth'
import { handleApiError } from '../../../utils/errors'

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().min(1).max(200),
  active: z.boolean().optional().default(true),
})

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    const body = await readBody(event)
    const data = schema.parse(body)

    const [holiday] = await db
      .insert(holidays)
      .values({
        date: data.date,
        name: data.name,
        active: data.active ?? true,
      })
      .onConflictDoNothing()
      .returning()

    if (!holiday) {
      return { holiday: null, message: 'Holiday already exists for this date' }
    }

    await db.insert(auditLogs).values({
      actorId: admin.id,
      action: 'CREATE_HOLIDAY',
      targetId: holiday.id,
      metadata: JSON.stringify({ date: data.date, name: data.name }),
    })

    return { holiday }
  } catch (error) {
    return handleApiError(event, error)
  }
})
