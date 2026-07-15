import { QueryClient } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { TuyauError } from '@tuyau/core/client'
import { routeTree } from './routeTree.gen'
import { createApiClient } from './lib/api'
import { sanitizeRedirect } from './lib/auth-routing'
import { createAuthSession } from './lib/auth-session'

import type { ApiClient } from './lib/api'
import type { AuthSessionStore } from './lib/auth-session'
import type { createMemoryHistory } from '@tanstack/react-router'

export interface RouterContext {
  api: ApiClient
  auth: AuthSessionStore
  queryClient: QueryClient
}

function isGuestRoute(href: string) {
  const pathname = new URL(href, 'http://localhost').pathname
  return pathname === '/login' || pathname === '/register'
}

interface GetRouterOptions {
  auth?: AuthSessionStore
  history?: ReturnType<typeof createMemoryHistory>
}

export function getRouter({
  auth = createAuthSession(),
  history,
}: GetRouterOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (
            error instanceof TuyauError &&
            [401, 422].includes(error.status ?? 0)
          )
            return false
          return failureCount < 1
        },
      },
      mutations: { retry: false },
    },
  })

  const { api } = createApiClient({
    auth,
    onUnauthorized: async () => {
      const currentHref = router.state.location.href
      auth.clear()
      queryClient.clear()

      await router.navigate({
        to: '/login',
        search: {
          redirect: isGuestRoute(currentHref)
            ? '/'
            : sanitizeRedirect(currentHref),
        },
        replace: true,
      })
      await router.invalidate()
    },
  })

  const router = createTanStackRouter({
    routeTree,
    context: { api, auth, queryClient },
    history,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
