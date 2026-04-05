import type { UserRole, Gender } from './employee'

export interface LoginDto {
  phone: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  employee: {
    id: string
    name: string
    phone: string
    email?: string | null
    avatar?: string | null
    role: UserRole
    gender: Gender
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
