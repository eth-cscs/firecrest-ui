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

export {
  DIR_PATH_REGEXP,
  FILE_PATH_REGEXP,
  CHMOD_REGEXP,
  validateFilePath,
  getBytesLimit,
  prettyBytes,
}
