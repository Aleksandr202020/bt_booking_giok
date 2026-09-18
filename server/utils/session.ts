import { createHash, randomBytes } from 'node:crypto'
import { eq, and, gt } from 'drizzle-orm'
import { db } from '../database'
import { sessions, users } from '../database/schema'
import type { User } from '../database/schema'

const SESSION_COOKIE = 'bt_session'
const SESSION_DAYS = 30

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS)

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
  })

  return token
}

export async function getSessionUser(token: string | undefined): Promise<User | null> {
  if (!token) return null

  const tokenHash = hashToken(token)
  const now = new Date()

  const result = await db
    .select({
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)))
    .limit(1)

  if (result.length === 0) return null
  return result[0].user
}

export async function deleteSession(token: string | undefined): Promise<void> {
  if (!token) return
  const tokenHash = hashToken(token)
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash))
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId))
}

export function getSessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  }
}

export { SESSION_COOKIE }
