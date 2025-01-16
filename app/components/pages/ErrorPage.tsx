import React from 'react'
import { Link, useRouteError, isRouteErrorResponse } from '@remix-run/react'

const ErrorPage: React.FC = () => {
  const error: any = useRouteError()

  let status = 500
  let title: any = 'Uknonw error'
  let message: any = 'Sorry, an error has occurred, please retry or contact our support.'

  if (isRouteErrorResponse(error)) {
    status = error.status
    title = error.statusText
    message = error.data
  } else if (error instanceof Error) {
    title = 'Internal server error'
    message = error.message
  }

  return (
    <>
      <div className='min-h-full bg-white py-16 px-6 sm:py-24 md:grid md:place-items-center lg:px-8'>
        <div className='mx-auto max-w-max'>
          <main className='sm:flex'>
            <p className='text-4xl font-bold tracking-tight text-red-600 sm:text-5xl'>{status}</p>
            <div className='sm:ml-6'>
              <div className='sm:border-l sm:border-gray-200 sm:pl-6'>
                <h1 className='text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl'>
                  {title}
                </h1>
                <p className='mt-2 text-base text-gray-500'>{message}</p>
              </div>
              <div className='mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6'>
                <Link
                  to='/'
                  className='inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                >
                  Go back home
                </Link>
                <a
                  href='https://support.cscs.ch'
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                >
                  Contact support
                </a>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

export default ErrorPage
