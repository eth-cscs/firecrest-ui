import React from 'react'

const DescriptionList: React.FC<any> = ({ data }: any) => {
  return (
    <dl className='divide-y divide-gray-100 w-full'>
      {data.map((row: any, idx: number) => (
        <div key={idx} className='py-2 sm:grid sm:grid-cols-3 sm:gap-4'>
          <dt className='text-sm font-medium text-gray-900'>{row.label}</dt>
          <dd className='mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0'>
            {row.content}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export default DescriptionList
