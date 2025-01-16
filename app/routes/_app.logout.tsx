import { redirect } from '@remix-run/node'
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node'
// utils
import { sessionStorage, getSession } from '~/utils/session.server'

const logout = async (request: any) => {
  const session = await getSession(request.headers.get('Cookie'))
  return redirect('/', {
    headers: {
      // use await on session functions
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  })
}

export async function loader({ request }: LoaderFunctionArgs) {
  return logout(request)
}

export async function action({ request }: ActionFunctionArgs) {
  return logout(request)
}
