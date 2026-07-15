import { createTuyau } from '@tuyau/core/client'
import { registry } from '@invoicer/api/registry'
import { createTuyauReactQueryClient } from '@tuyau/react-query'

import type { AuthSessionStore } from './auth-session'
import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'

interface CreateApiClientOptions {
  auth: AuthSessionStore
  baseUrl?: string
  onUnauthorized?: () => void | Promise<void>
}

export function createApiClient({
  auth,
  baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333',
  onUnauthorized,
}: CreateApiClientOptions) {
  const client = createTuyau({
    baseUrl,
    registry,
    headers: {
      Accept: 'application/json',
    },
    hooks: {
      beforeRequest: [
        (request) => {
          const token = auth.getSnapshot()?.token
          if (token) request.headers.set('Authorization', `Bearer ${token}`)
        },
      ],
      afterResponse: [
        async (_request, _options, response) => {
          if (response.status === 401) await onUnauthorized?.()
        },
      ],
    },
  })

  return {
    client,
    api: createTuyauReactQueryClient<typeof registry>({ client }),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>['api']

/**
 * @tuyau/react-query currently loses endpoint generics after the generated client
 * is passed through router context. Keep the runtime adapter and restore its public
 * TanStack Query types at this single compatibility seam.
 */
export function typedMutationOptions<TData, TError, TVariables>(
  options: unknown,
) {
  return options as UseMutationOptions<TData, TError, TVariables>
}

export function typedQueryOptions<TData, TError>(options: unknown) {
  return options as UseQueryOptions<TData, TError, TData>
}
