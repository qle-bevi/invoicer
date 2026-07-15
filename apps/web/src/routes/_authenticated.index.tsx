import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useRouter } from '@tanstack/react-router'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { typedMutationOptions, typedQueryOptions } from '@/lib/api'

import type { Route as ApiRoute } from '@tuyau/core/types'

export const Route = createFileRoute('/_authenticated/')({
  component: Home,
})

function Home() {
  const { api, auth, queryClient } = Route.useRouteContext()
  const router = useRouter()
  const session = auth.getSnapshot()!
  const profile = useQuery(
    typedQueryOptions<
      ApiRoute.Response<'profile.profile.show'>,
      ApiRoute.Error<'profile.profile.show'>
    >(
      api.profile.profile.show.queryOptions(
        {},
        {
          initialData: { data: session.user },
          staleTime: 5 * 60 * 1000,
        },
      ),
    ),
  )
  const logout = useMutation({
    ...typedMutationOptions<
      ApiRoute.Response<'profile.access_tokens.destroy'>,
      ApiRoute.Error<'profile.access_tokens.destroy'>,
      ApiRoute.Request<'profile.access_tokens.destroy'>
    >(api.profile.accessTokens.destroy.mutationOptions()),
    onSettled: async () => {
      auth.clear()
      queryClient.clear()
      await router.navigate({
        to: '/login',
        search: { redirect: '/' },
        replace: true,
      })
      await router.invalidate()
    },
  })
  const user = profile.data?.data ?? session.user

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Bienvenue {user.fullName || user.email}</CardTitle>
          <CardDescription>Votre espace Invoicer est protégé.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              Compte connecté
            </span>
            <span>{user.email}</span>
          </div>
          {profile.isError && (
            <Alert>
              <AlertTitle>Profil non actualisé</AlertTitle>
              <AlertDescription>
                Les informations locales restent disponibles. Une nouvelle
                tentative sera faite plus tard.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            variant="outline"
            disabled={logout.isPending}
            onClick={() => logout.mutate({})}
          >
            {logout.isPending && <Spinner data-icon="inline-start" />}
            {logout.isPending ? 'Déconnexion…' : 'Se déconnecter'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
