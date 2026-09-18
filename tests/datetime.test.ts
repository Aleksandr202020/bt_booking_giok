import { describe, it, expect } from 'vitest'
import {
  isValidWorkingSlot,
  formatDateRiga,
  nowInRiga,
} from '../server/utils/datetime'
import { WORKING_SLOTS } from '../server/utils/constants'

describe('datetime', () => {
  it('validates working slots', () => {
    expect(isValidWorkingSlot('09:00')).toBe(true)
    expect(isValidWorkingSlot('20:00')).toBe(true)
    expect(isValidWorkingSlot('08:00')).toBe(false)
    expect(isValidWorkingSlot('21:00')).toBe(false)
    expect(isValidWorkingSlot('09:30')).toBe(false)
  })

  it('all WORKING_SLOTS are valid', () => {
    for (const slot of WORKING_SLOTS) {
      expect(isValidWorkingSlot(slot)).toBe(true)
    }
  })

  it('formatDateRiga returns YYYY-MM-DD', () => {
    const date = nowInRiga()
    const formatted = formatDateRiga(date)
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
