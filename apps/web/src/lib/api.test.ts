import { afterEach, describe, expect, it, vi } from 'vitest'

import { createApiClient } from './api'
import { createAuthSession } from './auth-session'

const user = {
  id: 1,
  fullName: 'Quentin Martin',
  email: 'quentin@example.com',
  initials: 'QM',
  createdAt: '2026-07-15T08:00:00.000Z',
  updatedAt: '2026-07-15T08:00:00.000Z',
}

describe('Tuyau API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('adds the local session token to requests', async () => {
    const auth = createAuthSession(null)
    auth.setSession({ token: 'token-123', user })
    let receivedRequest: Request | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(async (request: Request) => {
        receivedRequest = request
        return Response.json(user)
      }),
    )

    const { client } = createApiClient({
      auth,
      baseUrl: 'http://localhost:3333',
    })

    await client.api.profile.profile.show({})

    expect(receivedRequest?.headers.get('Authorization')).toBe(
      'Bearer token-123',
    )
  })

  it('clears the session through the unauthorized handler on a 401 response', async () => {
    const auth = createAuthSession(null)
    auth.setSession({ token: 'expired-token', user })
    const onUnauthorized = vi.fn(() => auth.clear())
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    )
    const { client } = createApiClient({
      auth,
      baseUrl: 'http://localhost:3333',
      onUnauthorized,
    })

    await expect(client.api.profile.profile.show({})).rejects.toMatchObject({
      status: 401,
    })

    expect(onUnauthorized).toHaveBeenCalledOnce()
    expect(auth.isAuthenticated()).toBe(false)
  })

  it('keeps the session for a forbidden response', async () => {
    const auth = createAuthSession(null)
    auth.setSession({ token: 'valid-token', user })
    const onUnauthorized = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ message: 'Forbidden' }, { status: 403 }),
      ),
    )
    const { client } = createApiClient({
      auth,
      baseUrl: 'http://localhost:3333',
      onUnauthorized,
    })

    await expect(client.api.profile.profile.show({})).rejects.toMatchObject({
      status: 403,
    })

    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(auth.isAuthenticated()).toBe(true)
  })

  it('keeps the session when the network request fails', async () => {
    const auth = createAuthSession(null)
    auth.setSession({ token: 'valid-token', user })
    const onUnauthorized = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Network request failed')
      }),
    )
    const { client } = createApiClient({
      auth,
      baseUrl: 'http://localhost:3333',
      onUnauthorized,
    })

    await expect(client.api.profile.profile.show({})).rejects.toThrow(
      'Network error',
    )

    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(auth.isAuthenticated()).toBe(true)
  })
})
