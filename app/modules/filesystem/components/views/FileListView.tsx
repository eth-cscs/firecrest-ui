/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

import React, { useState, Fragment, useRef } from 'react'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import {
  DocumentTextIcon,
  FolderIcon,
  HomeIcon,
  LinkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
// types
import { File, FileType, GetTransferUploadResponse } from '~/types/api-filesystem'
import { System, FileSystem } from '~/types/api-status'
import type { HttpErrorResponse } from '~/types/error'
// helpers
import { prettyBytes } from '~/helpers/file-helper'
import { classNames } from '~/helpers/class-helper'
import {
  buildFileSystemSelection,
  buildFileSystemSelectionPath,
  splitFileSystemSelection,
  buildFileSystemNavigationPath,
  buildBreadcrumbNavigation,
} from '~/modules/filesystem/helpers/filesystem-helper'
import { formatDateTime } from '~/helpers/date-helper'
import { FileTableSortableColumn } from '~/helpers/ui-table-helper'
import { isFileSystemHealthy } from '~/helpers/system-helper'
import { postLocalFileUpload, postLocalTransferUpload } from '~/apis/filesystem-api'
// spinners
import LoadingSpinner from '~/components/spinners/LoadingSpinner'
// badges
import LabelBadge, { LabelColor } from '~/components/badges/LabelBadge'
// alerts
import AlertInfo from '~/components/alerts/AlertInfo'
import AlertError from '~/components/alerts/AlertError'
// tables
import SortableColumnHeader from '~/modules/filesystem/components/tables/SortableColumnHeader'
// dialogs
import CreateDirectoryDialog from '~/modules/filesystem/components/dialogs/CreateDirectoryDialog'
import ChangeOwnershipDialog from '~/modules/filesystem/components/dialogs/ChangeOwnershipDialog'
import ChangePermissionDialog from '~/modules/filesystem/components/dialogs/ChangePermissionDialog'
import ChecksumDialog from '~/modules/filesystem/components/dialogs/ChecksumDialog'
import CopyDialog from '~/modules/filesystem/components/dialogs/CopyDialog'
import MoveDialog from '~/modules/filesystem/components/dialogs/MoveDialog'
// import RenameDialog from '~/modules/filesystem/components/dialogs/RenameDialog'
import RemoveDialog from '~/modules/filesystem/components/dialogs/RemoveDialog'
import SymLinkDialog from '~/modules/filesystem/components/dialogs/SymLinkDialog'
import DetailsDialog from '~/modules/filesystem/components/dialogs/DetailsDialog'
import DownloadDialog from '~/modules/filesystem/components/dialogs/DownloadDialog'
import SingleDraggableFileUpload from '~/components/forms/files/SingleDraggableFileUpload'
import TransferUploadResultDialog from '~/modules/filesystem/components/dialogs/TransferUploadResultDialog'
// buttons
import LoadingButton from '~/components/buttons/LoadingButton'
// panels
import SimplePanel from '~/components/panels/SimplePanel'
// views
import SimpleView, { SimpleViewSize } from '~/components/views/SimpleView'

const copyToClipboard = (file: File, fileSystem: FileSystem) => {
  const path = `${fileSystem.path}/${file.name}`
  navigator.clipboard.writeText(path)
}

interface FileItemProps {
  file: File
  currentPath: string
  fileSystem: FileSystem
  system: System
}

const FileItem: React.FC<FileItemProps> = ({ file, currentPath, fileSystem, system }) => {
  const [changeOwnershipDialogOpen, setChangeOwnershipDialogOpen] = useState(false)
  const [changePermissionDialogDialogOpen, setChangePermissionDialogDialogOpen] = useState(false)
  const [checksumDialogOpen, setChecksumDialogOpen] = useState(false)
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [symlinkDialogOpen, setSymlinkDialogOpen] = useState(false)
  const [downloadkDialogOpen, setDownloadDialogOpen] = useState(false)
  return (
    <tr className='even:bg-blue-50'>
      <td className='px-4 py-3 font-medium'>
        <ChangePermissionDialog
          system={system.name}
          file={file}
          currentPath={currentPath}
          open={changePermissionDialogDialogOpen}
          onClose={() => setChangePermissionDialogDialogOpen(false)}
        />
        <ChangeOwnershipDialog
          system={system.name}
          file={file}
          currentPath={currentPath}
          open={changeOwnershipDialogOpen}
          onClose={() => setChangeOwnershipDialogOpen(false)}
        />
        <ChecksumDialog
          system={system.name}
          file={file}
          currentPath={currentPath}
          open={checksumDialogOpen}
          onClose={() => setChecksumDialogOpen(false)}
        />
        <CopyDialog
          system={system.name}
          file={file}
          currentPath={currentPath}
          open={copyDialogOpen}
          onClose={() => setCopyDialogOpen(false)}
        />
        <MoveDialog
          system={system.name}
          file={file}
          currentPath={currentPath}
          open={moveDialogOpen}
          onClose={() => setMoveDialogOpen(false)}
        />
        <RemoveDialog
          system={system.name}
          file={file}
          currentPath={currentPath}
          open={removeDialogOpen}
          onClose={() => setRemoveDialogOpen(false)}
        />
        <SymLinkDialog
          system={system.name}
          file={file}
          currentPath={currentPath}
          open={symlinkDialogOpen}
          onClose={() => setSymlinkDialogOpen(false)}
        />
        <DetailsDialog
          file={file}
          currentPath={currentPath}
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
        />
        <DownloadDialog
          system={system.name}
          file={file}
          currentPath={currentPath}
          open={downloadkDialogOpen}
          onClose={() => setDownloadDialogOpen(false)}
        />
        <div className='inline-flex'>
          <span className='mr-1 text-gray-500'>
            {file.type === FileType.file ? (
              <DocumentTextIcon className='h-5 w-5' />
            ) : (
              <LinkIcon className='h-5 w-5' />
            )}
          </span>{' '}
          {file.name}
        </div>
      </td>
      <td className='px-4 py-3 font-medium hidden md:table-cell'>
        {formatDateTime({ dateTime: file.lastModified })}
      </td>
      <td className='px-4 py-3 font-medium'>{prettyBytes(parseInt(file.size))}</td>
      <td className='px-4 py-3 font-medium'>
        <LabelBadge color={LabelColor.YELLOW}>{file.group}</LabelBadge>
      </td>
      <td className='px-4 py-3 font-medium'>
        <LabelBadge color={LabelColor.BLUE}>{file.user}</LabelBadge>
      </td>
      <td className='px-4 py-3 font-medium hidden md:table-cell'>
        <LabelBadge color={LabelColor.GRAY}>{file.permissions}</LabelBadge>
      </td>
      <td className='px-4 py-3 font-medium text-right'>
        <div className='inline-flex rounded-md shadow-sm'>
          <Menu as='div' className='relative -ml-px block'>
            <div>
              <MenuButton className='inline-flex items-center text-sm font-medium text-center text-gray-900 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-50 '>
                <svg
                  className='w-4 h-4'
                  aria-hidden='true'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='currentColor'
                  viewBox='0 0 4 15'
                >
                  <path d='M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z' />
                </svg>
              </MenuButton>
            </div>
            <MenuItems
              modal={false}
              transition
              className='absolute right-0 z-10 mt-2 w-64 origin-top-right text-left rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none'
            >
              <MenuItem>
                <a
                  href='#'
                  onClick={() => copyToClipboard(file, fileSystem)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Copy path to clipboard
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href='#'
                  onClick={() => setCopyDialogOpen(true)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Copy - cp
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href='#'
                  onClick={() => setMoveDialogOpen(true)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Move - mv
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href='#'
                  onClick={() => setSymlinkDialogOpen(true)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Symbolic link - symlink
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href='#'
                  onClick={() => setChangePermissionDialogDialogOpen(true)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Change permissions - chmod
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href='#'
                  onClick={() => setChangeOwnershipDialogOpen(true)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Change ownership - chown
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href='#'
                  onClick={() => setRemoveDialogOpen(true)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Delete - rm
                </a>
              </MenuItem>
              {file.type === FileType.file && (
                <>
                  <MenuItem>
                    <a
                      href='#'
                      onClick={() => setChecksumDialogOpen(true)}
                      className='block px-4 py-2 text-sm text-gray-700'
                    >
                      Checksum
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href='#'
                      onClick={() => setDownloadDialogOpen(true)}
                      className='block px-4 py-2 text-sm text-gray-700'
                    >
                      Download
                    </a>
                  </MenuItem>
                </>
              )}
              <MenuItem>
                <a
                  href='#'
                  onClick={() => setDetailsDialogOpen(true)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Details
                </a>
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </td>
    </tr>
  )
}

interface DirectoryItemProps {
  file: File
  currentPath: string
  fileSystem: FileSystem
  system: System
}

const DirectoryItem: React.FC<DirectoryItemProps> = ({ file, currentPath, fileSystem, system }) => {
  const [changeOwnershipDialogOpen, setChangeOwnershipDialogOpen] = useState(false)
  const [changePermissionDialogDialogOpen, setChangePermissionDialogDialogOpen] = useState(false)
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [symlinkDialogOpen, setSymlinkDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const { name } = file

  const navigationPath = buildFileSystemNavigationPath(system.name, currentPath, name)
  return (
    <tr className='even:bg-blue-50'>
      <td className='px-4 py-3 font-medium'>
        <DetailsDialog
          file={file}
          currentPath={currentPath}
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
        />
        <CopyDialog
          system={system.name}
          file={file}
          currentPath={currentPath}
          open={copyDialogOpen}
          onClose={() => setCopyDialogOpen(false)}
        />
        <MoveDialog
          system={system.name}
          file={file}
          currentPath={currentPath}
          open={moveDialogOpen}
          onClose={() => setMoveDialogOpen(false)}
        />
        <SymLinkDialog
          system={system.name}
          file={file}
          currentPath={currentPath}
          open={symlinkDialogOpen}
          onClose={() => setSymlinkDialogOpen(false)}
        />
        <RemoveDialog
          system={system.name}
          file={file}
          currentPath={currentPath}
          open={removeDialogOpen}
          onClose={() => setRemoveDialogOpen(false)}
        />
        <ChangePermissionDialog
          system={system.name}
          file={file}
          currentPath={currentPath}
          open={changePermissionDialogDialogOpen}
          onClose={() => setChangePermissionDialogDialogOpen(false)}
        />
        <ChangeOwnershipDialog
          system={system.name}
          file={file}
          currentPath={currentPath}
          open={changeOwnershipDialogOpen}
          onClose={() => setChangeOwnershipDialogOpen(false)}
        />
        <a href={navigationPath} title={navigationPath} className='inline-flex'>
          <span className='mr-1 text-gray-500'>
            <FolderIcon className='h-5 w-5' />
          </span>{' '}
          {file.name}
        </a>
      </td>
      <td className='px-4 py-3 font-medium hidden md:table-cell'>
        {formatDateTime({ dateTime: file.lastModified })}
      </td>
      <td className='px-4 py-3 font-medium'>{prettyBytes(parseInt(file.size))}</td>
      <td className='px-4 py-3 font-medium'>
        <LabelBadge color={LabelColor.YELLOW}>{file.group}</LabelBadge>
      </td>
      <td className='px-4 py-3 font-medium'>
        <LabelBadge color={LabelColor.BLUE}>{file.user}</LabelBadge>
      </td>
      <td className='px-4 py-3 font-medium hidden md:table-cell'>
        <LabelBadge color={LabelColor.GRAY}>{file.permissions}</LabelBadge>
      </td>
      <td className='px-4 py-3 font-medium text-right'>
        <div className='inline-flex rounded-md shadow-sm'>
          <Menu as='div' className='relative -ml-px block'>
            <div>
              <MenuButton className='inline-flex items-center text-sm font-medium text-center text-gray-900 bg-white rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-50'>
                <svg
                  className='w-4 h-4'
                  aria-hidden='true'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='currentColor'
                  viewBox='0 0 4 15'
                >
                  <path d='M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z' />
                </svg>
              </MenuButton>
            </div>
            <MenuItems
              modal={false}
              transition
              className='absolute right-0 z-10 mt-2 w-64 origin-top-right text-left rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none'
            >
              <MenuItem>
                <a
                  href='#'
                  onClick={() => copyToClipboard(file, fileSystem)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Copy path to clipboard
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href='#'
                  onClick={() => setCopyDialogOpen(true)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Copy - cp
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href='#'
                  onClick={() => setMoveDialogOpen(true)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Move - mv
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href='#'
                  onClick={() => setSymlinkDialogOpen(true)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Symbolic link - symlink
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href='#'
                  onClick={() => setChangePermissionDialogDialogOpen(true)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Change permissions - chmod
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href='#'
                  onClick={() => setChangeOwnershipDialogOpen(true)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Change ownership - chown
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href='#'
                  onClick={() => setRemoveDialogOpen(true)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Delete - rm
                </a>
              </MenuItem>
              <MenuItem>
                <a
                  href='#'
                  onClick={() => setDetailsDialogOpen(true)}
                  className='block px-4 py-2 text-sm text-gray-700'
                >
                  Details
                </a>
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </td>
    </tr>
  )
}

interface BreadcrumbNavigationProps {
  currentPath: string
  system: System
  fileSystem: FileSystem
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  currentPath,
  system,
  fileSystem,
}) => {
  const navigationData = buildBreadcrumbNavigation(currentPath, fileSystem.path, system.name)
  return (
    <>
      <nav className='flex rounded-md p-2 mb-4 border border-gray-200' aria-label='Breadcrumb'>
        <ol className='flex items-center space-x-2'>
          {navigationData
            .filter((navItem: any) => navItem.dirName !== '') // does not render the root path
            .map((navigationItem: any) => (
              <li key={navigationItem.dirName}>
                <div className='flex items-center'>
                  <svg
                    className='h-5 w-5 flex-shrink-0 text-gray-300'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                    aria-hidden='true'
                  >
                    <path d='M5.555 17.776l8-16 .894.448-8 16-.894-.448z' />
                  </svg>
                  <a
                    href={navigationItem.navUrl}
                    className='ml-2 text-sm font-medium text-gray-500 hover:text-gray-700'
                    aria-current={navigationItem.isBasePath ? 'page' : undefined}
                  >
                    {navigationItem.dirName}
                  </a>
                </div>
              </li>
            ))}
        </ol>
      </nav>
    </>
  )
}

interface FileSystemSelection {
  currentPath: string
  fileSystem: FileSystem
  system: System
  systems: System[]
  username: string
}

const FileSystemSelection: React.FC<FileSystemSelection> = ({
  currentPath,
  fileSystem,
  system,
  systems,
  username,
}) => {
  const onChangeHandler = (event: any) => {
    const selectedValue = event.target.value
    const { systemName, fileSystemPath } = splitFileSystemSelection(selectedValue)
    const newNavigationPath = buildFileSystemNavigationPath(systemName, fileSystemPath)
    window.location.href = newNavigationPath
  }

  return (
    <div className='col-span-4 sm:col-span-2'>
      <label htmlFor='country' className='block text-sm font-medium leading-6 text-gray-900'>
        System
      </label>
      <select
        defaultValue={buildFileSystemSelection(system, fileSystem, username)}
        className='mt-1 block w-full rounded-md border py-2 px-3 shadow-sm sm:text-sm focus:outline-none border-gray-300 focus:border-blue-300 focus:ring-blue-300'
        onChange={onChangeHandler}
      >
        {systems &&
          systems.length > 0 &&
          systems.map((itemSystem: System) => (
            <optgroup key={itemSystem.name} label={itemSystem.name}>
              {itemSystem.fileSystems.map((itemFileSystem: FileSystem) => (
                <option
                  key={buildFileSystemSelection(itemSystem, itemFileSystem, username)}
                  value={buildFileSystemSelection(itemSystem, itemFileSystem, username)}
                  disabled={!isFileSystemHealthy(itemSystem, itemFileSystem)}
                >
                  {`${itemSystem.name} - ${buildFileSystemSelectionPath(itemFileSystem, username)}`}{' '}
                  {`${isFileSystemHealthy(itemSystem, itemFileSystem) ? '' : ' - unhealthy'}`}
                </option>
              ))}
            </optgroup>
          ))}
      </select>
    </div>
  )
}

const NavigationAlertError: React.FC<any> = ({ error, isActionError = false }) => {
  if (!error || error === null) {
    return null
  }
  const goHome = () => {
    window.location.href = `/utilities/`
  }
  return (
    <div className='mb-6'>
      <AlertError error={error} />
      {!isActionError && (
        <div className='text-center'>
          <button
            type='button'
            className='inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600'
            onClick={goHome}
          >
            <HomeIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />
            Back to the home direcotry
          </button>
        </div>
      )}
    </div>
  )
}

interface FileListTableProps {
  files: File[]
  currentPath: string
  fileSystem: FileSystem
  system: System
}

const FileListTable: React.FC<FileListTableProps> = ({
  files,
  currentPath,
  fileSystem,
  system,
}) => {
  const [sortableColumns, setSortableColumns] = useState<FileTableSortableColumn[]>([])
  const [fileSystemList, setFileSystemList] = useState<any[]>([])
  const localStorageKey = 'firecrest-web-ui-file-manager'

  // useEffect(() => {
  //   const localStorageData = localStorage.getItem(localStorageKey) || '{}'
  //   const jsonData = JSON.parse(localStorageData)
  //   const fileTableSortableColumn = FileTableSortableColumn.fromJSON(jsonData)
  //   const currentFileTableSortableColumn =
  //     fileTableSortableColumn !== null
  //       ? fileTableSortableColumn
  //       : FileTableSortableColumn.getDefault()
  //   const currentStateSortableColumns = getUpdatedStateFileTableSortableColumns(
  //     getFileTableSortableColumns(),
  //     currentFileTableSortableColumn,
  //   )
  //   setSortableColumns(currentStateSortableColumns)
  //   const sortedFileSystemObjects = getFileTableSortableColumn(
  //     currentFileTableSortableColumn,
  //     fileSystemObjects,
  //   )
  //   setFileSystemList(sortedFileSystemObjects)
  // }, [])

  // const changeSorting = (fileTableSortableColumn: FileTableSortableColumn) => {
  //   const nextSortingState = new FileTableSortableColumn(
  //     fileTableSortableColumn.columnName,
  //     fileTableSortableColumn.columnLabel,
  //     nextSortState(fileTableSortableColumn.columnSortable),
  //     ColumnType.SORTABLE,
  //   )
  //   localStorage.setItem(localStorageKey, JSON.stringify(nextSortingState))
  //   const nextStateSortableColumns: FileTableSortableColumn[] =
  //     getUpdatedStateFileTableSortableColumns(sortableColumns, nextSortingState)
  //   setSortableColumns(nextStateSortableColumns)
  //   const sortedFileSystemObjects = getFileTableSortableColumn(nextSortingState, fileSystemObjects)
  //   setFileSystemList(sortedFileSystemObjects)
  // }

  const changeSorting = () => {}

  return (
    <div className='border border-gray-200 rounded-md'>
      <table className='table-auto w-full text-left text-sm '>
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
          {files.map((file: File) =>
            file.type == 'd' ? (
              <DirectoryItem
                key={`dir-${file.name}`}
                file={file}
                currentPath={currentPath}
                fileSystem={fileSystem}
                system={system}
              />
            ) : (
              <FileItem
                key={`file-${file.name}`}
                file={file}
                currentPath={currentPath}
                fileSystem={fileSystem}
                system={system}
              />
            ),
          )}
        </tbody>
      </table>
    </div>
  )
}

const FileTransferInfo: React.FC<any> = ({ file, uploadLimit }) => {
  return (
    <AlertInfo title='File Upload Notice' className='mb-4'>
      <p className='mb-2'>
        <b>Asynchronous Upload.</b> The file you are attempting to upload exceeds the{' '}
        <b>{prettyBytes(uploadLimit)}</b> limit for direct uploads (current file size{' '}
        {prettyBytes(parseInt(file.size))}
        ). You are required to upload large files on a staging S3 storage, upon completing the
        upload a job will move the file on the specified target path.
      </p>
    </AlertInfo>
  )
}

// TODO: Code refactoring and improvements (remove duplication, create ad-hoc components, ...)
const FileUpload: React.FC<any> = ({ system, currentPath, fileUploadLimit }) => {
  const [uploading, setUploading] = useState(false)
  const [fileToUploadSelected, setFileToUploadSelected] = useState<any | null>(null)
  const [fileTransferUploadResult, setFileTransferUploadResult] = useState<any | null>(null)
  const [transferUploadResultDialogOpen, setTransferUploadResultDialogOpen] = useState(false)
  const [fileTransferNeeded, setFileTransferNeeded] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<HttpErrorResponse | null>(null)
  const singleDraggableFileUploadRef = useRef<any>(null)

  const isFileSizeOk = (file: any) => {
    if (file == null) {
      return true
    }
    return file.size <= fileUploadLimit
  }

  const handleFileSelected = (file: any) => {
    setFileTransferNeeded(!isFileSizeOk(file))
    setFileToUploadSelected(file)
  }

  const isFileUploadable = (file: any) => {
    return file != null
  }

  const handleOnSubmit = (event: any) => {
    event.preventDefault()
    setUploading(true)
    setUploadError(null)
    if (fileToUploadSelected && fileToUploadSelected !== null) {
      if (!fileTransferNeeded) {
        const postFileUpload = async (file: any, systemName: string, path: string) => {
          await postLocalFileUpload(systemName, file.name, path, file)
          setUploading(false)
          location.reload()
        }
        postFileUpload(fileToUploadSelected, system.name, currentPath).catch((response) => {
          setFileToUploadSelected(null)
          setFileTransferUploadResult(null)
          setFileTransferNeeded(false)
          setUploadError(response?.error || response)
          resetSingleDraggableFileUploadRef()
          setUploading(false)
        })
      } else {
        const postFileTransferUpload = async (
          systemName: string,
          fileName: string,
          targetPath: string,
        ) => {
          const response: GetTransferUploadResponse = await postLocalTransferUpload(
            systemName,
            fileName,
            targetPath,
          )
          setUploadError(null)
          setFileToUploadSelected(null)
          setFileTransferUploadResult(response)
          setFileTransferNeeded(false)
          setTransferUploadResultDialogOpen(true)
          resetSingleDraggableFileUploadRef()
          setUploading(false)
        }
        postFileTransferUpload(system.name, `${fileToUploadSelected.name}`, currentPath).catch(
          (response) => {
            setFileToUploadSelected(null)
            setFileTransferUploadResult(null)
            setFileTransferNeeded(false)
            setUploadError(response?.error)
            resetSingleDraggableFileUploadRef()
            setUploading(false)
          },
        )
      }
    }
  }

  const resetSingleDraggableFileUploadRef = () => {
    if (singleDraggableFileUploadRef.current) {
      singleDraggableFileUploadRef.current.reset()
    }
  }

  return (
    <form onSubmit={handleOnSubmit} className='relative'>
      <TransferUploadResultDialog
        targetPath={currentPath}
        transferResult={fileTransferUploadResult}
        open={transferUploadResultDialogOpen}
        onClose={() => setTransferUploadResultDialogOpen(false)}
      />
      <SingleDraggableFileUpload
        ref={singleDraggableFileUploadRef}
        onFileSelected={handleFileSelected}
        className='mb-4'
      />
      {uploadError != null ? <AlertError error={uploadError} /> : null}
      {fileTransferNeeded ? (
        <FileTransferInfo file={fileToUploadSelected} uploadLimit={fileUploadLimit} />
      ) : null}
      <div className='mb-4'>
        <LoadingButton
          isLoading={uploading}
          className='sm:w-auto sm:text-sm'
          buttonName='Uploading files...'
        >
          <button
            type='submit'
            className={classNames(
              !uploading && isFileUploadable(fileToUploadSelected)
                ? ''
                : 'opacity-50 cursor-not-allowed',
              'inline-flex justify-center rounded-md border border-transparent bg-emerald-500 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2',
            )}
            disabled={uploading || !isFileUploadable(fileToUploadSelected)}
          >
            Upload file
          </button>
        </LoadingButton>
      </div>
    </form>
  )
}

interface FileListViewProps {
  files: File
  currentPath: string
  system: System
  fileSystem: FileSystem
  systems: System[]
  username: string
  fileUploadLimit: number
  error: any
}

const FileListView: React.FC<FileListViewProps> = ({
  files,
  currentPath,
  system,
  fileSystem,
  systems,
  username,
  fileUploadLimit,
  error,
}: FileListViewProps) => {
  const [loading, setLoading] = useState(false)
  const [localError, setLocalError] = useState<any | null>(error)
  const [fileList, setFileList] = useState<any | null>(files)
  const [createDirectoryDialogOpen, setCreateDirectoryDialogOpen] = useState(false)

  const actionsButtons = (
    <div className='inline-flex rounded-md shadow-sm'>
      <CreateDirectoryDialog
        system={system.name}
        currentPath={currentPath}
        open={createDirectoryDialogOpen}
        onClose={() => setCreateDirectoryDialogOpen(false)}
      />
      <button
        type='button'
        className='inline-flex items-center ml-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
        onClick={() => setCreateDirectoryDialogOpen(true)}
      >
        <PlusIcon className='-ml-1 mr-2 h-5 w-5 text-gray-500' aria-hidden='true' /> Create
        directory
      </button>
    </div>
  )

  return (
    <SimpleView title='File Manager' size={SimpleViewSize.FULL}>
      <SimplePanel title={'Filesystem'} className='mb-[330px]' actionsButtons={actionsButtons}>
        <NavigationAlertError
          error={localError}
          isActionError={error !== undefined && error !== null}
        />
        {loading && <LoadingSpinner title='Loading directory content...' className='py-10' />}
        {!loading && (
          <>
            <div className='mb-4 grid grid-cols-4 gap-6'>
              <FileSystemSelection
                currentPath={currentPath}
                fileSystem={fileSystem}
                system={system}
                systems={systems}
                username={username}
              />
            </div>
            <BreadcrumbNavigation
              currentPath={currentPath}
              system={system}
              fileSystem={fileSystem}
            />
            <FileUpload
              system={system}
              currentPath={currentPath}
              setLocalError={setLocalError}
              fileUploadLimit={fileUploadLimit}
            />
            {fileList && fileList.length > 0 && (
              <FileListTable
                files={fileList}
                currentPath={currentPath}
                fileSystem={fileSystem}
                system={system}
              />
            )}
            {!fileList ||
              (fileList.length == 0 && (
                <div className='text-center p-3'>
                  <p className='mt-1 text-sm text-gray-500'>
                    No files found in this directory. Get started by uploading a file or by creating
                    a new directory.
                  </p>
                </div>
              ))}
          </>
        )}
      </SimplePanel>
    </SimpleView>
  )
}

export default FileListView
