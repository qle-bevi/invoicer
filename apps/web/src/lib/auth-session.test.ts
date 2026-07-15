// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'

import { AUTH_SESSION_STORAGE_KEY, createAuthSession } from './auth-session'

describe('auth session', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists a signed-in session and restores it without a request', () => {
    const session = {
      token: 'token-123',
      user: {
        id: 1,
        fullName: 'Quentin Martin',
        email: 'quentin@example.com',
        initials: 'QM',
        createdAt: '2026-07-15T08:00:00.000Z',
        updatedAt: '2026-07-15T08:00:00.000Z',
      },
    }

    const auth = createAuthSession(localStorage)
    auth.setSession(session)

    expect(auth.isAuthenticated()).toBe(true)
    expect(auth.getSnapshot()).toEqual(session)
    expect(JSON.parse(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)!)).toEqual(
      session,
    )
    expect(createAuthSession(localStorage).getSnapshot()).toEqual(session)
  })

  it('fails closed and removes malformed local data', () => {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, '{not-json')

    const auth = createAuthSession(localStorage)

    expect(auth.isAuthenticated()).toBe(false)
    expect(auth.getSnapshot()).toBeNull()
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull()
  })

  it('fails closed and removes an incomplete local session', () => {
    localStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        token: 'token-123',
        user: { email: 'quentin@example.com' },
      }),
    )

    const auth = createAuthSession(localStorage)

    expect(auth.isAuthenticated()).toBe(false)
    expect(auth.getSnapshot()).toBeNull()
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull()
  })

  it('notifies subscribers when the session changes', () => {
    const auth = createAuthSession(localStorage)
    let notifications = 0
    const unsubscribe = auth.subscribe(() => notifications++)

    auth.setSession({
      token: 'token-123',
      user: {
        id: 1,
        fullName: null,
        email: 'quentin@example.com',
        initials: 'QU',
        createdAt: '2026-07-15T08:00:00.000Z',
        updatedAt: '2026-07-15T08:00:00.000Z',
      },
    })
    auth.clear()
    unsubscribe()
    auth.setSession({
      token: 'another-token',
      user: {
        id: 2,
        fullName: null,
        email: 'second@example.com',
        initials: 'SE',
        createdAt: '2026-07-15T08:00:00.000Z',
        updatedAt: '2026-07-15T08:00:00.000Z',
      },
    })

    expect(notifications).toBe(2)
  })
})
