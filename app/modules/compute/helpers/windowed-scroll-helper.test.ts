/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import {
  LINE_HEIGHT_PX,
  MAX_TOTAL_PX,
  PRE_PADDING_Y_PX,
  anchorForScrollTop,
  buildLineIndex,
  computeLayout,
  isViewportOutsideWindow,
  lineIndexAtChar,
  scrollTopForAnchor,
} from './windowed-scroll-helper'

describe('buildLineIndex / lineIndexAtChar', () => {
  it('indexes line starts, including a trailing empty line', () => {
    const idx = buildLineIndex('ab\ncde\n')
    expect(Array.from(idx)).toEqual([0, 3, 7])
    expect(lineIndexAtChar(idx, 0)).toBe(0)
    expect(lineIndexAtChar(idx, 2)).toBe(0)
    expect(lineIndexAtChar(idx, 3)).toBe(1)
    expect(lineIndexAtChar(idx, 7)).toBe(2)
  })

  it('treats empty content as a single line', () => {
    expect(Array.from(buildLineIndex(''))).toEqual([0])
  })
})

describe('computeLayout', () => {
  it('has no spacers when the whole file is loaded', () => {
    const l = computeLayout({
      bufferStart: 0,
      bufferEnd: 100,
      fileSize: 100,
      lines: 5,
      bytesPerLine: 20,
    })
    expect(l.topPx).toBe(0)
    expect(l.bottomPx).toBe(0)
    expect(l.windowPx).toBe(5 * LINE_HEIGHT_PX + 2 * PRE_PADDING_Y_PX)
  })

  it('sizes spacers from bytes at the estimated bytes per line', () => {
    const l = computeLayout({
      bufferStart: 200,
      bufferEnd: 300,
      fileSize: 1000,
      lines: 5,
      bytesPerLine: 20,
    })
    expect(l.topPx).toBe(10 * LINE_HEIGHT_PX)
    expect(l.bottomPx).toBe(35 * LINE_HEIGHT_PX)
  })

  it('scales spacers down past the browser element-height limit', () => {
    const l = computeLayout({
      bufferStart: 0,
      bufferEnd: 1000,
      fileSize: 1e12,
      lines: 10,
      bytesPerLine: 50,
    })
    expect(l.topPx + l.windowPx + l.bottomPx).toBeLessThan(MAX_TOTAL_PX * 1.01)
  })
})

describe('anchor <-> scrollTop', () => {
  const content = Array.from({ length: 100 }, (_, i) => `line ${i}`).join('\n')
  const lineIndex = buildLineIndex(content)
  const layout = computeLayout({
    bufferStart: 5000,
    bufferEnd: 5000 + content.length,
    fileSize: 20000,
    lines: lineIndex.length,
    bytesPerLine: 10,
  })

  it('round-trips a position inside the window', () => {
    const scrollTop = layout.topPx + PRE_PADDING_Y_PX + 40 * LINE_HEIGHT_PX + 7
    const anchor = anchorForScrollTop(layout, lineIndex, scrollTop)
    expect(anchor.byte).toBe(5000 + lineIndex[40])
    expect(anchor.intra).toBe(7)
    expect(scrollTopForAnchor(layout, lineIndex, anchor)).toBe(scrollTop)
  })

  it('keeps the same line in view when the window grows above it', () => {
    const scrollTop = layout.topPx + PRE_PADDING_Y_PX + 40 * LINE_HEIGHT_PX
    const anchor = anchorForScrollTop(layout, lineIndex, scrollTop)
    const prepended = 'extra a\nextra b\n'
    const newContent = prepended + content
    const newIndex = buildLineIndex(newContent)
    const newLayout = computeLayout({
      bufferStart: 5000 - prepended.length,
      bufferEnd: 5000 + content.length,
      fileSize: 20000,
      lines: newIndex.length,
      bytesPerLine: 10,
    })
    const next = scrollTopForAnchor(newLayout, newIndex, anchor)
    // Same line, now 2 lines further down in the (shorter) top spacer + window.
    const again = anchorForScrollTop(newLayout, newIndex, next)
    expect(again.byte).toBe(anchor.byte)
  })

  it('maps spacer positions via the estimate', () => {
    const anchor = anchorForScrollTop(layout, lineIndex, layout.topPx / 2)
    expect(anchor.byte).toBeCloseTo(2500)
    expect(scrollTopForAnchor(layout, lineIndex, anchor)).toBeCloseTo(layout.topPx / 2)
  })

  it('detects a viewport that shows none of the window', () => {
    expect(isViewportOutsideWindow(layout, 0, 500)).toBe(true)
    expect(isViewportOutsideWindow(layout, layout.topPx, 500)).toBe(false)
    expect(isViewportOutsideWindow(layout, layout.topPx + layout.windowPx, 500)).toBe(true)
  })
})
