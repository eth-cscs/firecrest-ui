import { useState } from 'react'
import { CheckIcon, DocumentDuplicateIcon } from '@heroicons/react/24/solid'
// helpers
import { classNames } from '~/helpers/class-helper'

const CodeBlock: React.FC<any> = ({ code, className = '' }: any) => {
  const [copy, setCopy] = useState(false)
  const onClickHandler = () => {
    navigator.clipboard.writeText(code)
    setCopy(true)
  }
  return (
    <div>
      <div
        className={classNames(
          'block overflow-x-scroll p-2 pr-10 border border-gray-300 rounded-md bg-gray-100 text-xs', // whitespace-pre
          className,
        )}
      >
        {code.split('\\n').map((codeLine: any, index: number) => {
          return <p key={index}>{codeLine}</p>
        })}
      </div>
      <div className='flex justify-end'>
        <div className='spacer' />
        <div style={{ marginTop: '-24px' }} className='z-10'>
          {copy ? (
            <CheckIcon
              className='mr-1 mb-2 mr-2 h-4 w-4 text-emerald-500 cursor-pointer'
              aria-hidden='true'
            />
          ) : (
            <DocumentDuplicateIcon
              onClick={() => onClickHandler()}
              className='mr-1 mb-2 mr-2 h-4 w-4 text-gray-500 cursor-pointer line-'
              aria-hidden='true'
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default CodeBlock
