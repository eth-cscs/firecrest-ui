// types
import { ErrorType } from '~/types/error'

export const getErrorFromData = (data: any) => {
  if (data && data?.error) {
    return data.error
  }
  return null
}

export const getFormErrorFieldsFromError = (error: any) => {
  if (error && error?.type && error.type === ErrorType.validation) {
    return error.fields
  }
  return null
}
