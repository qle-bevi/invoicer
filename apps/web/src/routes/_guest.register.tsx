import { useMutation } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { CircleAlertIcon } from 'lucide-react'

import { AuthCard } from '@/components/auth/auth-card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
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

export const Route = createFileRoute('/_guest/register')({
  validateSearch: (search) => ({ redirect: sanitizeRedirect(search.redirect) }),
  component: Register,
})

function Register() {
  const { redirect } = Route.useSearch()
  const { api, auth, queryClient } = Route.useRouteContext()
  const router = useRouter()
  const mutation = useMutation({
    ...typedMutationOptions<
      ApiRoute.Response<'auth.new_account.store'>,
      ApiRoute.Error<'auth.new_account.store'>,
      ApiRoute.Request<'auth.new_account.store'>
    >(api.auth.newAccount.store.mutationOptions()),
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
  const errorMessage = getAuthenticationErrorMessage(mutation.error, 'register')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    mutation.mutate({
      body: {
        fullName: String(formData.get('fullName')) || null,
        email: String(formData.get('email')),
        password: String(formData.get('password')),
        passwordConfirmation: String(formData.get('passwordConfirmation')),
      },
    })
  }

  return (
    <AuthCard
      title="Créer un compte"
      description="Renseignez vos informations pour commencer à gérer vos factures."
      footerLabel="Vous avez déjà un compte ?"
      footerLinkLabel="Se connecter"
      footerTo="/login"
      redirect={redirect}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {errorMessage && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>Inscription impossible</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <FieldGroup>
          <Field
            data-invalid={!!fieldErrors.fullName}
            data-disabled={mutation.isPending}
          >
            <FieldLabel htmlFor="fullName">Nom complet</FieldLabel>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              disabled={mutation.isPending}
              aria-invalid={!!fieldErrors.fullName}
            />
            <FieldDescription>Facultatif</FieldDescription>
            <FieldError>{fieldErrors.fullName}</FieldError>
          </Field>
          <Field
            data-invalid={!!fieldErrors.email}
            data-disabled={mutation.isPending}
          >
            <FieldLabel htmlFor="register-email">Email</FieldLabel>
            <Input
              id="register-email"
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
            <FieldLabel htmlFor="register-password">Mot de passe</FieldLabel>
            <Input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={32}
              required
              disabled={mutation.isPending}
              aria-invalid={!!fieldErrors.password}
            />
            <FieldDescription>Entre 8 et 32 caractères</FieldDescription>
            <FieldError>{fieldErrors.password}</FieldError>
          </Field>
          <Field
            data-invalid={!!fieldErrors.passwordConfirmation}
            data-disabled={mutation.isPending}
          >
            <FieldLabel htmlFor="passwordConfirmation">
              Confirmer le mot de passe
            </FieldLabel>
            <Input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={32}
              required
              disabled={mutation.isPending}
              aria-invalid={!!fieldErrors.passwordConfirmation}
            />
            <FieldError>{fieldErrors.passwordConfirmation}</FieldError>
          </Field>
        </FieldGroup>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner data-icon="inline-start" />}
          {mutation.isPending ? 'Création…' : 'Créer mon compte'}
        </Button>
      </form>
    </AuthCard>
  )
}
