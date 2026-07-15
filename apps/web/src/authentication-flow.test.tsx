import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAuthSession } from './lib/auth-session'
import { getRouter } from './router'

const user = {
  id: 1,
  fullName: 'Quentin Martin',
  email: 'quentin@example.com',
  initials: 'QM',
  createdAt: '2026-07-15T08:00:00.000Z',
  updatedAt: '2026-07-15T08:00:00.000Z',
}

describe('authentication flow', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('signs in, persists the session and returns to the protected destination', async () => {
    vi.stubGlobal('scrollTo', vi.fn())
    const auth = createAuthSession(null)
    let requestBody: unknown
    vi.stubGlobal(
      'fetch',
      vi.fn(async (request: Request) => {
        requestBody = await request.clone().json()
        return Response.json({ data: { token: 'token-123', user } })
      }),
    )
    const router = getRouter({
      auth,
      history: createMemoryHistory({ initialEntries: ['/login?redirect=%2F'] }),
    })
    await router.load()

    render(<RouterProvider router={router} />)
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'quentin@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Mot de passe'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))

    expect(requestBody).toEqual({
      email: 'quentin@example.com',
      password: 'password123',
    })
    expect(auth.getSnapshot()).toEqual({ token: 'token-123', user })
    expect(
      router.options.context.queryClient.getQueryData(
        router.options.context.api.profile.profile.show.queryKey({}),
      ),
    ).toEqual({ data: user })
  })

  it('creates an account with the typed registration mutation', async () => {
    vi.stubGlobal('scrollTo', vi.fn())
    const auth = createAuthSession(null)
    let requestBody: unknown
    vi.stubGlobal(
      'fetch',
      vi.fn(async (request: Request) => {
        requestBody = await request.clone().json()
        return Response.json({ data: { token: 'new-token', user } })
      }),
    )
    const router = getRouter({
      auth,
      history: createMemoryHistory({ initialEntries: ['/register'] }),
    })
    await router.load()

    render(<RouterProvider router={router} />)
    fireEvent.change(screen.getByLabelText('Nom complet'), {
      target: { value: 'Quentin Martin' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'quentin@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Mot de passe'), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))

    expect(requestBody).toEqual({
      fullName: 'Quentin Martin',
      email: 'quentin@example.com',
      password: 'password123',
      passwordConfirmation: 'password123',
    })
    expect(auth.getSnapshot()).toEqual({ token: 'new-token', user })
  })

  it('shows an invalid credentials error without creating a session', async () => {
    vi.stubGlobal('scrollTo', vi.fn())
    const auth = createAuthSession(null)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ message: 'Invalid credentials' }, { status: 400 }),
      ),
    )
    const router = getRouter({
      auth,
      history: createMemoryHistory({ initialEntries: ['/login'] }),
    })
    await router.load()

    render(<RouterProvider router={router} />)
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'quentin@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Mot de passe'), {
      target: { value: 'wrong-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(
      await screen.findByText('Email ou mot de passe incorrect.'),
    ).toBeTruthy()
    expect(auth.isAuthenticated()).toBe(false)
  })

  it('shows server validation errors on their registration fields', async () => {
    vi.stubGlobal('scrollTo', vi.fn())
    const auth = createAuthSession(null)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          {
            errors: [
              { field: 'email', message: 'Cet email est déjà utilisé.' },
            ],
          },
          { status: 422 },
        ),
      ),
    )
    const router = getRouter({
      auth,
      history: createMemoryHistory({ initialEntries: ['/register'] }),
    })
    await router.load()

    render(<RouterProvider router={router} />)
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'existing@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Mot de passe'), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(await screen.findByText('Cet email est déjà utilisé.')).toBeTruthy()
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe(
      'true',
    )
    expect(auth.isAuthenticated()).toBe(false)
  })

  it('clears the local session even when remote logout fails', async () => {
    vi.stubGlobal('scrollTo', vi.fn())
    const auth = createAuthSession(null)
    auth.setSession({ token: 'token-123', user })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline')
      }),
    )
    const router = getRouter({
      auth,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    await router.load()

    render(<RouterProvider router={router} />)
    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(auth.isAuthenticated()).toBe(false)
  })
})
