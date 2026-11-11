/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useEffect, useState } from 'react'
import { CheckIcon, DocumentDuplicateIcon, XMarkIcon } from '@heroicons/react/24/outline'
// helpers
import { classNames } from '~/helpers/class-helper'
// tooltips
import SimpleTooltip from '~/components/tooltips/SimpleTooltip'

// How long the "copied" / "copy failed" feedback stays before reverting to the copy icon.
const COPIED_FEEDBACK_MS = 1500

interface CopyToClipboardButtonProps {
  // A function is called at click time, e.g. for values that need `window` (not available on SSR).
  value: string | (() => string)
  // Tooltip and screen-reader text, e.g. "Copy job ID".
  label: string
  className?: string
  // Replaces the default (bare icon) button styles, e.g. to fit into a bordered button group.
  buttonClassName?: string
  // Size of the icons.
  iconClassName?: string
  tooltipClassName?: string
  // Icon shown in the idle state, e.g. a link icon for "Copy link".
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({
  value,
  label,
  className = '',
  buttonClassName = 'inline-flex flex-shrink-0 items-center rounded p-0.5 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300',
  iconClassName = 'h-4 w-4',
  tooltipClassName = 'left-0 top-6',
  icon: Icon = DocumentDuplicateIcon,
}) => {
  const [result, setResult] = useState<'copied' | 'failed' | null>(null)

  useEffect(() => {
    if (!result) return
    const timeoutId = setTimeout(() => setResult(null), COPIED_FEEDBACK_MS)
    return () => clearTimeout(timeoutId)
  }, [result])

  const onClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // Don't trigger click handlers of whatever row/link this sits in.
    event.stopPropagation()
    try {
      // navigator.clipboard only exists in secure contexts (HTTPS or localhost).
      await navigator.clipboard.writeText(typeof value === 'function' ? value() : value)
      setResult('copied')
    } catch {
      // E.g. clipboard permission denied, or not a secure context.
      setResult('failed')
    }
  }

  // The outer span keeps the icon from shrinking away when it sits next to truncated text.
  return (
    <span className='inline-flex flex-shrink-0'>
      <SimpleTooltip
        message={result === 'copied' ? 'Copied!' : result === 'failed' ? 'Copy failed' : label}
        className={tooltipClassName}
      >
        <button type='button' onClick={onClick} className={classNames(buttonClassName, className)}>
          <span className='sr-only'>
            {result === 'copied' ? 'Copied' : result === 'failed' ? 'Copy failed' : label}
          </span>
          {result === 'copied' ? (
            <CheckIcon
              aria-hidden='true'
              className={classNames(iconClassName, 'text-emerald-500')}
            />
          ) : result === 'failed' ? (
            <XMarkIcon aria-hidden='true' className={classNames(iconClassName, 'text-red-500')} />
          ) : (
            <Icon aria-hidden='true' className={iconClassName} />
          )}
        </button>
      </SimpleTooltip>
    </span>
  )
}

export default CopyToClipboardButton
