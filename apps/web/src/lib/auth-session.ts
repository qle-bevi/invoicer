import type { Route } from '@tuyau/core/types'

export const AUTH_SESSION_STORAGE_KEY = 'invoicer.auth.session'

export type AuthSession = Route.Response<'auth.access_tokens.store'>['data']

type SessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type Listener = () => void

export interface AuthSessionStore {
  getSnapshot: () => AuthSession | null
  subscribe: (listener: Listener) => () => void
  isAuthenticated: () => boolean
  setSession: (session: AuthSession) => void
  clear: () => void
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false

  const session = value as Record<string, unknown>
  if (!session.user || typeof session.user !== 'object') return false

  const user = session.user as Record<string, unknown>

  return (
    typeof session.token === 'string' &&
    session.token.length > 0 &&
    typeof user.id === 'number' &&
    Number.isFinite(user.id) &&
    (typeof user.fullName === 'string' || user.fullName === null) &&
    typeof user.email === 'string' &&
    user.email.length > 0 &&
    typeof user.initials === 'string' &&
    typeof user.createdAt === 'string' &&
    (typeof user.updatedAt === 'string' || user.updatedAt === null)
  )
}

function removeStoredSession(storage: SessionStorage | null) {
  try {
    storage?.removeItem(AUTH_SESSION_STORAGE_KEY)
  } catch {
    // The in-memory session remains authoritative when storage is unavailable.
  }
}

function readSession(storage: SessionStorage | null): AuthSession | null {
  if (!storage) return null

  try {
    const rawSession = storage.getItem(AUTH_SESSION_STORAGE_KEY)
    if (!rawSession) return null

    const session: unknown = JSON.parse(rawSession)
    if (isAuthSession(session)) return session

    removeStoredSession(storage)
  } catch {
    removeStoredSession(storage)
  }

  return null
}

function getBrowserStorage(): SessionStorage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function createAuthSession(
  storage: SessionStorage | null = getBrowserStorage(),
): AuthSessionStore {
  let currentSession = readSession(storage)
  const listeners = new Set<Listener>()

  function notify() {
    listeners.forEach((listener) => listener())
  }

  return {
    getSnapshot: () => currentSession,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    isAuthenticated: () => currentSession !== null,
    setSession(session) {
      currentSession = session
      try {
        storage?.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
      } catch {
        // Authentication still works for the current page lifetime.
      }
      notify()
    },
    clear() {
      const sessionChanged = currentSession !== null
      currentSession = null
      removeStoredSession(storage)
      if (sessionChanged) notify()
    },
  }
}
