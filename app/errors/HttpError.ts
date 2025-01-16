import { ReasonPhrases, StatusCodes } from 'http-status-codes'

export enum HttpErrorVisbility {
  public = 'public',
  private = 'private',
}

export class HttpError extends Error {
  statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR
  message: string = ReasonPhrases.INTERNAL_SERVER_ERROR
  error: any = null
  visibility: HttpErrorVisbility = HttpErrorVisbility.public
  data: any = null

  constructor(
    statusCode: number,
    message: string,
    error: any = null,
    visibility: HttpErrorVisbility = HttpErrorVisbility.public,
    data: any = null,
  ) {
    super()
    this.statusCode = statusCode
    this.message = message
    this.error = error
    this.visibility = visibility
    this.data = data
  }
}
