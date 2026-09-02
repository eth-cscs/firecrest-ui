/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

export const ABORT_DELAY_MS = 35_000
// Timeout for async data loading (deferred routes and client-side resource routes).
export const DEFERRED_PROMISE_TIMEOUT_MS = 20_000

export async function promiseWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFERRED_PROMISE_TIMEOUT_MS,
  timeoutMessage: string = 'Request timed out. Please try again.',
): Promise<T> {
  // Create a timeout promise that rejects after timeoutMs
  let timeoutId: ReturnType<typeof setTimeout>
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${timeoutMessage} (timeout after ${timeoutMs / 1000}s)`))
    }, timeoutMs)
  })

  // Race the original promise against the timeout, then clear the timer regardless of which
  // one wins - otherwise it keeps running for the rest of timeoutMs even once `promise` has
  // already settled the race.
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutId!)
  }
}

export async function promiseWithTimeoutOrDefault<T>(
  promise: Promise<T>,
  timeoutMs: number,
  defaultValue: T,
): Promise<T> {
  try {
    return await promiseWithTimeout(promise, timeoutMs)
  } catch (error) {
    return defaultValue
  }
}
