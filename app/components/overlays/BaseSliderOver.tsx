import React, { Fragment } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Dialog, Transition } from '@headlessui/react'

const BaseSlideOver: React.FC<any> = ({
  title,
  children,
  isOpen,
  setIsOpen,
  subtitle = null,
}: any) => {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as='div' className='relative z-10' onClose={setIsOpen}>
        <div className='fixed inset-0 overflow-hidden'>
          <div className='absolute inset-0 overflow-hidden'>
            <div className='pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16'>
              <Transition.Child
                as={Fragment}
                enter='transform transition ease-in-out duration-500 sm:duration-700'
                enterFrom='translate-x-full'
                enterTo='translate-x-0'
                leave='transform transition ease-in-out duration-500 sm:duration-700'
                leaveFrom='translate-x-0'
                leaveTo='translate-x-full'
              >
                <Dialog.Panel className='pointer-events-auto w-screen max-w-4xl'>
                  <div className='flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl'>
                    <div className='px-4 sm:px-6'>
                      <div className='flex items-start justify-between'>
                        <Dialog.Title className='text-base font-semibold leading-6 text-gray-900'>
                          {title}
                        </Dialog.Title>
                        <div className='ml-3 flex h-7 items-center'>
                          <button
                            type='button'
                            className='relative rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                            onClick={() => setIsOpen(false)}
                          >
                            <span className='absolute -inset-2.5' />
                            <span className='sr-only'>Close</span>
                            <XMarkIcon className='h-6 w-6' aria-hidden='true' />
                          </button>
                        </div>
                      </div>
                      {subtitle && subtitle !== '' && (
                        <Dialog.Description>{subtitle}</Dialog.Description>
                      )}
                    </div>
                    <div className='relative mt-4 pt-4 border-t flex-1 px-4 sm:px-6'>
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default BaseSlideOver
