import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_guest')({
  ssr: false,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated())
      throw redirect({ to: '/', replace: true })
  },
  component: Outlet,
})
