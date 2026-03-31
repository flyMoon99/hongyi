export interface LoginDto {
  phone: string
  password: string
  captcha: string
}

export interface LoginResponse {
  accessToken: string
  employee: {
    id: string
    name: string
    phone: string
    email?: string | null
    avatar?: string | null
    isAdmin: boolean
    gender: string
  }
}

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
