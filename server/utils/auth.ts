import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie } from 'h3'
import {
  SESSION_COOKIE,
  getSessionUser,
  createSession,
  deleteSession,
  getSessionCookieOptions,
} from './session'
import type { User } from '../database/schema'
import { AppError, ErrorCodes } from '../../shared/errors'

export async function getCurrentUser(event: H3Event): Promise<User | null> {
  const token = getCookie(event, SESSION_COOKIE)
  return getSessionUser(token)
}

export async function requireUser(event: H3Event): Promise<User> {
  const user = await getCurrentUser(event)
  if (!user) {
    throw new AppError(ErrorCodes.AUTH_REQUIRED, 'Authentication required', 401)
  }
  return user
}

export async function requireAdmin(event: H3Event): Promise<User> {
  const user = await requireUser(event)
  if (user.role !== 'admin') {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Admin access required', 403)
  }
  return user
}

export async function requireNotBanned(event: H3Event): Promise<User> {
  const user = await requireUser(event)
  if (user.banned) {
    throw new AppError(ErrorCodes.CLIENT_BANNED, 'Your account is banned', 403)
  }
  return user
}

export async function setSessionCookie(event: H3Event, userId: string): Promise<void> {
  const token = await createSession(userId)
  const config = useRuntimeConfig()
  const isSecure = config.public.appUrl?.startsWith('https') ?? false

  setCookie(event, SESSION_COOKIE, token, getSessionCookieOptions(isSecure))
}

export async function clearSessionCookie(event: H3Event): Promise<void> {
  const token = getCookie(event, SESSION_COOKIE)
  await deleteSession(token)
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

/** Safe user object for API responses (no password hash) */
export function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    banned: user.banned,
    createdAt: user.createdAt,
  }
}
