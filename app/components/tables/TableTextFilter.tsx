import React from 'react'
// utils
import { useAsyncDebounce } from '~/helpers/debounce-helper'

const TableTextFilter: React.FC<any> = ({ textFilter, setTextFilter, totalRecords }: any) => {
  const [value, setValue] = React.useState(textFilter)
  const onChange = useAsyncDebounce((value: string) => {
    setTextFilter(value || undefined)
  }, 200)

  return (
    <label className='flex gap-x-2 items-baseline text-right'>
      <span className='text-gray-700'>Search: </span>
      <input
        type='text'
        className='rounded-md border-gray-300 shadow-sm focus:border-gray-300 focus:ring-gray-300'
        value={value || ''}
        onChange={(e) => {
          setValue(e.target.value)
          onChange(e.target.value)
        }}
        placeholder={`${totalRecords | 0} records...`}
      />
    </label>
  )
}

export default TableTextFilter
