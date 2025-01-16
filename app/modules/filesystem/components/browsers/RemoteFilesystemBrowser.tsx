import React, { useState, useEffect } from 'react'
import { useFetcher } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
// types
import { System, FileSystem } from '~/types/api-status'
// helpers
import {
  buildBreadcrumbNavigation,
  buildFileSystemSelection,
  buildFileSystemSelectionPath,
  splitFileSystemSelection,
} from '~/modules/filesystem/helpers/filesystem-helper'
import { isFileSystemHealthy } from '~/helpers/system-helper'
// alerts
import AlertError from '~/components/alerts/AlertError'
// spinners
import LoadingSpinner from '~/components/spinners/LoadingSpinner'
// tables
import { FileSystemSelectableTable } from '~/modules/filesystem/components/tables/FileSystemSelectableTable'

export enum RemoteFilesystemBrowserMode {
  FILE = 0,
  FILE_AND_DIRECTORY = 1,
  DIRECTORY = 2,
}

interface FileSystemSelection {
  currentPath: string
  fileSystem: FileSystem
  system: System
  systems: System[]
  username: string
  onChange: (systemName: string, targetPath: string) => void
}

const FileSystemSelection: React.FC<FileSystemSelection> = ({
  currentPath,
  fileSystem,
  system,
  systems,
  username,
  onChange,
}) => {
  const onChangeHandler = (event: any) => {
    const selectedValue = event.target.value
    const { systemName, fileSystemPath } = splitFileSystemSelection(selectedValue)
    onChange(systemName, fileSystemPath)
  }

  return (
    <div className='mb-4 col-span-4 sm:col-span-2'>
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

interface BreadcrumbNavigationProps {
  currentPath: string
  system: System
  fileSystem: FileSystem
  navigateTo: (systemName: string, targetPath: string) => void
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  currentPath,
  system,
  fileSystem,
  navigateTo,
}) => {
  const navigationData = buildBreadcrumbNavigation(currentPath, fileSystem.path, system.name)
  const handleNavigation = (targetPath: string) => {
    navigateTo(system.name, targetPath)
    return false
  }
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
                    href='#'
                    onClick={() => handleNavigation(navigationItem.path)}
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

interface RemoteFilesystemBrowser {
  initCurrentPath: string
  initSystemName: string
  onBrowseSelection: (systemName: string, targetPath: string) => void
  mode: RemoteFilesystemBrowserMode
  limitSameSystem: boolean
}

const RemoteFilesystemBrowser: React.FC<any> = ({
  initCurrentPath,
  initSystemName,
  onBrowseSelection,
  mode = RemoteFilesystemBrowserMode.FILE_AND_DIRECTORY,
  limitSameSystem = false,
}: any) => {
  const fetcher = useFetcher<any>()
  const [loading, setLoading] = useState<boolean>(true)
  const [filesystemData, setFilesystemData] = useState<any>(null)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    if (initSystemName) {
      fetcher.load(
        `/api/filesystems/${initSystemName}?targetPath=${initCurrentPath && initCurrentPath !== '' ? initCurrentPath : ''}`,
      )
    } else {
      fetcher.load(
        `/api/filesystems/?targetPath=${initCurrentPath && initCurrentPath !== '' ? initCurrentPath : ''}`,
      )
    }
  }, [])

  useEffect(() => {
    if (!fetcher.data || fetcher.state === 'loading') {
      return
    }
    if (fetcher.data) {
      const data = fetcher.data
      if (data?.error) {
        setError(data.error)
      } else {
        setError(null)
        setFilesystemData(data || null)
      }
      setLoading(false)
    }
  }, [fetcher.data])

  const fetchData = (system: string, targetPath: string) => {
    setLoading(true)
    const url = `/api/filesystems/${system}?targetPath=${targetPath}`
    fetcher.load(url)
  }

  const handleOnNavigateTo = (systemName: string, targetPath: string) => {
    fetchData(systemName, targetPath)
  }

  const handleOnChangeFileSystem = (systemName: string, targetPath: string) => {
    fetchData(systemName, targetPath)
  }

  const handleOnSelectTargetPath = (systemName: string, targetPath: string) => {
    onBrowseSelection(systemName, targetPath)
  }

  const getSelectableSystems = (systems: [System], system: System) => {
    if (limitSameSystem) {
      return [system]
    }
    return systems
  }

  if (error !== null) {
    if (filesystemData !== null) {
      const { currentPath, system, fileSystem, systems, username } = filesystemData
      return (
        <>
          <FileSystemSelection
            currentPath={currentPath}
            fileSystem={fileSystem}
            system={system}
            systems={getSelectableSystems(systems, system)}
            username={username}
            onChange={handleOnChangeFileSystem}
          />
          <BreadcrumbNavigation
            currentPath={currentPath}
            system={system}
            fileSystem={fileSystem}
            navigateTo={handleOnNavigateTo}
          />
          <AlertError error={error} />
          {loading && <LoadingSpinner title='Loading directory content...' className='py-10' />}
        </>
      )
    }
    return <AlertError error={error} />
  }

  if (filesystemData === null) {
    return loading && <LoadingSpinner title='Loading directory content...' className='py-10' />
  }

  const { files, currentPath, system, fileSystem, systems, username } = filesystemData

  return (
    <>
      <FileSystemSelection
        currentPath={currentPath}
        fileSystem={fileSystem}
        system={system}
        systems={getSelectableSystems(systems, system)}
        username={username}
        onChange={handleOnChangeFileSystem}
      />
      {loading && <LoadingSpinner title='Loading directory content...' className='py-10' />}
      {!loading && (
        <>
          <BreadcrumbNavigation
            currentPath={currentPath}
            system={system}
            fileSystem={fileSystem}
            navigateTo={handleOnNavigateTo}
          />
          <div className='mb-4'>
            <button
              onClick={() => handleOnSelectTargetPath(system.name, currentPath)}
              type='button'
              className='w-full inline-flex justify-center items-center gap-x-1.5 rounded-md bg-blue-400 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400'
            >
              <ArrowRightIcon aria-hidden='true' className='-ml-0.5 h-5 w-5' />
              Select the current path &quot;{currentPath}&quot;
            </button>
          </div>

          {!files ||
            (files.length == 0 && (
              <div className='text-center p-3'>
                <p className='mt-1 text-sm text-gray-500'>No files found in this directory.</p>
              </div>
            ))}
          {files && files.length > 0 && (
            <FileSystemSelectableTable
              files={files}
              currentPath={currentPath}
              fileSystem={fileSystem}
              system={system}
              onNavigateTo={handleOnNavigateTo}
              onSelectTarget={handleOnSelectTargetPath}
              mode={mode}
            />
          )}
        </>
      )}
    </>
  )
}

export default RemoteFilesystemBrowser
