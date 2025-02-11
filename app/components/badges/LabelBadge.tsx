/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// helpers
import { classNames } from '~/helpers/class-helper'

export enum LabelColor {
  BLUE = 'blue',
  RED = 'red',
  YELLOW = 'yellow',
  ORANGE = 'orange',
  GRAY = 'gray',
  GREEN = 'green',
  BLACK = 'black',
}

const LabelBadge: React.FC<any> = ({ children, color = LabelColor.GRAY, className = '' }: any) => {
  let classes =
    'inline-flex items-center rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-600/20'
  switch (color) {
    case LabelColor.BLUE:
      classes =
        'inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20'
      break
    case LabelColor.RED:
      classes =
        'inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20'
      break
    case LabelColor.YELLOW:
      classes =
        'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
      break
    case LabelColor.ORANGE:
      classes =
        'inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20'
      break
    case LabelColor.GREEN:
      classes =
        'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20'
      break
    case LabelColor.BLACK:
      classes =
        'inline-flex items-center rounded-md bg-stone-800 px-2 py-1 text-xs font-medium text-stone-50 ring-1 ring-inset ring-stone-600/20'
      break
    default:
      break
  }
  return <span className={classNames(classes, className)}>{children}</span>
}

export default LabelBadge
