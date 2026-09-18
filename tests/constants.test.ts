import { describe, it, expect } from 'vitest'
import {
  WORKING_SLOTS,
  CAR_CATEGORIES,
  CUSTOMER_BOOKING_WINDOW_DAYS,
  MAX_CUSTOMER_BOOKINGS_IN_WINDOW,
  MAX_CUSTOMER_BOOKINGS_PER_CAR_IN_WINDOW,
  CANCEL_MIN_HOURS_BEFORE,
  ACTIVE_BOOKING_STATUSES,
} from '../server/utils/constants'

describe('constants', () => {
  it('has 12 working slots from 09:00 to 20:00', () => {
    expect(WORKING_SLOTS).toHaveLength(12)
    expect(WORKING_SLOTS[0]).toBe('09:00')
    expect(WORKING_SLOTS[11]).toBe('20:00')
  })

  it('has exactly 3 car categories', () => {
    expect(CAR_CATEGORIES).toEqual(['passenger', 'crossover', 'minibus'])
  })

  it('has correct booking window and limits', () => {
    expect(CUSTOMER_BOOKING_WINDOW_DAYS).toBe(14)
    expect(MAX_CUSTOMER_BOOKINGS_IN_WINDOW).toBe(3)
    expect(MAX_CUSTOMER_BOOKINGS_PER_CAR_IN_WINDOW).toBe(2)
    expect(CANCEL_MIN_HOURS_BEFORE).toBe(2)
  })

  it('active statuses are pending and confirmed', () => {
    expect(ACTIVE_BOOKING_STATUSES).toEqual(['pending', 'confirmed'])
  })
})
