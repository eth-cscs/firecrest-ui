/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useState } from 'react'
import { ArrowRightIcon, DocumentTextIcon, FolderIcon, LinkIcon } from '@heroicons/react/24/outline'
// types
import { System } from '~/types/api-status'
import { File, FileType } from '~/types/api-filesystem'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
// browsers
import { RemoteFilesystemBrowserMode } from '~/modules/filesystem/components/browsers/RemoteFilesystemBrowser'
// helpers
import { prettyBytes } from '~/helpers/file-helper'
import { FileTableSortableColumn } from '~/helpers/ui-table-helper'
// tables
import SortableColumnHeader from '~/modules/filesystem/components/tables/SortableColumnHeader'

// TODO: Substitute the FileListView.tsx table with this one
interface FileItemProps {
  file: File
  currentPath: string
  fileSystem: FileSystem
  system: System
  onSelectTarget: (systemName: string, targetPath: string) => void
  mode: RemoteFilesystemBrowserMode
}

const FileItem: React.FC<FileItemProps> = ({
  file,
  currentPath,
  fileSystem,
  system,
  onSelectTarget,
  mode = RemoteFilesystemBrowserMode.FILE_AND_DIRECTORY,
}: FileItemProps) => {
  const handleOnSelectTarget = () => {
    onSelectTarget(system.name, `${currentPath}/${file.name}`)
  }
  return (
    <tr className='even:bg-blue-50'>
      <td className='px-4 py-3 font-medium'>
        <a href='#' onClick={handleOnSelectTarget} className='inline-flex cursor-pointer'>
          <span className='mr-1 text-gray-500'>
            {file.type === FileType.file ? (
              <DocumentTextIcon className='h-5 w-5' />
            ) : (
              <LinkIcon className='h-5 w-5' />
            )}
          </span>{' '}
          {file.name}
        </a>
      </td>
      <td className='px-4 py-3 font-medium'>{prettyBytes(parseInt(file.size))}</td>
      <td className='px-4 py-3 font-medium'>
        <LabelBadge color={LabelColor.YELLOW}>{file.group}</LabelBadge>
      </td>
      <td className='px-4 py-3 font-medium'>
        <LabelBadge color={LabelColor.BLUE}>{file.user}</LabelBadge>
      </td>
      <td className='px-4 py-3 font-medium text-right'>
        {(mode === RemoteFilesystemBrowserMode.FILE_AND_DIRECTORY ||
          mode === RemoteFilesystemBrowserMode.FILE) && (
          <button
            type='button'
            className='inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
            onClick={handleOnSelectTarget}
          >
            <ArrowRightIcon className='-ml-1 mr-2 h-3 w-3 text-gray-500' aria-hidden='true' />
            Select
          </button>
        )}
      </td>
    </tr>
  )
}

interface DirectoryItemProps {
  file: File
  currentPath: string
  fileSystem: FileSystem
  system: System
  onNavigateTo: (systemName: string, targetPath: string) => void
  onSelectTarget: (systemName: string, targetPath: string) => void
  mode: RemoteFilesystemBrowserMode
}

const DirectoryItem: React.FC<DirectoryItemProps> = ({
  file,
  currentPath,
  fileSystem,
  system,
  onNavigateTo,
  onSelectTarget,
  mode = RemoteFilesystemBrowserMode.FILE_AND_DIRECTORY,
}: DirectoryItemProps) => {
  const handleNavigateTo = () => {
    onNavigateTo(system.name, `${currentPath}/${file.name}`)
  }
  const handleOnSelectTarget = () => {
    onSelectTarget(system.name, `${currentPath}/${file.name}`)
  }
  return (
    <tr className='even:bg-blue-50'>
      <td className='px-4 py-3 font-medium'>
        <a href='#' onClick={handleNavigateTo} className='inline-flex cursor-pointer'>
          <span className='mr-1 text-gray-500'>
            <FolderIcon className='h-5 w-5' />
          </span>{' '}
          {file.name}
        </a>
      </td>
      <td className='px-4 py-3 font-medium'>{prettyBytes(parseInt(file.size))}</td>
      <td className='px-4 py-3 font-medium'>
        <LabelBadge color={LabelColor.YELLOW}>{file.group}</LabelBadge>
      </td>
      <td className='px-4 py-3 font-medium'>
        <LabelBadge color={LabelColor.BLUE}>{file.user}</LabelBadge>
      </td>
      <td className='px-4 py-3 font-medium text-right'>
        {(mode === RemoteFilesystemBrowserMode.FILE_AND_DIRECTORY ||
          mode === RemoteFilesystemBrowserMode.DIRECTORY) && (
          <button
            type='button'
            className='inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
            onClick={handleOnSelectTarget}
          >
            <ArrowRightIcon className='-ml-1 mr-2 h-3 w-3 text-gray-500' aria-hidden='true' />
            Select
          </button>
        )}
      </td>
    </tr>
  )
}

