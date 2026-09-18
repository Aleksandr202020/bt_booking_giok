import { z } from 'zod'
import { db } from '../../../database'
import { blockedSlots, auditLogs } from '../../../database/schema'
import { requireAdmin } from '../../../utils/auth'
import { handleApiError } from '../../../utils/errors'
import { isValidWorkingSlot } from '../../../utils/datetime'
import { AppError, ErrorCodes } from '../../../../shared/errors'

const schema = z.object({
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bookingTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  reason: z.string().max(500).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  try {
    const admin = await requireAdmin(event)
    const body = await readBody(event)
    const data = schema.parse(body)

    if (data.bookingTime && !isValidWorkingSlot(data.bookingTime)) {
      throw new AppError(ErrorCodes.INVALID_SLOT, 'Invalid time slot', 400)
    }

    const [slot] = await db
      .insert(blockedSlots)
      .values({
        bookingDate: data.bookingDate,
        bookingTime: data.bookingTime ?? null,
        reason: data.reason ?? null,
        createdBy: admin.id,
      })
      .returning()

    await db.insert(auditLogs).values({
      actorId: admin.id,
      action: 'BLOCK_SLOT',
      targetId: slot.id,
      metadata: JSON.stringify({
        date: data.bookingDate,
        time: data.bookingTime ?? 'whole_day',
      }),
    })

    return { blockedSlot: slot }
  } catch (error) {
    return handleApiError(event, error)
  }
})
