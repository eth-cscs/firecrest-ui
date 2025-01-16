import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// utils
import { authenticator } from '~/utils/auth.server'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  return await authenticator.authenticate('keycloak', request, {
    successRedirect: '/',
    failureRedirect: '/login',
  })
}