interface FileListTableProps {
  files: File[]
  currentPath: string
  fileSystem: FileSystem
  system: System
  onNavigateTo: (systemName: string, targetPath: string) => void
  onSelectTarget: (systemName: string, targetPath: string) => void
  mode: RemoteFilesystemBrowserMode
}

export const FileSystemSelectableTable: React.FC<FileListTableProps> = ({
  files,
  currentPath,
  fileSystem,
  system,
  onNavigateTo,
  onSelectTarget,
  mode = RemoteFilesystemBrowserMode.FILE_AND_DIRECTORY,
}: FileListTableProps) => {
  const [sortableColumns, setSortableColumns] = useState<FileTableSortableColumn[]>([])
  const [fileSystemList, setFileSystemList] = useState<any[]>(files)
  const localStorageKey = 'firecrest-web-ui-file-browser'

  //   useEffect(() => {
  //     const localStorageData = localStorage.getItem(localStorageKey) || '{}'
  //     const jsonData = JSON.parse(localStorageData)
  //     const fileTableSortableColumn = FileTableSortableColumn.fromJSON(jsonData)
  //     const currentFileTableSortableColumn =
  //       fileTableSortableColumn !== null
  //         ? fileTableSortableColumn
  //         : FileTableSortableColumn.getDefault()
  //     const currentStateSortableColumns = getUpdatedStateFileTableSortableColumns(
  //       getFileBroserSortableColumns(),
  //       currentFileTableSortableColumn,
  //     )
  //     setSortableColumns(currentStateSortableColumns)
  //     const sortedFileSystemObjects = getFileTableSortableColumn(
  //       currentFileTableSortableColumn,
  //       fileSystemObjects,
  //     )
  //     setFileSystemList(sortedFileSystemObjects)
  //   }, [])

  //   const changeSorting = (fileTableSortableColumn: FileTableSortableColumn) => {
  //     const nextSortingState = new FileTableSortableColumn(
  //       fileTableSortableColumn.columnName,
  //       fileTableSortableColumn.columnLabel,
  //       nextSortState(fileTableSortableColumn.columnSortable),
  //       ColumnType.SORTABLE,
  //     )
  //     localStorage.setItem(localStorageKey, JSON.stringify(nextSortingState))
  //     const nextStateSortableColumns: FileTableSortableColumn[] =
  //       getUpdatedStateFileTableSortableColumns(sortableColumns, nextSortingState)
  //     setSortableColumns(nextStateSortableColumns)
  //     const sortedFileSystemObjects = getFileTableSortableColumn(nextSortingState, fileSystemObjects)
  //     setFileSystemList(sortedFileSystemObjects)
  //   }

  const changeSorting = () => {}

  return (
    <div className='border border-gray-200 rounded-md'>
      <table className='table-auto w-full text-left text-sm'>
        <thead className='bg-gray-100'>
          <tr>
            {sortableColumns.map((fileTableSortableColumn: FileTableSortableColumn) => (
              <SortableColumnHeader
                key={`SortableColumnHeader-${fileTableSortableColumn.columnName}`}
                fileTableSortableColumn={fileTableSortableColumn}
                changeSorting={changeSorting}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {fileSystemList.map((file: File) =>
            file.type == 'd' ? (
              <DirectoryItem
                key={`dir-${file.name}`}
                file={file}
                currentPath={currentPath}
                fileSystem={fileSystem}
                system={system}
                onNavigateTo={onNavigateTo}
                onSelectTarget={onSelectTarget}
                mode={mode}
              />
            ) : (
              <FileItem
                key={`file-${file.name}`}
                file={file}
                currentPath={currentPath}
                fileSystem={fileSystem}
                system={system}
                onSelectTarget={onSelectTarget}
                mode={mode}
              />
            ),
          )}
        </tbody>
      </table>
    </div>
  )
}
