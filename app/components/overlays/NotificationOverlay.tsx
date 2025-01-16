import React from 'react'
// panels
import NotificationPanel from '../panels/NotificationPanel'

const NotificationOverlay: React.FC<any> = ({ messages = [] }: any) => {
  if (messages === null || messages.length === 0) {
    return null
  }
  return (
    <>
      <div
        aria-live='assertive'
        className='fixed z-50 inset-0 flex items-end px-4 py-20 pointer-events-none sm:items-start'
      >
        <div className='w-full flex flex-col items-center space-y-4 sm:items-end'>
          {messages.map((message: any, idx: React.Key | null | undefined) => {
            return <NotificationPanel key={idx} message={message} />
          })}
        </div>
      </div>
    </>
  )
}

export default NotificationOverlay
