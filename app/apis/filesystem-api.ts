/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// types
import type {
  GetOpsChecksumResponse,
  GetOpsLsResponse,
  GetOpsChownResponse,
  GetOpsChmodResponse,
  GetOpsSymlinkResponse,
  GetOpsMkdirResponse,
  GetTransferCpResponse,
  GetTransferMvResponse,
  GetTransferUploadResponse,
  GetOpsTailResponse,
  GetTransferDownloadResponse,
} from '~/types/api-filesystem'
// apis
import api, { ApiTarget, ResponseBodyType } from './api'

export const getOpsLs = async (
  accessToken: string,
  system: string,
  targetPath: string,
  request: Request | null = null,
): Promise<GetOpsLsResponse> => {
  const urlSearchParams = new URLSearchParams({
    path: targetPath,
  })
  const apiResponse = await api.get<GetOpsLsResponse>(
    `/filesystem/${system}/ops/ls?${urlSearchParams}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )
  return apiResponse
}

export const getOpsTail = async (
  accessToken: string,
  system: string,
  targetPath: string,
  lines: string,
  request: Request | null = null,
): Promise<GetOpsTailResponse> => {
  const urlSearchParams = new URLSearchParams({
    path: targetPath,
    lines: lines,
  })
  const apiResponse = await api.get<GetOpsTailResponse>(
    `/filesystem/${system}/ops/tail?${urlSearchParams}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )
  return apiResponse
}

export const getOpsChecksum = async (
  accessToken: string,
  system: string,
  targetPath: string,
): Promise<GetOpsChecksumResponse> => {
  const urlSearchParams = new URLSearchParams({
    path: targetPath,
  })
  const apiResponse = await api.get<GetOpsChecksumResponse>(
    `/filesystem/${system}/ops/checksum?` + urlSearchParams,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )
  return apiResponse
}

export const getOpsDownload = async (
  accessToken: string,
  system: string,
  targetPath: string,
): Promise<any> => {
  const urlSearchParams = new URLSearchParams({
    path: targetPath,
  })
  const apiResponse = await api.get<any>(
    `/filesystem/${system}/ops/download?` + urlSearchParams,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    ApiTarget.API_REMOTE,
    ResponseBodyType.BLOB,
  )
  return apiResponse
}

export const postOpsSymlink = async (
  accessToken: string,
  system: string,
  targetPath: string,
  linkPath: string,
): Promise<GetOpsSymlinkResponse> => {
  const apiResponse = await api.post<any, GetOpsSymlinkResponse>(
    `/filesystem/${system}/ops/symlink`,
    JSON.stringify({ path: targetPath, linkPath }),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )
  return apiResponse
}

export const putOpsChown = async (
  accessToken: string,
  system: string,
  targetPath: string,
  owner: string | null,
  group: string | null,
): Promise<GetOpsChownResponse> => {
  const apiResponse = await api.put<any, GetOpsChownResponse>(
    `/filesystem/${system}/ops/chown`,
    JSON.stringify({ path: targetPath, owner, group }),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )
  return apiResponse
}

export const putOpsChmod = async (
  accessToken: string,
  system: string,
  targetPath: string,
  mode: string,
): Promise<GetOpsChmodResponse> => {
  const apiResponse = await api.put<any, GetOpsChmodResponse>(
    `/filesystem/${system}/ops/chmod`,
    JSON.stringify({ path: targetPath, mode }),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )
  return apiResponse
}

export const postOpsMkdir = async (
  accessToken: string,
  system: string,
  path: string,
  parent: boolean = false,
): Promise<GetOpsMkdirResponse> => {
  const apiResponse = await api.post<any, GetOpsMkdirResponse>(
    `/filesystem/${system}/ops/mkdir`,
    JSON.stringify({ path, parent }),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )
  return apiResponse
}

