import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema } from '../server/utils/validation'

describe('registerSchema', () => {
  it('accepts valid input', () => {
    const result = registerSchema.safeParse({
      name: 'Jānis',
      email: 'janis@example.com',
      phone: '+37120000000',
      password: 'SecurePass1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      name: 'Jānis',
      email: 'janis@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'Jānis',
      email: 'not-an-email',
      password: 'SecurePass1',
    })
    expect(result.success).toBe(false)
  })

  it('lowercases email', () => {
    const result = registerSchema.parse({
      name: 'Jānis',
      email: 'Janis@Example.COM',
      password: 'SecurePass1',
    })
    expect(result.email).toBe('janis@example.com')
  })
})

describe('loginSchema', () => {
  it('accepts valid input', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'any',
    })
    expect(result.success).toBe(true)
  })
})
