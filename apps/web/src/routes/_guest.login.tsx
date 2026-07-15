import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { CircleAlertIcon } from 'lucide-react'

import { AuthCard } from '@/components/auth/auth-card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  getAuthenticationErrorMessage,
  getFieldErrors,
} from '@/lib/auth-errors'
import { typedMutationOptions } from '@/lib/api'
import { sanitizeRedirect } from '../lib/auth-routing'

import type { Route as ApiRoute } from '@tuyau/core/types'

export const Route = createFileRoute('/_guest/login')({
  validateSearch: (search) => ({ redirect: sanitizeRedirect(search.redirect) }),
  component: Login,
})

function Login() {
  const { redirect } = Route.useSearch()
  const { api, auth, queryClient } = Route.useRouteContext()
  const router = useRouter()
  const mutation = useMutation({
    ...typedMutationOptions<
      ApiRoute.Response<'auth.access_tokens.store'>,
      ApiRoute.Error<'auth.access_tokens.store'>,
      ApiRoute.Request<'auth.access_tokens.store'>
    >(api.auth.accessTokens.store.mutationOptions()),
    onSuccess: async ({ data }) => {
      auth.setSession(data)
      queryClient.setQueryData(api.profile.profile.show.queryKey({}), {
        data: data.user,
      })
      router.history.push(redirect)
      await router.invalidate()
    },
  })
  const fieldErrors = getFieldErrors(mutation.error)
  const errorMessage = getAuthenticationErrorMessage(mutation.error, 'login')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    mutation.mutate({
      body: {
        email: String(formData.get('email')),
        password: String(formData.get('password')),
      },
    })
  }

  return (
    <AuthCard
      title="Connexion"
      description="Connectez-vous pour accéder à votre espace de facturation."
      footerLabel="Pas encore de compte ?"
      footerLinkLabel="Créer un compte"
      footerTo="/register"
      redirect={redirect}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {errorMessage && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>Connexion impossible</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <FieldGroup>
          <Field
            data-invalid={!!fieldErrors.email}
            data-disabled={mutation.isPending}
          >
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={mutation.isPending}
              aria-invalid={!!fieldErrors.email}
            />
            <FieldError>{fieldErrors.email}</FieldError>
          </Field>
          <Field
            data-invalid={!!fieldErrors.password}
            data-disabled={mutation.isPending}
          >
            <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={mutation.isPending}
              aria-invalid={!!fieldErrors.password}
            />
            <FieldError>{fieldErrors.password}</FieldError>
          </Field>
        </FieldGroup>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner data-icon="inline-start" />}
          {mutation.isPending ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>
    </AuthCard>
  )
}
