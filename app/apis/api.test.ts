/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import api, { ApiTarget } from '~/apis/api'

jest.mock('~/configs/firecrest.config', () => ({
  __esModule: true,
  default: { baseUrl: 'https://firecrest.example' },
}))

const mockFetch = (body: string, init: ResponseInit) => {
  global.fetch = jest.fn().mockResolvedValue(new Response(body, init))
}

const rejection = async (promise: Promise<unknown>): Promise<any> => {
  try {
    await promise
  } catch (error) {
    return error
  }
  throw new Error('expected the request to fail')
}

describe('api error responses', () => {
  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('keeps the real status for a plain-text proxy error instead of a JSON SyntaxError', async () => {
    mockFetch('Bad Gateway', { status: 502, headers: { 'content-type': 'text/plain' } })
    const error = await rejection(api.get('/status/systems'))
    expect(error).toBeInstanceOf(Response)
    expect(error.status).toBe(502)
    expect(error.statusText).toBe('Bad Gateway')
    expect(await error.text()).toBe('Bad Gateway')
  })

  it('uses the backend message from a JSON error body', async () => {
    mockFetch(JSON.stringify({ message: "Token's public key not found." }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    })
    const error = await rejection(api.get('/status/systems'))
    expect(error.status).toBe(401)
    expect(await error.text()).toBe("Token's public key not found.")
  })

  it('falls back to the reason phrase when the error body is empty', async () => {
    mockFetch('', { status: 504 })
    const error = await rejection(api.get('/status/systems'))
    expect(error.status).toBe(504)
    expect(await error.text()).toBe('Gateway Timeout')
  })

  it('throws the parsed body as-is for local API routes', async () => {
    const body = { error: { message: 'boom', statusCode: 500 } }
    mockFetch(JSON.stringify(body), { status: 500 })
    const error = await rejection(api.get('/api/thing', {}, ApiTarget.API_LOCAL))
    expect(error).toEqual(body)
  })

  it('still parses successful JSON responses', async () => {
    mockFetch(JSON.stringify({ systems: [] }), { status: 200 })
    await expect(api.get('/status/systems')).resolves.toEqual({ systems: [] })
  })
})
