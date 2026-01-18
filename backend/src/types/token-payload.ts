// Type : Decrit le payload des JWT utilises par l'application.
export interface TokenPayload {
  id: number
  login: string
  role: string
  jti?: string
  iat?: number // Date d'emission
  exp?: number // Date d'expiration
}
