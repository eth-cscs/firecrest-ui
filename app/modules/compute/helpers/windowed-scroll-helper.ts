/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// Pure geometry for the windowed log view's whole-file scrollbar. Only a byte window of the file is
// ever in the DOM; everything before/after it is a blank spacer sized from an *estimate* of how
// tall the unloaded bytes would be, so the scrollbar thumb always reflects the full file. Inside
// the window the layout is exact (fixed line height, no wrapping), so a fully loaded file has no
// spacers and no estimation at all.

// Matches the pane's `leading-5`.
export const LINE_HEIGHT_PX = 20
// Matches the pane's `py-2` on the <pre>.
export const PRE_PADDING_Y_PX = 8
// Browsers cap element height (Chrome ~33M px, Firefox ~18M px). Spacers are scaled down past this
// so the scroll mapping stays valid for very large files, at the cost of no longer being 1:1.
export const MAX_TOTAL_PX = 15_000_000
export const DEFAULT_BYTES_PER_LINE = 80
// Below this many lines in the window the average line length is too noisy to replace the
// previous estimate with.
export const MIN_LINES_FOR_ESTIMATE = 50

// UTF-8 size of the code unit at `i` (a surrogate pair's 4 bytes are counted on its first half).
// File offsets are bytes while a JS string is indexed in UTF-16 code units, and the two only agree
// for pure-ASCII text - one box-drawing character is 3 bytes, for instance.
const utf8UnitBytes = (text: string, i: number): number => {
  const c = text.charCodeAt(i)
  if (c < 0x80) return 1
  if (c < 0x800) return 2
  if (c >= 0xd800 && c <= 0xdbff) {
    const next = text.charCodeAt(i + 1)
    if (next >= 0xdc00 && next <= 0xdfff) return 4
  }
  if (c >= 0xdc00 && c <= 0xdfff) {
    const prev = text.charCodeAt(i - 1)
    if (prev >= 0xd800 && prev <= 0xdbff) return 0
  }
  return 3
}

// Number of bytes `text` takes up in the (UTF-8) file.
export const utf8ByteLength = (text: string): number => {
  let bytes = 0
  for (let i = 0; i < text.length; i++) bytes += utf8UnitBytes(text, i)
  return bytes
}

// Byte offset (relative to the start of `content`) at which each line starts, so it can be added
// to bufferStart to get a file offset.
export const buildLineIndex = (content: string): Int32Array => {
  let count = 1
  for (let i = content.indexOf('\n'); i !== -1; i = content.indexOf('\n', i + 1)) count++
  const starts = new Int32Array(count)
  let line = 1
  let bytes = 0
  for (let i = 0; i < content.length; i++) {
    bytes += utf8UnitBytes(content, i)
    if (content.charCodeAt(i) === 10) starts[line++] = bytes
  }
  return starts
}

// Index of the line containing byte `byteIdx` (the last line whose start is <= byteIdx).
export const lineIndexAtByte = (lineIndex: Int32Array, byteIdx: number): number => {
  let lo = 0
  let hi = lineIndex.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (lineIndex[mid] <= byteIdx) lo = mid
    else hi = mid - 1
  }
  return lo
}

export interface ScrollLayoutInput {
  bufferStart: number
  bufferEnd: number
  fileSize: number
  lines: number
  bytesPerLine: number
}

export interface ScrollLayout extends ScrollLayoutInput {
  topPx: number
  windowPx: number
  bottomPx: number
  // Scaled px per byte, used only for the unloaded regions outside the window.
  pxPerByte: number
}

export const computeLayout = (input: ScrollLayoutInput): ScrollLayout => {
  const { bufferStart, bufferEnd, fileSize, lines, bytesPerLine } = input
  const bpl = bytesPerLine > 0 ? bytesPerLine : DEFAULT_BYTES_PER_LINE
  const unscaledPxPerByte = LINE_HEIGHT_PX / bpl
  const fullPx = fileSize * unscaledPxPerByte
  const scale = fullPx > MAX_TOTAL_PX ? MAX_TOTAL_PX / fullPx : 1
  const pxPerByte = unscaledPxPerByte * scale
  return {
    ...input,
    pxPerByte,
    topPx: bufferStart <= 0 ? 0 : bufferStart * pxPerByte,
    windowPx: lines * LINE_HEIGHT_PX + 2 * PRE_PADDING_Y_PX,
    bottomPx: bufferEnd >= fileSize ? 0 : (fileSize - bufferEnd) * pxPerByte,
  }
}

export interface ByteAnchor {
  // Absolute file offset of the start of the line (or estimated byte, in a spacer) at the
  // viewport's top edge.
  byte: number
  // Pixels the viewport's top edge sits below that point.
  intra: number
}

export const anchorForScrollTop = (
  layout: ScrollLayout,
  lineIndex: Int32Array,
  scrollTop: number,
): ByteAnchor => {
  const { topPx, windowPx, bufferStart, bufferEnd, pxPerByte } = layout
  if (scrollTop < topPx) {
    return { byte: pxPerByte > 0 ? scrollTop / pxPerByte : 0, intra: 0 }
  }
  if (scrollTop < topPx + windowPx) {
    const rel = scrollTop - topPx - PRE_PADDING_Y_PX
    if (rel < 0) return { byte: bufferStart, intra: rel }
    const line = Math.min(Math.floor(rel / LINE_HEIGHT_PX), lineIndex.length - 1)
    return { byte: bufferStart + lineIndex[line], intra: rel - line * LINE_HEIGHT_PX }
  }
  return {
    byte: bufferEnd + (pxPerByte > 0 ? (scrollTop - topPx - windowPx) / pxPerByte : 0),
    intra: 0,
  }
}

export const scrollTopForAnchor = (
  layout: ScrollLayout,
  lineIndex: Int32Array,
  anchor: ByteAnchor,
): number => {
  const { topPx, windowPx, bufferStart, bufferEnd, pxPerByte } = layout
  if (anchor.byte < bufferStart) return Math.max(0, anchor.byte * pxPerByte + anchor.intra)
  if (anchor.byte >= bufferEnd) {
    return topPx + windowPx + (anchor.byte - bufferEnd) * pxPerByte + anchor.intra
  }
  const line = lineIndexAtByte(lineIndex, anchor.byte - bufferStart)
  return topPx + PRE_PADDING_Y_PX + line * LINE_HEIGHT_PX + anchor.intra
}

// True when the viewport shows none of the loaded window - i.e. the user jumped (scrollbar drag)
// into the unloaded spacer, so paging adjacent to the window can't help and a fresh window has to
// be fetched at the estimated position instead.
export const isViewportOutsideWindow = (
  layout: ScrollLayout,
  scrollTop: number,
  clientHeight: number,
): boolean =>
  scrollTop + clientHeight <= layout.topPx || scrollTop >= layout.topPx + layout.windowPx
