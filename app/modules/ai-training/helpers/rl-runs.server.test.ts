/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { TEST_RECIPES } from '~/modules/ai-training/recipes/__fixtures__/test-recipes'

const COMMIT = '02b53404ede830a3b841eecfd4d1103cd52337c3'
const BRANCH_URL = 'https://raw.githubusercontent.com/eth-cscs/alps-extended-images/rl-runs'

// Loads the module afresh, so the remembered branch head doesn't carry over between tests
const loadHistory = () => {
  let module: typeof import('~/modules/ai-training/helpers/rl-runs.server')
  jest.isolateModules(() => {
    module = jest.requireActual('~/modules/ai-training/helpers/rl-runs.server')
  })
  return module!.getRlRunHistory
}

const mockFetch = (headResponse: () => Promise<Response>) => {
  const fetchMock = jest.fn(async (url: string) => {
    if (url.startsWith('https://api.github.com/')) return headResponse()
    return new Response('not found', { status: 404 })
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

const indexUrls = (fetchMock: jest.Mock) =>
  fetchMock.mock.calls.map(([url]) => url).filter((url: string) => url.endsWith('/index.json'))

describe('getRlRunHistory', () => {
  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('reads the index files at the commit the branch points to', async () => {
    const fetchMock = mockFetch(async () => new Response(`${COMMIT}\n`))
    const history = await loadHistory()(TEST_RECIPES)
    expect(history.unavailableRecipeIds).toEqual([])
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/eth-cscs/alps-extended-images/commits/rl-runs',
    )
    expect(indexUrls(fetchMock)).toHaveLength(TEST_RECIPES.length)
    indexUrls(fetchMock).forEach((url: string) =>
      expect(
        url.startsWith(
          `https://raw.githubusercontent.com/eth-cscs/alps-extended-images/${COMMIT}/`,
        ),
      ).toBe(true),
    )
  })

  it('looks the commit up again only every few minutes', async () => {
    const fetchMock = mockFetch(async () => new Response(COMMIT))
    const getRlRunHistory = loadHistory()
    await getRlRunHistory(TEST_RECIPES)
    await getRlRunHistory(TEST_RECIPES)
    const lookups = fetchMock.mock.calls.filter(([url]) =>
      url.startsWith('https://api.github.com/'),
    )
    expect(lookups).toHaveLength(1)
  })

  it('falls back to the branch when the commit cannot be looked up', async () => {
    const fetchMock = mockFetch(async () => new Response('rate limited', { status: 403 }))
    await loadHistory()(TEST_RECIPES)
    expect(indexUrls(fetchMock)).toHaveLength(TEST_RECIPES.length)
    indexUrls(fetchMock).forEach((url: string) =>
      expect(url.startsWith(`${BRANCH_URL}/`)).toBe(true),
    )
  })
})
