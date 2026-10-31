export interface User {
  id: string
  full_name: string
  mobile_number: string
  role: 'FARMER' | 'ADMIN'
  village?: string | null
  preferred_language: string
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface FarmerRegisterPayload {
  full_name: string
  mobile_number: string
  password: string
  village?: string
  preferred_language?: string
}

export interface LoginPayload {
  mobile_number: string
  password: string
}

export interface ApiErrorDetail {
  loc?: (string | number)[]
  msg: string
  type?: string
}

export interface ApiErrorResponse {
  detail?: string | ApiErrorDetail[]
}

