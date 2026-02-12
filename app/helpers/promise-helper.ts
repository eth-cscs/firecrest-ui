/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

export async function promiseWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  timeoutMessage: string = 'Request timed out. Please try again.',
): Promise<T> {
  // Create a timeout promise that rejects after timeoutMs
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${timeoutMessage} (timeout after ${timeoutMs / 1000}s)`))
    }, timeoutMs)
  })

  // Race the original promise against the timeout
  return Promise.race([promise, timeoutPromise])
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
