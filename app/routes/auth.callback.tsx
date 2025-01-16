import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// auth
import { authenticator } from '~/utils/auth.server'

export const loader: LoaderFunction = ({ request }: LoaderFunctionArgs) => {
  return authenticator.authenticate('keycloak', request, {
    successRedirect: '/',
    failureRedirect: '/login',
  })
}
