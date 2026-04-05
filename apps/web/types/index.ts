export type Gender = 'MALE' | 'FEMALE'
export type UserRole = 'ADMIN' | 'DEPT_MANAGER' | 'STAFF'
export type InspectionFrequency = 'QUARTERLY' | 'MONTHLY'
export type ExperimentFrequency = 'QUARTERLY' | 'MONTHLY'

export interface Employee {
  id: string
  name: string
  gender: Gender
  phone: string
  avatar?: string | null
  email?: string | null
  role: UserRole
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

export interface EmployeeFormValues {
  name: string
  gender: Gender
  phone: string
  password?: string
  email?: string
  role: UserRole
}

export interface EmployeesListResponse {
  items: Employee[]
  total: number
  page: number
  pageSize: number
}

export interface Customer {
  id: string
  companyName: string
  projectOverview?: string | null
  contactPerson: string
  contactInfo: string
  lastPatrolTime?: string | null
  isDeleted?: boolean
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CustomerLog {
  id: string
  customerId: string
  action: string
  detail?: string | null
  operatorId: string
  operator?: { id: string; name: string }
  operatorName?: string
  createdAt: string
}

export interface CustomerWithDetails extends Customer {
  inspections: Array<{
    id: string
    customerId: string
    frequency: InspectionFrequency
    powerEquipment: string
    lastInspectionDate?: string | null
    nextInspectionDate?: string | null
    safetyTools?: string | null
    contactPerson: string
    contactInfo: string
    createdAt: string
    updatedAt: string
  }>
  experiments: Array<{
    id: string
    customerId: string
    frequency: ExperimentFrequency
    powerEquipment: string
    lastTestDate?: string | null
    nextTestDate?: string | null
    safetyTools?: string | null
    contactPerson: string
    contactInfo: string
    createdAt: string
    updatedAt: string
  }>
  logs: Array<{
    id: string
    customerId: string
    action: string
    detail?: string | null
    operatorId: string
    operator: { id: string; name: string }
    createdAt: string
  }>
}

export interface Inspection {
  id: string
  customerId: string
  customerName?: string
  frequency: InspectionFrequency
  powerEquipment: string
  lastInspectionDate?: string | null
  nextInspectionDate?: string | null
  safetyTools?: string | null
  contactPerson: string
  contactInfo: string
  createdAt: string
  updatedAt: string
}

export interface InspectionLog {
  id: string
  inspectionId: string
  action: string
  detail?: string | null
  operatorId: string
  operatorName?: string
  createdAt: string
}

export interface Experiment {
  id: string
  customerId: string
  customerName?: string
  frequency: ExperimentFrequency
  powerEquipment: string
  lastTestDate?: string | null
  nextTestDate?: string | null
  safetyTools?: string | null
  contactPerson: string
  contactInfo: string
  createdAt: string
  updatedAt: string
}

export interface ExperimentLog {
  id: string
  experimentId: string
  action: string
  detail?: string | null
  operatorId: string
  operatorName?: string
  createdAt: string
}

export interface CurrentUser {
  id: string
  name: string
  phone: string
  email?: string | null
  avatar?: string | null
  role: UserRole
  gender: Gender
}

export function canManageEmployees(role?: UserRole): boolean {
  return role === 'ADMIN' || role === 'DEPT_MANAGER'
}

export function canAssignEmployeeRole(currentRole: UserRole | undefined, targetRole: UserRole): boolean {
  if (currentRole === 'ADMIN') return true
  if (currentRole === 'DEPT_MANAGER') return targetRole === 'STAFF'
  return false
}

export function canManageEmployeeRecord(
  currentRole: UserRole | undefined,
  targetRole: UserRole,
): boolean {
  if (currentRole === 'ADMIN') return true
  if (currentRole === 'DEPT_MANAGER') return targetRole === 'STAFF'
  return false
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: '管理员',
  DEPT_MANAGER: '部门负责人',
  STAFF: '职员',
}
