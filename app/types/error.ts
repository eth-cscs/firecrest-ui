export enum ErrorType {
  error = 'error',
  validation = 'validation',
  http = 'http',
}

export interface ErrorResponse {
  type: ErrorType
  message: string
  error?: any
}

export interface ValidationErrorResponse extends ErrorResponse {
  fields: Array<any>
}

export interface HttpErrorResponse extends ErrorResponse {
  statusCode: number
  data?: any
}
