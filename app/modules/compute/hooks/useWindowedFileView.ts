/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useCallback, useEffect, useRef, useState } from 'react'
// apis
import { getLocalOpsView } from '~/apis/filesystem-api'

// TODO: 64 KiB is a placeholder default. Once this is validated against a real backend running
// the `Extends-view-for-top-and-bottom-offset` branch, revisit based on observed `/ops/view`
// response times and typical log line length - also worth clamping against
// `system.dataOperation.max_ops_file_size` rather than hardcoding.
const DEFAULT_PAGE_SIZE_BYTES = 64 * 1024

interface UseWindowedFileViewOptions {
  systemName: string
  filePath: string | null | undefined
  // Only fetches while true - lets the caller gate this behind the "view" mode toggle without
  // unmounting the hook (e.g. to keep the buffer around if the user switches back and forth).
  enabled: boolean
  pageSizeBytes?: number
  // Re-fetches the tail page on this interval while the loaded buffer reaches EOF. null/0 to
  // disable (e.g. for a completed job's static log).
  autoRefreshIntervalMs?: number | null
}

export interface UseWindowedFileViewResult {
  content: string
  fileSize: number
  loading: boolean
  error: unknown
  // True once the loaded buffer reaches the beginning of the file - i.e. "load earlier" has
  // nothing left to fetch.
  atStart: boolean
  // True while the loaded buffer reaches the current end of the file.
  atEnd: boolean
  loadEarlier: () => void
  loadLater: () => void
  // Discards the buffer and re-anchors at EOF, same as the initial load.
  jumpToEnd: () => void
  // Discards the buffer and re-anchors at BOF.
  jumpToStart: () => void
}

// Byte-windowed pagination over `GET /ops/view` (see firecrest-v2's
// `Extends-view-for-top-and-bottom-offset` branch): pages are always fetched byte-exact adjacent
// to what's already buffered (never overlapping, never gapped), so adjacent windows concatenate
// back into clean text with no line-boundary handling needed on this side - see
// project_windowed_log_preview_assessment memory for why. The one exception is `loadEarlier`
// near BOF, where a plain `bufferStart - pageSize` would go negative and be reinterpreted as an
// EOF-relative offset by the backend rather than "clamp to BOF" - guarded against below.
export const useWindowedFileView = ({
  systemName,
  filePath,
  enabled,
  pageSizeBytes = DEFAULT_PAGE_SIZE_BYTES,
  autoRefreshIntervalMs = null,
}: UseWindowedFileViewOptions): UseWindowedFileViewResult => {
  const [content, setContent] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [bufferStart, setBufferStart] = useState<number | null>(null)
  const [bufferEnd, setBufferEnd] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  // Guards against out-of-order responses (e.g. a slow "load earlier" landing after a later
  // `jumpToEnd` reset) clobbering newer state.
  const requestSeqRef = useRef(0)

  const atStart = bufferStart === 0
  const atEnd = bufferEnd !== null && fileSize !== 0 && bufferEnd === fileSize

  // Shared by jumpToEnd (offset=-pageSize) and jumpToStart (offset=0): discards whatever's
  // buffered and replaces it with a single fresh window anchored at the given offset.
  const loadAndReplace = useCallback(
    (offset: number) => {
      if (!filePath) return
      const seq = ++requestSeqRef.current
      setLoading(true)
      setError(null)
      getLocalOpsView(systemName, filePath, pageSizeBytes, offset)
        .then((response) => {
          if (seq !== requestSeqRef.current) return
          const view = response.output
          if (!view) return
          setContent(view.content)
          setFileSize(view.fileSize)
          setBufferStart(view.startOffset)
          setBufferEnd(view.startOffset + view.content.length)
        })
        .catch((err) => {
          if (seq !== requestSeqRef.current) return
          setError(err)
        })
        .finally(() => {
          if (seq !== requestSeqRef.current) return
          setLoading(false)
        })
    },
    [systemName, filePath, pageSizeBytes],
  )
  const jumpToEnd = useCallback(
    () => loadAndReplace(-pageSizeBytes),
    [loadAndReplace, pageSizeBytes],
  )
  const jumpToStart = useCallback(() => loadAndReplace(0), [loadAndReplace])

  // (Re)anchor at EOF whenever this view becomes enabled or the target file changes.
  useEffect(() => {
    if (!enabled) return
    setContent('')
    setFileSize(0)
    setBufferStart(null)
    setBufferEnd(null)
    jumpToEnd()
  }, [enabled, systemName, filePath, jumpToEnd])

  const loadEarlier = useCallback(() => {
    if (!filePath || loading || bufferStart === null || bufferStart === 0) return
    const seq = ++requestSeqRef.current
    // Requesting a negative offset means "relative to EOF" on the backend, not "clamp to BOF" -
    // so when the previous page would go negative, request exactly what's left up to BOF instead.
    const size = Math.min(pageSizeBytes, bufferStart)
    const offset = bufferStart - size
    setLoading(true)
    setError(null)
    getLocalOpsView(systemName, filePath, size, offset)
      .then((response) => {
        if (seq !== requestSeqRef.current) return
        const view = response.output
        if (!view) return
        setContent((prev) => view.content + prev)
        setFileSize(view.fileSize)
        setBufferStart(view.startOffset)
      })
      .catch((err) => {
        if (seq !== requestSeqRef.current) return
        setError(err)
      })
      .finally(() => {
        if (seq !== requestSeqRef.current) return
        setLoading(false)
      })
  }, [systemName, filePath, pageSizeBytes, loading, bufferStart])

  const loadLater = useCallback(() => {
    if (!filePath || loading || bufferEnd === null) return
    const seq = ++requestSeqRef.current
    setLoading(true)
    setError(null)
    getLocalOpsView(systemName, filePath, pageSizeBytes, bufferEnd)
      .then((response) => {
        if (seq !== requestSeqRef.current) return
        const view = response.output
        if (!view) return
        setContent((prev) => prev + view.content)
        setFileSize(view.fileSize)
        setBufferEnd(view.startOffset + view.content.length)
      })
      .catch((err) => {
        if (seq !== requestSeqRef.current) return
        setError(err)
      })
      .finally(() => {
        if (seq !== requestSeqRef.current) return
        setLoading(false)
      })
  }, [systemName, filePath, pageSizeBytes, loading, bufferEnd])

  // Auto-refresh: only while anchored at EOF, and only ever extends the buffer forward (reuses
  // loadLater rather than resetting), so it never disturbs content the user has scrolled up into.
  useEffect(() => {
    if (!enabled || !autoRefreshIntervalMs || !atEnd) return
    const intervalId = setInterval(loadLater, autoRefreshIntervalMs)
    return () => clearInterval(intervalId)
  }, [enabled, autoRefreshIntervalMs, atEnd, loadLater])

  return {
    content,
    fileSize,
    loading,
    error,
    atStart,
    atEnd,
    loadEarlier,
    loadLater,
    jumpToEnd,
    jumpToStart,
  }
}
