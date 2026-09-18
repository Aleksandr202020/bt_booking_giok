/**
 * Stable error codes returned by the API.
 * Frontend and tests should rely only on these codes.
 */
export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  CLIENT_BANNED: 'CLIENT_BANNED',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_SLOT: 'INVALID_SLOT',
  BOOKING_DATE_OUT_OF_RANGE: 'BOOKING_DATE_OUT_OF_RANGE',
  CAR_NOT_FOUND: 'CAR_NOT_FOUND',
  CAR_NOT_OWNED: 'CAR_NOT_OWNED',
  HOLIDAY: 'HOLIDAY',
  SLOT_BLOCKED: 'SLOT_BLOCKED',
  SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
  BOOKING_LIMIT_REACHED: 'BOOKING_LIMIT_REACHED',
  CAR_BOOKING_LIMIT_REACHED: 'CAR_BOOKING_LIMIT_REACHED',
  CANCEL_TOO_LATE: 'CANCEL_TOO_LATE',
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  INVALID_SERVICE_COMBINATION: 'INVALID_SERVICE_COMBINATION',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly statusCode: number = 400,
  ) {
    super(message ?? code)
    this.name = 'AppError'
  }
}
