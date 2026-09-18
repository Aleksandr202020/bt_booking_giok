import type { H3Event } from 'h3'
import { createError } from 'h3'
import { AppError, ErrorCodes } from '../../shared/errors'
import { ZodError } from 'zod'

export function handleApiError(event: H3Event, error: unknown) {
  if (error instanceof AppError) {
    throw createError({
      statusCode: error.statusCode,
      statusMessage: error.message,
      data: { code: error.code },
    })
  }

  if (error instanceof ZodError) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation error',
      data: {
        code: ErrorCodes.VALIDATION_ERROR,
        issues: error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
    })
  }

  // Unexpected error — do not leak details
  console.error('[API Error]', error)
  throw createError({
    statusCode: 500,
    statusMessage: 'Internal server error',
    data: { code: ErrorCodes.INTERNAL_ERROR },
  })
}
