import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node'
// utils
import { authenticator, logoutUrl } from '~/utils/auth.server'

export const loader: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  await authenticator.logout(request, { redirectTo: logoutUrl })
}