export const deleteOpsRm = async (
  accessToken: string,
  system: string,
  targetPath: string,
): Promise<any> => {
  await api.delete<any, any>(`/filesystem/${system}/ops/rm?path=${targetPath}`, null, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
}

export const postTransferCp = async (
  accessToken: string,
  system: string,
  sourcePath: string,
  targetPath: string,
): Promise<GetTransferCpResponse> => {
  const apiResponse = await api.post<any, GetTransferCpResponse>(
    `/filesystem/${system}/transfer/cp`,
    JSON.stringify({ sourcePath, targetPath }),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )
  return apiResponse
}

export const postTransferMv = async (
  accessToken: string,
  system: string,
  sourcePath: string,
  targetPath: string,
): Promise<GetTransferMvResponse> => {
  const apiResponse = await api.post<any, GetTransferMvResponse>(
    `/filesystem/${system}/transfer/mv`,
    JSON.stringify({ sourcePath, targetPath }),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )
  return apiResponse
}

export const postFileUpload = async (
  accessToken: string,
  system: string,
  path: string,
  fileData: any,
): Promise<any> => {
  const formData = new FormData()
  formData.append('file', fileData)
  const urlSearchParams = new URLSearchParams({
    path: path,
  })
  const result = await api.post<any, any>(
    `/filesystem/${system}/ops/upload?${urlSearchParams}`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )
  return result
}

export const postTransferUpload = async (
  accessToken: string,
  system: string,
  path: string,
  fileName: string,
  fileSize: number,
  account: string | null = null,
): Promise<GetTransferUploadResponse> => {
  const payload = {
    sourcePath: `${path}/${fileName}`,
    account: account,
    transferDirectives: {
      fileSize: fileSize,
      transferMethod: 's3',
    },
  }
  const apiResponse = await api.post<any, GetTransferUploadResponse>(
    `/filesystem/${system}/transfer/upload`,
    JSON.stringify(payload),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )
  return apiResponse
}

export const postTransferDownload = async (
  accessToken: string,
  system: string,
  path: string,
): Promise<GetTransferDownloadResponse> => {
  console.log('postTransferDownload called with:', { system, path })
  const apiResponse = await api.post<any, GetTransferDownloadResponse>(
    `/filesystem/${system}/transfer/download`,
    JSON.stringify({ sourcePath: path, transferDirectives: { transferMethod: 's3' } }),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  )
  console.log('postTransferDownload response:', apiResponse)
  return apiResponse
}

// Local apis

export const getLocalOpsChecksum = async (
  system: string,
  targetPath: string,
): Promise<GetOpsChecksumResponse> => {
  const urlSearchParams = new URLSearchParams({
    targetPath: targetPath,
  })
  const apiResponse = await api.get<GetOpsChecksumResponse>(
    `/api/filesystems/${system}/ops/checksum?` + urlSearchParams,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}

export const getLocalOpsLs = async (
  system: string,
  targetPath: string,
): Promise<GetOpsLsResponse> => {
  const urlSearchParams = new URLSearchParams({
    targetPath: targetPath,
  })
  const apiResponse = await api.get<GetOpsLsResponse>(
    `/api/filesystems/${system}/ops/ls?` + urlSearchParams,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}

export const getLocalOpsTail = async (
  system: string,
  targetPath: string,
  lines: string,
): Promise<GetOpsTailResponse> => {
  const urlSearchParams = new URLSearchParams({
    targetPath: targetPath,
    lines: lines,
  })
  const apiResponse = await api.get<GetOpsTailResponse>(
    `/api/filesystems/${system}/ops/tail?` + urlSearchParams,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}

export const postLocalFileUpload = async (
  systemName: string,
  fileName: string,
  targetPath: string,
  file: any,
): Promise<any> => {
  const formData = new FormData()
  formData.set('fileName', fileName)
  formData.set('file', file)
  formData.set('path', targetPath)
  const apiResponse = await api.post<any, any>(
    `/api/filesystems/${systemName}/ops/upload`,
    formData,
    {},
    ApiTarget.API_LOCAL,
  )
}

export const postLocalOpsSymlink = async (
  systemName: string,
  targetPath: string,
  linkPath: string,
): Promise<GetOpsSymlinkResponse> => {
  const formData = new FormData()
  formData.append('targetPath', targetPath)
  formData.append('linkPath', linkPath)
  const apiResponse = await api.post<any, GetOpsSymlinkResponse>(
    `/api/filesystems/${systemName}/ops/symlink`,
    formData,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}

export const putLocalOpsChown = async (
  system: string,
  targetPath: string,
  owner: string,
  group: string,
): Promise<GetOpsChownResponse> => {
  const formData = new FormData()
  formData.append('targetPath', targetPath)
  formData.append('owner', owner)
  formData.append('group', group)
  const apiResponse = await api.put<any, GetOpsChownResponse>(
    `/api/filesystems/${system}/ops/chown`,
    formData,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}

export const putLocalOpsChmod = async (
  system: string,
  targetPath: string,
  mode: string,
): Promise<GetOpsChmodResponse> => {
  const formData = new FormData()
  formData.append('targetPath', targetPath)
  formData.append('mode', mode)
  const apiResponse = await api.put<any, GetOpsChmodResponse>(
    `/api/filesystems/${system}/ops/chmod`,
    formData,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}

export const postLocalOpsMkdir = async (
  system: string,
  directoryPath: string,
  directoryName: string,
): Promise<GetOpsMkdirResponse> => {
  const formData = new FormData()
  formData.append('path', `${directoryPath}${directoryName}`)
  const apiResponse = await api.post<any, GetOpsMkdirResponse>(
    `/api/filesystems/${system}/ops/mkdir`,
    formData,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}

export const deleteLocalRm = async (system: string, fileTargetPath: string): Promise<null> => {
  const formData = new FormData()
  formData.append('fileTargetPath', fileTargetPath)
  const apiResponse = await api.delete<any, null>(
    `/api/filesystems/${system}/ops/rm`,
    formData,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}

export const postLocalTransferCp = async (
  systemName: string,
  sourcePath: string,
  targetPath: string,
): Promise<GetTransferCpResponse> => {
  const formData = new FormData()
  formData.append('sourcePath', sourcePath)
  formData.append('targetPath', targetPath)
  const apiResponse = await api.post<any, GetTransferCpResponse>(
    `/api/filesystems/${systemName}/transfer/cp`,
    formData,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}

export const postLocalTransferMv = async (
  systemName: string,
  sourcePath: string,
  targetPath: string,
): Promise<GetTransferMvResponse> => {
  const formData = new FormData()
  formData.append('sourcePath', sourcePath)
  formData.append('targetPath', targetPath)
  const apiResponse = await api.post<any, GetTransferMvResponse>(
    `/api/filesystems/${systemName}/transfer/mv`,
    formData,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}

export const postLocalTransferUpload = async (
  systemName: string,
  sourcePath: string,
  targetPath: string,
  fileSize: number,
  account: string | null = null,
): Promise<GetTransferUploadResponse> => {
  const formData = new FormData()
  formData.append('fileName', sourcePath)
  formData.append('path', targetPath)
  formData.append('fileSize', fileSize.toString())
  formData.append('account', account || '')
  const apiResponse = await api.post<any, GetTransferUploadResponse>(
    `/api/filesystems/${systemName}/transfer/upload`,
    formData,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}

export const postLocalTransferDownload = async (
  systemName: string,
  sourcePath: string,
  account: string,
): Promise<GetTransferDownloadResponse> => {
  const formData = new FormData()
  formData.append('path', sourcePath)
  formData.append('account', account)
  const apiResponse = await api.post<any, GetTransferDownloadResponse>(
    `/api/filesystems/${systemName}/transfer/download`,
    formData,
    {},
    ApiTarget.API_LOCAL,
  )
  return apiResponse
}
