import React from 'react'

export function useGetLatest(obj: any) {
  const ref = React.useRef()
  ref.current = obj

  return React.useCallback(() => ref.current, [])
}

export function useAsyncDebounce(defaultFn: any, defaultWait = 0) {
  const debounceRef: any = React.useRef({})

  const getDefaultFn: any = useGetLatest(defaultFn)
  const getDefaultWait: any = useGetLatest(defaultWait)

  return React.useCallback(
    async (...args: any) => {
      if (!debounceRef.current.promise) {
        debounceRef.current.promise = new Promise((resolve, reject) => {
          debounceRef.current.resolve = resolve
          debounceRef.current.reject = reject
        })
      }

      if (debounceRef.current.timeout) {
        clearTimeout(debounceRef.current.timeout)
      }

      debounceRef.current.timeout = setTimeout(async () => {
        delete debounceRef.current.timeout
        try {
          debounceRef.current.resolve(await getDefaultFn()(...args))
        } catch (err) {
          debounceRef.current.reject(err)
        } finally {
          delete debounceRef.current.promise
        }
      }, getDefaultWait())

      return debounceRef.current.promise
    },
    [getDefaultFn, getDefaultWait],
  )
}
