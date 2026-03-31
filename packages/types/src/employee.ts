export type Gender = 'MALE' | 'FEMALE'

export interface Employee {
  id: string
  name: string
  gender: Gender
  phone: string
  avatar?: string | null
  email?: string | null
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateEmployeeDto {
  name: string
  gender: Gender
  phone: string
  password: string
  avatar?: string
  email?: string
  isAdmin?: boolean
}

export interface UpdateEmployeeDto {
  name?: string
  gender?: Gender
  phone?: string
  password?: string
  avatar?: string
  email?: string
  isAdmin?: boolean
}
