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

// Measured empirically (2026-09-25): rendering the whole accumulated buffer as one DOM text node
// has a cost that scales with total size regardless of line-wrapping - a bare ~9.75MB/150k-line
// block took ~2.3s to set+layout in isolation, and the full app (React reconciliation + effects on
// top of that) took 10-20s+ per load once the buffer reached ~10MB. Below a few MB this is still
// comfortably fast, hence the default here - see project_windowed_log_preview_assessment memory
// for the measurements and the alternative (DOM virtualization) that was considered and deferred
// in favor of this simpler cap.
const DEFAULT_MAX_BUFFER_BYTES = 4 * 1024 * 1024

interface UseWindowedFileViewOptions {
  systemName: string
  filePath: string | null | undefined
  // Only fetches while true - lets the caller gate this behind the "view" mode toggle without
  // unmounting the hook (e.g. to keep the buffer around if the user switches back and forth).
  enabled: boolean
  pageSizeBytes?: number
  // Caps the total accumulated buffer - once loadEarlier/loadLater would push it over this, the
  // *opposite* end is trimmed back down to the cap (see DEFAULT_MAX_BUFFER_BYTES above for why).
  // Only loadEarlier/loadLater evict; jumpToStart/jumpToEnd always start over at a single page, so
  // they're never at risk of exceeding it on their own.
  maxBufferBytes?: number
  // Re-fetches the tail page on this interval while the loaded buffer reaches EOF. null/0 to
  // disable (e.g. for a completed job's static log).
  autoRefreshIntervalMs?: number | null
  // If both are given (non-negative/positive finite numbers), the very first fetch anchors at
  // this exact byte range instead of the live end - lets a caller restore a shared link's window.
  // Only consulted once, the first time this hook becomes enabled; ignored on any later re-enable
  // (e.g. toggling Tail/View back and forth), same as a plain jumpToEnd from then on.
  initialOffset?: number | null
  initialSize?: number | null
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
  // Current loaded byte range - exposed so a caller can encode "where am I" into e.g. a
  // shareable URL. Both null until `ready`.
  bufferStart: number | null
  bufferEnd: number | null
  // The page size this instance was configured with - exposed for the same reason as
  // bufferStart/bufferEnd, so a caller building a shareable window doesn't have to duplicate the
  // default/configured value.
  pageSizeBytes: number
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
  maxBufferBytes = DEFAULT_MAX_BUFFER_BYTES,
  autoRefreshIntervalMs = null,
  initialOffset = null,
  initialSize = null,
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
  // Consumed at most once - see initialOffset/initialSize on UseWindowedFileViewOptions, and the
  // mount effect and loadAndReplace below for why this is only set once a replace's response
  // actually lands, not when it's dispatched.
  const hasAppliedInitialWindowRef = useRef(false)

  const ready = bufferStart !== null && bufferEnd !== null
  const atStart = bufferStart === 0
  const atEnd = bufferEnd !== null && fileSize !== 0 && bufferEnd === fileSize

