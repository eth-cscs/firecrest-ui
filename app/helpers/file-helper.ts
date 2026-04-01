/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

const FILE_PATH_REGEXP: string = '^(.+)/([^/]+)$'
const DIR_PATH_REGEXP: string = '^/$|(/[a-zA-Z_0-9-]+)+$'
const CHMOD_REGEXP: string = '^[0-7]{3}$'

const buildValidationError = ({ validPath, validationMessage, canCD }: any) => {
  return {
    validPath,
    validationMessage,
    canCD,
  }
}

const validateFilePath = ({ filePath }: any) => {
  if (!filePath || filePath.trim() === '') {
    return buildValidationError({
      validPath: true,
      validationMessage: 'OK',
      canCD: false,
    })
  }

  if (filePath.startsWith('/')) {
    return buildValidationError({
      validPath: false,
      validationMessage: 'Path should be not absolute',
      canCD: false,
    })
  }

  // absolute pattern (adds a slash)
  if (`/${filePath}`.match(DIR_PATH_REGEXP)) {
    return buildValidationError({
      validPath: true,
      validationMessage: 'OK',
      canCD: true,
    })
  }

  return buildValidationError({
    validPath: false,
    validationMessage: 'File path not valid',
    canCD: false,
  })
}

const getBytesLimit = ({ utilitiesMaxFileSize }: any) => {
  const { unit, value } = utilitiesMaxFileSize
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  if (value == 0) {
    return 0
  }

  const i = sizes.indexOf(unit)

  const limitBytes = value * Math.pow(1024, i)
  return limitBytes
}

const prettyBytes = (
  bytes: any,
  base: number = 1024,
  decimals: number = 2,
  printUnit: boolean = true,
) => {
  if (!+bytes) return '0 Bytes'
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(base))
  const value = parseFloat((bytes / Math.pow(base, i)).toFixed(dm))
  if (printUnit) {
    return `${value} ${sizes[i]}`
  }
  return value
}

const PREVIEW_SIZE_LIMIT = 5 * 1024 * 1024 // 5 MB

const PREVIEW_MIME_TYPES: Record<string, string> = {
  // Documents
  pdf: 'application/pdf',
  // Images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  // Text / code — served as plain text so the browser displays them inline
  txt: 'text/plain',
  log: 'text/plain',
  out: 'text/plain',
  err: 'text/plain',
  csv: 'text/plain',
  md: 'text/plain',
  json: 'text/plain',
  xml: 'text/plain',
  yaml: 'text/plain',
  yml: 'text/plain',
  sh: 'text/plain',
  py: 'text/plain',
  js: 'text/plain',
  ts: 'text/plain',
  html: 'text/plain',
  css: 'text/plain',
  // Video
  mp4: 'video/mp4',
  webm: 'video/webm',
  // Audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
}

// Extensions that should open in the in-app text viewer
const TEXT_PREVIEW_EXTENSIONS = new Set([
  'txt', 'log', 'out', 'err', 'csv', 'md', 'json', 'xml', 'yaml', 'yml',
  'sh', 'py', 'js', 'ts', 'html', 'css',
])

const getFileExtension = (filename: string): string => {
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex === -1) return ''
  return filename.substring(dotIndex + 1).toLowerCase()
}

const isPreviewable = (filename: string): boolean => {
  return getFileExtension(filename) in PREVIEW_MIME_TYPES
}

const isTextPreviewable = (filename: string): boolean => {
  return TEXT_PREVIEW_EXTENSIONS.has(getFileExtension(filename))
}

const getMimeType = (filename: string): string => {
  return PREVIEW_MIME_TYPES[getFileExtension(filename)] ?? 'application/octet-stream'
}

export {
  DIR_PATH_REGEXP,
  FILE_PATH_REGEXP,
  CHMOD_REGEXP,
  validateFilePath,
  getBytesLimit,
  prettyBytes,
  PREVIEW_SIZE_LIMIT,
  isPreviewable,
  isTextPreviewable,
  getMimeType,
}
