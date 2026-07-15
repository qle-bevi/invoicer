import { createMemoryHistory } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAuthSession } from './lib/auth-session'
import { typedQueryOptions } from './lib/api'
import { getRouter } from './router'

import type { Route as ApiRoute } from '@tuyau/core/types'

describe('authentication route guards', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('redirects a signed-out visitor locally without an API request', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const router = getRouter({
      auth: createAuthSession(null),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })

    await router.load()

    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toEqual({ redirect: '/' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('allows a locally authenticated visitor onto the protected home', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const auth = createAuthSession(null)
    auth.setSession({
      token: 'token-123',
      user: {
        id: 1,
        fullName: 'Quentin Martin',
        email: 'quentin@example.com',
        initials: 'QM',
        createdAt: '2026-07-15T08:00:00.000Z',
        updatedAt: '2026-07-15T08:00:00.000Z',
      },
    })
    const router = getRouter({
      auth,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })

    await router.load()

    expect(router.state.location.pathname).toBe('/')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('keeps authenticated visitors out of guest routes', async () => {
    const auth = createAuthSession(null)
    auth.setSession({
      token: 'token-123',
      user: {
        id: 1,
        fullName: null,
        email: 'quentin@example.com',
        initials: 'QU',
        createdAt: null,
        updatedAt: null,
      },
    })
    const router = getRouter({
      auth,
      history: createMemoryHistory({ initialEntries: ['/login'] }),
    })

    await router.load()

    expect(router.state.location.pathname).toBe('/')
  })

  it('disconnects and redirects when a protected query receives a 401', async () => {
    const auth = createAuthSession(null)
    auth.setSession({
      token: 'expired-token',
      user: {
        id: 1,
        fullName: null,
        email: 'quentin@example.com',
        initials: 'QU',
        createdAt: null,
        updatedAt: null,
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ message: 'Unauthorized' }, { status: 401 }),
      ),
    )
    const router = getRouter({
      auth,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    await router.load()
    const { api, queryClient } = router.options.context

    await expect(
      queryClient.fetchQuery(
        typedQueryOptions<
          ApiRoute.Response<'profile.profile.show'>,
          ApiRoute.Error<'profile.profile.show'>
        >(api.profile.profile.show.queryOptions({})),
      ),
    ).rejects.toBeInstanceOf(Error)

    expect(auth.isAuthenticated()).toBe(false)
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toEqual({ redirect: '/' })
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })
})
