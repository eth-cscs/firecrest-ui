/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/
import React, { useEffect, useState, useRef, useMemo } from 'react'

interface EmbedPanelGrafanaProps {
  baseUrl: string
  jobId: string | number
  cluster: string
  nodes: string[]
  jobStartMs: number
  jobEndMs: number
  panelId?: number
  orgId?: string | number
  refresh?: string
  width?: number | string
  height?: number | string
  initialMinutes?: number
}

function buildSrc({
  baseUrl,
  jobId,
  cluster,
  nodes,
  orgId,
  panelId,
  refresh,
  fromMs,
  toMs,
}: {
  baseUrl: string
  jobId: string | number
  cluster: string
  nodes: string[]
  orgId: string | number
  panelId: number
  refresh: string
  fromMs: number
  toMs: number
}) {
  const u = new URL(
    baseUrl,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
  )
  const toStrip = [
    'from',
    'to',
    'timezone',
    'refresh',
    'orgId',
    'panelId',
    'jobId',
    'var-nid',
    'var-vcluster',
    '__feature.dashboardSceneSolo',
  ]
  toStrip.forEach((k) => u.searchParams.delete(k))
  u.searchParams.set('orgId', String(orgId))
  u.searchParams.set('panelId', String(panelId))
  u.searchParams.set('jobId', String(jobId))
  u.searchParams.set('var-vcluster', cluster)
  nodes.forEach((node) => {
    u.searchParams.append('var-nid', node)
  })
  u.searchParams.set('refresh', refresh)
  u.searchParams.set('timezone', 'browser')
  u.searchParams.set('from', String(fromMs)) // epoch ms
  u.searchParams.set('to', String(toMs))
  u.searchParams.set('__feature.dashboardSceneSolo', 'true')
  const full = u.toString()
  return full
}

