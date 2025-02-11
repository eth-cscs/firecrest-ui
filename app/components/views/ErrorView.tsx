/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { Link, isRouteErrorResponse } from '@remix-run/react'

const ErrorView: React.FC<any> = ({ error }: any) => {
  let title: any = 'Something went wrong'
  let message: any = 'Sorry, an error has occurred, please retry or contact our support.'

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`
    message = error.data
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className='text-center'>
      <h1 className='mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl'>{title}</h1>
      <p className='mt-6 text-base leading-7 text-gray-600'>{message}</p>
      <div className='mt-10 flex items-center justify-center gap-x-6'>
        <Link
          to='/'
          onClick={() => {}}
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
  )
}

export default ErrorView
