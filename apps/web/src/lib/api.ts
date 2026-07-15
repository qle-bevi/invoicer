import { createTuyau } from '@tuyau/core/client'
import { registry } from '@invoicer/api/registry'

export const api = createTuyau({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3333',
  registry,
  headers: {
    Accept: 'application/json',
  },
})