  // Shared by jumpToEnd (offset=-pageSize) and jumpToStart (offset=0): discards whatever's
  // buffered and replaces it with a single fresh window anchored at the given offset.
  const loadAndReplace = useCallback(
    (offset: number, size: number = pageSizeBytes) => {
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
      getLocalOpsView(systemName, filePath, size, offset)
        .then((response) => {
          if (gen !== replaceGenerationRef.current) return
          const view = response.output
          if (!view) return
          setContent(view.content)
          setFileSize(view.fileSize)
          setBufferStart(view.startOffset)
          setBufferEnd(view.startOffset + view.content.length)
          // Marked here (once a replace actually lands) rather than at dispatch time, so React's
          // dev-only StrictMode double-invoke of the mount effect below can't have its harmless
          // duplicate dispatch "claim" this ref before the real one's response arrives - see that
          // effect for the full explanation.
          hasAppliedInitialWindowRef.current = true
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

  // (Re)anchor at EOF whenever this view becomes enabled or the target file changes - unless a
  // valid initial window was given and hasn't been applied yet, in which case that wins once.
  // Deliberately does NOT set hasAppliedInitialWindowRef itself (see loadAndReplace) - React's
  // dev-only StrictMode double-invokes this effect once right after mount (mount -> cleanup ->
  // mount again, to catch effects that aren't safely repeatable), and if this body flipped the
  // ref synchronously, the harmless duplicate dispatch from that replay would "claim" it before
  // the real request's response comes back, permanently losing the initial window every time.
  // Redundantly dispatching the same correct request twice under that replay is harmless; letting
  // the wrong one win the race is not.
  useEffect(() => {
    if (!enabled) return
    setContent('')
    setFileSize(0)
    setBufferStart(null)
    setBufferEnd(null)
    const canUseInitialWindow =
      !hasAppliedInitialWindowRef.current &&
      initialOffset != null &&
      Number.isFinite(initialOffset) &&
      initialOffset >= 0 &&
      initialSize != null &&
      Number.isFinite(initialSize) &&
      initialSize > 0
    if (canUseInitialWindow) {
      loadAndReplace(initialOffset as number, initialSize as number)
    } else {
      jumpToEnd()
    }
  }, [enabled, systemName, filePath, jumpToEnd, loadAndReplace, initialOffset, initialSize])

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
        // Prepending grows the buffer from the start - if that pushes the total over the cap,
        // trim the excess off the *far* (end) side, since that's the content furthest from where
        // the user is currently reading. bufferEnd moves back by however much got trimmed.
        let trimmedFromEnd = 0
        setContent((prev) => {
          const merged = view.content + prev
          const overflow = merged.length - maxBufferBytes
          if (overflow <= 0) return merged
          trimmedFromEnd = overflow
          return merged.slice(0, merged.length - overflow)
        })
        setFileSize(view.fileSize)
        setBufferStart(view.startOffset)
        if (trimmedFromEnd > 0) {
          setBufferEnd((prevEnd) => (prevEnd === null ? prevEnd : prevEnd - trimmedFromEnd))
        }
      })
      .catch((err) => {
        if (gen !== replaceGenerationRef.current || seq !== earlierSeqRef.current) return
        setError(err)
      })
      .finally(() => {
        if (seq !== earlierSeqRef.current) return
        setLoadingEarlier(false)
      })
  }, [systemName, filePath, pageSizeBytes, maxBufferBytes, loadingEarlier, bufferStart])

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
        // Symmetric with loadEarlier above: appending grows the buffer from the end, so any
        // overflow is trimmed off the *start* instead - this is also what keeps a long-running
        // live tail (autoRefreshIntervalMs, which just calls this repeatedly) bounded in memory
        // rather than growing forever.
        let trimmedFromStart = 0
        setContent((prev) => {
          const merged = prev + view.content
          const overflow = merged.length - maxBufferBytes
          if (overflow <= 0) return merged
          trimmedFromStart = overflow
          return merged.slice(overflow)
        })
        setFileSize(view.fileSize)
        setBufferEnd(view.startOffset + view.content.length)
        if (trimmedFromStart > 0) {
          setBufferStart((prevStart) =>
            prevStart === null ? prevStart : prevStart + trimmedFromStart,
          )
        }
      })
      .catch((err) => {
        if (gen !== replaceGenerationRef.current || seq !== laterSeqRef.current) return
        setError(err)
      })
      .finally(() => {
        if (seq !== laterSeqRef.current) return
        setLoadingLater(false)
      })
  }, [systemName, filePath, pageSizeBytes, maxBufferBytes, loadingLater, bufferEnd])

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
    bufferStart,
    bufferEnd,
    pageSizeBytes,
    ready,
    atStart,
    atEnd,
    loadEarlier,
    loadLater,
    jumpToEnd,
    jumpToStart,
  }
}
