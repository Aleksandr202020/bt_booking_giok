import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../server/utils/password'

describe('password', () => {
  it('hashes and verifies correctly', async () => {
    const password = 'TestPassword123!'
    const hash = await hashPassword(password)

    expect(hash).not.toBe(password)
    expect(hash.length).toBeGreaterThan(20)

    const valid = await verifyPassword(password, hash)
    expect(valid).toBe(true)

    const invalid = await verifyPassword('wrong', hash)
    expect(invalid).toBe(false)
  })

  it('produces different hashes for same password', async () => {
    const password = 'SamePassword'
    const hash1 = await hashPassword(password)
    const hash2 = await hashPassword(password)
    expect(hash1).not.toBe(hash2)
  })
})
