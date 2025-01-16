import React, { useState, forwardRef, useImperativeHandle } from 'react'
import { DocumentArrowUpIcon, DocumentIcon, TrashIcon } from '@heroicons/react/24/outline'
// helpers
import { classNames } from '~/helpers/class-helper'
import { prettyBytes } from '~/helpers/file-helper'

const FilePreview: React.FC<any> = ({ file, onRemoveFile }) => {
  if (!file || file === null) {
    return null
  }
  return (
    <div className='block p-1 w-1/2 sm:w-1/3 md:w-1/4 h-24'>
      <article className='group w-full h-full rounded-md focus:outline-none focus:shadow-outline elative bg-gray-100 cursor-pointer relative shadow-sm'>
        <img
          alt='upload preview'
          className='img-preview hidden w-full h-full sticky object-cover rounded-md bg-fixed'
        />
        <section className='flex flex-col rounded-md text-xs break-words w-full h-full z-5 absolute top-0 py-2 px-3'>
          <h1 className='flex-1 group-hover:text-blue-800'>{file.name}</h1>
          <div className='flex'>
            <span className='p-1 text-blue-800'>
              <DocumentIcon className='h-4 w-4' />
            </span>
            <p className='p-1 size text-xs text-gray-700'>{prettyBytes(file.size)}</p>
            <a
              href='#'
              onClick={onRemoveFile}
              className='delete ml-auto focus:outline-none hover:bg-gray-300 p-1 rounded-md text-gray-800'
            >
              <TrashIcon className='h-4 w-4' />
            </a>
          </div>
        </section>
      </article>
    </div>
  )
}

interface SingleDraggableFileUploadHandle {
  reset: () => void
}

interface SingleDraggableFileUploadProps {
  onFileSelected: (file: File | null) => void
  fieldError?: boolean
  className?: string
}

const SingleDraggableFileUpload = forwardRef<
  SingleDraggableFileUploadHandle,
  SingleDraggableFileUploadProps
>(({ onFileSelected, fieldError = false, className = '' }, ref) => {
  const [file, setFile] = useState<File | null>(null)

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const { files } = event.dataTransfer
    if (files.length > 0) {
      const selectedFile = files[0]
      setFile(selectedFile)
      onFileSelected(selectedFile)
    }
  }

  const handleOnRemoveFile = () => {
    onFileSelected(null)
    setFile(null)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const selectedFile = files[0]
      setFile(selectedFile)
      onFileSelected(selectedFile)
    } else {
      setFile(null)
    }
  }

  useImperativeHandle(ref, () => ({
    reset: () => {
      setFile(null)
      onFileSelected(null)
    },
  }))

  return (
    <>
      <div
        className={classNames(
          fieldError ? 'border-red-300' : 'border-gray-900/25',
          'mt-2 flex justify-center rounded-lg border border-dashed px-6 py-3',
          className,
        )}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {!file ? (
          <div className='text-center'>
            <DocumentArrowUpIcon className='mx-auto h-12 w-12 text-gray-300' aria-hidden='true' />
            <div className='mt-4 flex justify-center text-sm leading-6 text-gray-600'>
              <label
                htmlFor='draggableFileInput'
                className='relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500'
              >
                <span>Select a file</span>
                <input
                  id='draggableFileInput'
                  type='file'
                  className='sr-only'
                  onChange={handleFileInput}
                  multiple={false}
                />
              </label>
              <p className='pl-1'>or drag and drop</p>
            </div>
          </div>
        ) : (
          <FilePreview file={file} onRemoveFile={handleOnRemoveFile} />
        )}
      </div>
    </>
  )
})

SingleDraggableFileUpload.displayName = 'SingleDraggableFileUpload'

export default SingleDraggableFileUpload
