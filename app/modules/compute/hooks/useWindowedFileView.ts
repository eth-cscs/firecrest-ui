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
  // True while any fetch is in flight - for a generic "Loading..." indicator only. The four
  // controls each disable off their own direction's flag below instead, so a background
  // auto-refresh tick (which only ever extends forward) can't flicker-disable the backward
  // controls, and vice versa - see loadingEarlier/loadingLater.
  loading: boolean
  // Jump-to-start/jump-to-end replace the whole buffer, so both directions are transiently
  // unknown while one is in flight - Load top and Load bottom key off this.
  loadingReplace: boolean
  // Load earlier keys off this alone (not loadingLater) - a background auto-refresh extending
  // the live end shouldn't disable backward paging.
  loadingEarlier: boolean
  // Load later/auto-refresh keys off this alone (not loadingEarlier) - paging backward shouldn't
  // disable the forward controls either.
  loadingLater: boolean
  error: unknown
  // False until the first fetch actually resolves (buffer position is still unknown - e.g.
  // still loading, or the initial fetch errored). atStart/atEnd are meaningless before this is
  // true and callers should treat position-relative actions as unavailable until then, rather
  // than reading atStart/atEnd as false-because-unknown ("not confirmed at start" is not the
  // same claim as "confirmed not at start").
  ready: boolean
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
  const [loadingReplace, setLoadingReplace] = useState(false)
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const [loadingLater, setLoadingLater] = useState(false)
  const [error, setError] = useState<unknown>(null)

  // Separate per-direction sequence counters, so a backward loadEarlier fetch and a forward
  // loadLater fetch (e.g. the background auto-refresh) never invalidate each other just for
  // being concurrent - they touch different halves of the buffer (bufferStart vs bufferEnd) and
  // are not actually in conflict. `replaceGenerationRef` is bumped by jumpToStart/jumpToEnd
  // (which discard the whole buffer) and is checked by all three, so a reset still correctly
  // drops any earlier/later fetch that was already in flight.
  const replaceGenerationRef = useRef(0)
  const earlierSeqRef = useRef(0)
  const laterSeqRef = useRef(0)

  const ready = bufferStart !== null && bufferEnd !== null
  const atStart = bufferStart === 0
  const atEnd = bufferEnd !== null && fileSize !== 0 && bufferEnd === fileSize

  // Shared by jumpToEnd (offset=-pageSize) and jumpToStart (offset=0): discards whatever's
  // buffered and replaces it with a single fresh window anchored at the given offset.
  const loadAndReplace = useCallback(
    (offset: number) => {
      if (!filePath) return
      const gen = ++replaceGenerationRef.current
      // Bumping these too means an earlier/later fetch already in flight can no longer apply its
      // (now stale, buffer-relative) result once this resolves - see the two generation checks
      // below. Their own `finally` will then skip resetting the flag (its seq no longer matches),
      // so clear both directly here rather than leaving them stuck at true with nothing in flight.
      ++earlierSeqRef.current
      ++laterSeqRef.current
      setLoadingEarlier(false)
      setLoadingLater(false)
      setLoadingReplace(true)
      setError(null)
      getLocalOpsView(systemName, filePath, pageSizeBytes, offset)
        .then((response) => {
          if (gen !== replaceGenerationRef.current) return
          const view = response.output
          if (!view) return
          setContent(view.content)
          setFileSize(view.fileSize)
          setBufferStart(view.startOffset)
          setBufferEnd(view.startOffset + view.content.length)
        })
        .catch((err) => {
          if (gen !== replaceGenerationRef.current) return
          setError(err)
        })
        .finally(() => {
          if (gen !== replaceGenerationRef.current) return
          setLoadingReplace(false)
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
    if (!filePath || loadingEarlier || bufferStart === null || bufferStart === 0) return
    const gen = replaceGenerationRef.current
    const seq = ++earlierSeqRef.current
    // Requesting a negative offset means "relative to EOF" on the backend, not "clamp to BOF" -
    // so when the previous page would go negative, request exactly what's left up to BOF instead.
    const size = Math.min(pageSizeBytes, bufferStart)
    const offset = bufferStart - size
    setLoadingEarlier(true)
    setError(null)
    getLocalOpsView(systemName, filePath, size, offset)
      .then((response) => {
        if (gen !== replaceGenerationRef.current || seq !== earlierSeqRef.current) return
        const view = response.output
        if (!view) return
        setContent((prev) => view.content + prev)
        setFileSize(view.fileSize)
        setBufferStart(view.startOffset)
      })
      .catch((err) => {
        if (gen !== replaceGenerationRef.current || seq !== earlierSeqRef.current) return
        setError(err)
      })
      .finally(() => {
        if (seq !== earlierSeqRef.current) return
        setLoadingEarlier(false)
      })
  }, [systemName, filePath, pageSizeBytes, loadingEarlier, bufferStart])

  const loadLater = useCallback(() => {
    if (!filePath || loadingLater || bufferEnd === null) return
    const gen = replaceGenerationRef.current
    const seq = ++laterSeqRef.current
    setLoadingLater(true)
    setError(null)
    getLocalOpsView(systemName, filePath, pageSizeBytes, bufferEnd)
      .then((response) => {
        if (gen !== replaceGenerationRef.current || seq !== laterSeqRef.current) return
        const view = response.output
        if (!view) return
        setContent((prev) => prev + view.content)
        setFileSize(view.fileSize)
        setBufferEnd(view.startOffset + view.content.length)
      })
      .catch((err) => {
        if (gen !== replaceGenerationRef.current || seq !== laterSeqRef.current) return
        setError(err)
      })
      .finally(() => {
        if (seq !== laterSeqRef.current) return
        setLoadingLater(false)
      })
  }, [systemName, filePath, pageSizeBytes, loadingLater, bufferEnd])

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
    loading: loadingReplace || loadingEarlier || loadingLater,
    loadingReplace,
    loadingEarlier,
    loadingLater,
    error,
    ready,
    atStart,
    atEnd,
    loadEarlier,
    loadLater,
    jumpToEnd,
    jumpToStart,
  }
}
