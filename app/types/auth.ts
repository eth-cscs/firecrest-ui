export interface AuthUser {
  username: string
  email: string
  firstName: string
  lastLame: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expirationDate: Date
  refreshExpirationDate: Date
}

export interface Auth {
  user: AuthUser
  tokens: AuthTokens
}
