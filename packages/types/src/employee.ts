export type Gender = 'MALE' | 'FEMALE'
export type UserRole = 'ADMIN' | 'DEPT_MANAGER' | 'STAFF'
export type Company = 'HAODING_HONGYI' | 'STATE_GRID'

export interface Employee {
  id: string
  name: string
  gender: Gender
  phone: string
  avatar?: string | null
  email?: string | null
  role: UserRole
  company: Company | null
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface EmployeeLogItem {
  id: string
  action: string
  detail?: string | null
  createdAt: string
  operator: { id: string; name: string }
}

export interface EmployeeWithLogs extends Employee {
  employeeLogs: EmployeeLogItem[]
}

export interface CreateEmployeeDto {
  name: string
  gender: Gender
  phone: string
  password: string
  avatar?: string
  email?: string
  role?: UserRole
  company?: Company
}

export interface UpdateEmployeeDto {
  name?: string
  gender?: Gender
  phone?: string
  password?: string
  avatar?: string
  email?: string
  role?: UserRole
  company?: Company
}
