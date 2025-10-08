/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { useState } from 'react'
import { CheckIcon, DocumentDuplicateIcon } from '@heroicons/react/24/solid'
// helpers
import { classNames } from '~/helpers/class-helper'

interface TemplatedCodeBlockProps {
  code: string
  className?: string
}

const TemplateCodeBlock: React.FC<TemplatedCodeBlockProps> = ({
  code,
  className = '',
}: TemplatedCodeBlockProps) => {
  const [copied, setCopied] = useState(false)

  const onClickHandler = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className='relative'>
      <div
        className={classNames(
          'block overflow-x-auto p-3 pr-10 border border-gray-300 rounded-md bg-gray-100 text-xs font-mono whitespace-pre',
          className,
        )}
      >
        {code}
      </div>

      <div className='absolute top-2 right-2'>
        {copied ? (
          <CheckIcon className='h-4 w-4 text-emerald-500 cursor-pointer' aria-hidden='true' />
        ) : (
          <DocumentDuplicateIcon
            onClick={onClickHandler}
            className='h-4 w-4 text-gray-500 cursor-pointer'
            aria-hidden='true'
          />
        )}
      </div>
    </div>
  )
}

export default TemplateCodeBlock
