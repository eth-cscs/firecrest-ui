/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import { classNames } from '~/helpers/class-helper'

const SimpleTooltip: React.FC<any> = ({ children, message, className = '', id }: any) => {
  return (
    <div className='group relative inline-flex'>
      {children}
      {/* Also shown while something inside has keyboard focus (:focus-visible, so it doesn't
          stick after a mouse click), not only on hover. Pass `id` to link it to its trigger
          via aria-describedby. */}
      <span
        id={id}
        role='tooltip'
        className={classNames(
          'absolute min-w-fit z-50 top-6 scale-0 transition-all rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100 group-has-[:focus-visible]:scale-100',
          className,
        )}
      >
        {message}
      </span>
    </div>
  )
}

export default SimpleTooltip
