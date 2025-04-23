/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useState, FC } from 'react'

interface JsonViewerProps {
  data: unknown
  level?: number
}

const JsonViewer: FC<JsonViewerProps> = ({ data, level = 0 }) => {
  const [collapsed, setCollapsed] = useState<boolean>(false)

  const isObject = (val: unknown): val is Record<string, unknown> =>
    typeof val === 'object' && val !== null && !Array.isArray(val)

  const toggle = () => setCollapsed(!collapsed)

  const renderValue = (val: unknown): JSX.Element => {
    if (isObject(val) || Array.isArray(val)) {
      return <JsonViewer data={val} level={level + 1} />
    }

    return <span className='text-teal-500'>{JSON.stringify(val)}</span>
  }

  if (isObject(data) || Array.isArray(data)) {
    const entries = Object.entries(data as Record<string, unknown>)
    return (
      <div className={`ml-${Math.min(level * 4, 12)}`}>
        <button
          onClick={toggle}
          className='text-blue-500 font-mono hover:underline focus:outline-none'
        >
          {collapsed ? '[+]' : '[-]'} {Array.isArray(data) ? 'Array' : 'Object'}
        </button>
        {!collapsed && (
          <div className='pl-4 border-l border-gray-300 mt-1'>
            {entries.map(([key, value], index) => (
              <div key={index} className='my-1'>
                <span className='text-purple-600 font-mono'>{key}</span>: {renderValue(value)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return <>{renderValue(data)}</>
}

export default JsonViewer
