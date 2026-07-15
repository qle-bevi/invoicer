import { TuyauError } from '@tuyau/core/client'

interface ValidationIssue {
  field?: string
  message?: string
}

export function getFieldErrors(error: unknown) {
  if (!(error instanceof TuyauError) || !error.isValidationError()) return {}

  const response = error.response as { errors?: ValidationIssue[] } | undefined
  return Object.fromEntries(
    (response?.errors ?? [])
      .filter(
        (issue): issue is Required<ValidationIssue> =>
          !!issue.field && !!issue.message,
      )
      .map((issue) => [issue.field, issue.message]),
  )
}

export function getAuthenticationErrorMessage(
  error: unknown,
  mode: 'login' | 'register',
) {
  if (!error) return null
  if (error instanceof TuyauError) {
    if (error.isValidationError()) return null
    if (mode === 'login' && (error.status === 400 || error.status === 401)) {
      return 'Email ou mot de passe incorrect.'
    }
    if (error.kind === 'network') {
      return 'Le serveur est temporairement indisponible. Réessayez dans quelques instants.'
    }
  }

  return mode === 'login'
    ? 'Impossible de vous connecter pour le moment.'
    : 'Impossible de créer votre compte pour le moment.'
}
