export enum ApiResponseStatus {
  success = 'success',
  error = 'error',
}

export interface ApiResponseMetaAttribute {
  timestamp: number
  appVersion: string
  authUser: any
}

export enum ApiErrorResponseType {
  error = 'error',
  validation = 'validation',
}

export interface ApiErrorResponse {
  errorType: ApiErrorResponseType
  message: string
  data: any
}

export interface ApiResponse {
  status: ApiResponseStatus
  code: number
  meta: ApiResponseMetaAttribute
}

export interface ApiSuccessResponse<T> extends ApiResponse {
  result: T
}
