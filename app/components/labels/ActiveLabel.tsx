import React from 'react'
// utils
import { classNames } from '~/helpers/class-helper'

export const getClassColor = (active: boolean) => {
  if (active) {
    return 'bg-green-50 text-green-700 ring-green-600/20'
  }
  return 'bg-red-50 text-red-700 ring-red-600/20'
}

export const getText = (active: boolean) => {
  if (active) {
    return 'Active'
  }
  return 'Inactive'
}

const ActiveLabel: React.FC<any> = ({ active, whiteBackground = true, className = '' }: any) => {
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
        className,
        getClassColor(active),
      )}
    >
      {getText(active)}
    </span>
  )
}

export default ActiveLabel
