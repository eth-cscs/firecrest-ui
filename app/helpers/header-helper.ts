const getProgressiveLoadingLimit = (request: any) => {
  const url = new URL(request.url)
  const progressiveLoadingLimit = url.searchParams.get('progressiveLoadingLimit')
  if (progressiveLoadingLimit) {
    return parseInt(progressiveLoadingLimit)
  }
  return null // default in the backend
}

export { getProgressiveLoadingLimit }