/** Convert a Date to a value acceptable by <input type="datetime-local"> */
function dateToLocalInput(d: Date): string {
  // toISOString gives Z (UTC). datetime-local expects local without timezone.
  // Build manually using local parts and zero-pad.
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const MM = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`
}

/** Parse the <input type="datetime-local"> string (local time) back to a Date */
function localInputToDate(v: string): Date {
  // v like "2025-09-01T17:00"
  const [datePart, timePart] = v.split('T')
  const [y, m, d] = datePart.split('-').map((n) => parseInt(n, 10))
  const [hh, mm, ss] = timePart.split(':').map((n) => parseInt(n, 10))
  return new Date(y, m - 1, d, hh, mm, ss || 0, 0) // local time
}

interface QuickButtonProps {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}

const QuickButton: React.FC<QuickButtonProps> = ({ onClick, disabled = false, children }) => {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={[
        'rounded-xl bg-gray-50 px-3 py-2 text-sm font-medium border shadow-sm',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

const EmbedPanelGrafana: React.FC<EmbedPanelGrafanaProps> = ({
  baseUrl,
  jobId,
  cluster,
  nodes,
  jobStartMs,
  jobEndMs,
  panelId = 2,
  orgId = 1,
  refresh = '5s',
  width = '100%',
  height = 600,
  initialMinutes = 5,
}) => {
  const [minMs, maxMs] = useMemo(() => {
    const min = Number.isFinite(jobStartMs) ? jobStartMs : Date.now()
    const rawEnd = Number.isFinite(jobEndMs) ? jobEndMs : Date.now()
    let end = Math.max(rawEnd, min)
    if (end === min) end = min + 1_000
    return [min, end] as const
  }, [jobStartMs, jobEndMs])

  const durationMs = maxMs - minMs
  const [from, setFrom] = useState<Date>(() => new Date(minMs))
  const [to, setTo] = useState<Date>(() => new Date(maxMs))
  const [error, setError] = useState<string | null>(null)
  const [appliedSrc, setAppliedSrc] = useState<string>(() =>
    buildSrc({
      baseUrl,
      jobId,
      cluster,
      nodes,
      orgId,
      panelId,
      refresh,
      fromMs: minMs,
      toMs: maxMs,
    }),
  )

  const clampMs = (t: number) => Math.min(Math.max(t, minMs), maxMs)
  const clampDate = (d: Date) => new Date(clampMs(d.getTime()))

  useEffect(() => {
    const f = new Date(minMs)
    const t = new Date(maxMs)
    setFrom(f)
    setTo(t)
    setAppliedSrc(
      buildSrc({
        baseUrl,
        jobId,
        cluster,
        nodes,
        orgId,
        panelId,
        refresh,
        fromMs: minMs,
        toMs: maxMs,
      }),
    )
    setError(null)
  }, [minMs, maxMs, baseUrl, jobId, orgId, panelId, refresh])

  const presets = [
    { label: 'Last 5m', minutes: 5 },
    { label: 'Last 15m', minutes: 15 },
    { label: 'Last 1h', minutes: 60 },
    { label: 'Last 6h', minutes: 360 },
    { label: 'Last 24h', minutes: 1440 },
  ]

  function handleQuick(minutes: number) {
    const toT = new Date(clampMs(maxMs))
    const fromT = new Date(clampMs(maxMs - minutes * 60_000))
    setFrom(fromT)
    setTo(toT)
    setError(null)
  }

  function handleApply() {
    const f = clampDate(from)
    const t = clampDate(to)
    if (f.getTime() >= t.getTime()) {
      setError("'From' must be earlier than 'To'.")
      return
    }
    setError(null)
    setAppliedSrc(
      buildSrc({
        baseUrl,
        jobId,
        cluster,
        nodes,
        orgId,
        panelId,
        refresh,
        fromMs: f.getTime(),
        toMs: t.getTime(),
      }),
    )
  }

  const minInput = dateToLocalInput(new Date(minMs))
  const maxInput = dateToLocalInput(new Date(maxMs))

  const key = appliedSrc // changing key forces iframe remount (hard reload)

  return (
    <div className='w-full'>
      {/* Controls */}
      <div className='pb-4'>
        <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <label className='flex flex-col text-sm'>
              <span className='mb-1 font-medium'>From</span>
              <input
                type='datetime-local'
                step='1'
                className='border px-3 py-2 shadow-sm focus:outline-none focus:ring-2'
                value={dateToLocalInput(from)}
                min={minInput}
                max={maxInput}
                onChange={(e) => setFrom(clampDate(localInputToDate(e.target.value)))}
              />
            </label>
            <label className='flex flex-col text-sm'>
              <span className='mb-1 font-medium'>To</span>
              <input
                type='datetime-local'
                step='1'
                className='border px-3 py-2 shadow-sm focus:outline-none focus:ring-2'
                value={dateToLocalInput(to)}
                min={minInput}
                max={maxInput}
                onChange={(e) => setTo(clampDate(localInputToDate(e.target.value)))}
              />
            </label>
          </div>

          <div className='flex flex-wrap gap-2'>
            {presets.map((p) => {
              const disabled = durationMs < p.minutes * 60_000
              return (
                <QuickButton
                  key={p.minutes}
                  onClick={() => handleQuick(p.minutes)}
                  disabled={disabled}
                >
                  {p.label}
                </QuickButton>
              )
            })}
            <button
              className='border rounded-xl px-4 py-2 font-medium shadow-sm hover:shadow transition'
              onClick={handleApply}
              title='Reload the iframe with the selected time range'
            >
              Apply
            </button>
          </div>
        </div>
        {error && <div className='text-sm text-red-600'>{error}</div>}
      </div>
      {/* Iframe */}
      <div className='overflow-hidden border'>
        <iframe
          title={`Grafana panel ${panelId}`}
          key={key}
          src={appliedSrc}
          // width={typeof width === 'number' ? String(width) : width}
          // height={typeof height === 'number' ? String(height) : height}
          // style={{ border: 0, width: typeof width === 'number' ? `${width}px` : width }}
          loading='lazy'
          referrerPolicy='no-referrer'
          className='w-full h-[600px] border-0'
        />
      </div>
    </div>
  )
}

export default EmbedPanelGrafana
