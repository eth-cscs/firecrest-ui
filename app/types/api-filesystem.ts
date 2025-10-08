/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

export enum ContentUnit {
  lines = 'lines',
  bytes = 'bytes',
}

export enum FileType {
  file = '-',
  symlink = 'l',
  directory = 'd',
}

export interface TransferJobLogs {
  outputLog: string
  errorLog: string
}

export interface TranferJob {
  jobId: number
  system: string
  workingDirectory: string
  logs: TransferJobLogs
}

export interface File {
  name: string
  type: FileType
  linkTarget?: string
  user: string
  group: string
  permissions: string
  lastModified: string
  size: string
}

export interface FileContent {
  content: string
  contentType: ContentUnit
  startPosition: number
  endPosition: number
}

export interface Checksum {
  message: string
  algorithm: string
  checksum: string
}

export interface GetOpsLsResponse {
  output?: File[]
}

export interface GetOpsTailResponse {
  output?: FileContent
}

export interface GetOpsChecksumResponse {
  output?: Checksum
}

export type PostOpsSymlinkRequest = {
  targetPath: string
  linkPath: string
}

export interface GetOpsSymlinkResponse {
  output?: File
}

export interface PutOpsChownRequest {
  targetPath: string
  owner?: string | null
  group?: string | null
}

export interface GetOpsChownResponse {
  output?: File
}

export interface PutOpsChmodRequest {
  targetPath: string
  mode: string
}

export interface GetOpsChmodResponse {
  output?: File
}

export type DeleteOpsRmRequest = {
  fileTargetPath: string
}

export type PostOpsMkdirRequest = {
  path: string
}

export interface GetOpsMkdirResponse {
  output?: File
}

export type PostFileUploadPayload = {
  path: string
  file: any
}

export interface GetTransferCpResponse {
  transferJob: TranferJob
}

export type PostTransferCpRequest = {
  sourcePath: string
  targetPath: string
}

export interface GetTransferMvResponse {
  transferJob: TranferJob
}

export type PostTransferMvRequest = {
  sourcePath: string
  targetPath: string
}

export interface GetTransferUploadResponse {
  completeUploadUrl: string
  transferJob: TranferJob
  partsUploadUrls: string[]
  maxPartSize: number
}

export interface GetTransferDownloadResponse {
  downloadUrl: string
  transferJob: TranferJob
}

export type PostTransferUploadRequest = {
  path: string
  fileName: string
  fileSize: number
  account?: string
}

export type PostTransferDownloadRequest = {
  path: string
}
