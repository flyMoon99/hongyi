export type Gender = 'MALE' | 'FEMALE'
export type UserRole = 'ADMIN' | 'DEPT_MANAGER' | 'STAFF'
export type Company = 'HAODING_HONGYI' | 'STATE_GRID'
export type InspectionFrequency = 'QUARTERLY' | 'MONTHLY' | 'TWICE_MONTHLY' | 'ANNUALLY'
export type ExperimentFrequency = 'QUARTERLY' | 'MONTHLY'
export type FireInspectionFrequency = 'ANNUALLY' | 'QUARTERLY'
export type FireEquipment = 'GAS_SUPPRESSION' | 'FIRE_EXTINGUISHER'

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
  customer?: { id: string; companyName: string }
  responsiblePersonId: string
  responsiblePerson?: { id: string; name: string }
  frequency: InspectionFrequency
  powerEquipment: string
  lastInspectionDate?: string | null
  nextInspectionDate?: string | null
  safetyTools?: string | null
  contactPerson: string
  contactInfo: string
  isDeleted: boolean
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface InspectionLog {
  id: string
  inspectionId: string
  action: string
  detail?: string | null
  operatorId: string
  operator?: { id: string; name: string }
  operatorName?: string
  createdAt: string
}

export interface InspectionWithLogs extends Inspection {
  customer: { id: string; companyName: string }
  logs: Array<{
    id: string
    action: string
    detail?: string | null
    createdAt: string
    operator: { id: string; name: string }
  }>
}

export interface Experiment {
  id: string
  customerId: string
  customerName?: string
  customer?: { id: string; companyName: string }
  responsiblePersonId: string
  responsiblePerson?: { id: string; name: string }
  frequency: ExperimentFrequency
  powerEquipment: string
  lastTestDate?: string | null
  nextTestDate?: string | null
  safetyTools?: string | null
  contactPerson: string
  contactInfo: string
  isDeleted: boolean
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface ExperimentLog {
  id: string
  experimentId: string
  action: string
  detail?: string | null
  operatorId: string
  operator?: { id: string; name: string }
  operatorName?: string
  createdAt: string
}

export interface ExperimentWithLogs extends Experiment {
  customer: { id: string; companyName: string }
  logs: Array<{
    id: string
    action: string
    detail?: string | null
    createdAt: string
    operator: { id: string; name: string }
  }>
}

export interface CurrentUser {
  id: string
  name: string
  phone: string
  email?: string | null
  avatar?: string | null
  role: UserRole
  gender: Gender
  company: Company | null
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

export const COMPANY_LABELS: Record<Company, string> = {
  HAODING_HONGYI: '皓鼎弘毅',
  STATE_GRID: '电网',
}

export const FIRE_INSPECTION_FREQUENCY_LABELS: Record<FireInspectionFrequency, string> = {
  ANNUALLY: '年度巡检',
  QUARTERLY: '季度巡检',
}

export const FIRE_EQUIPMENT_LABELS: Record<FireEquipment, string> = {
  GAS_SUPPRESSION: '气灭装置',
  FIRE_EXTINGUISHER: '灭火器',
}

/** 判断用户是否可以写某模块 */
export function canWriteModule(user: CurrentUser | null | undefined, mod: string): boolean {
  if (!user) return false
  const { role, company } = user
  if (role === 'ADMIN') return mod === 'employees'
  if (role !== 'DEPT_MANAGER') return false
  if (mod === 'employees') return true
  if (company === 'HAODING_HONGYI') return ['customers', 'inspections', 'experiments'].includes(mod)
  if (company === 'STATE_GRID') return ['station-rooms', 'fire-inspections'].includes(mod)
  return false
}

/** 判断用户是否可以读某模块（包含写权限的也可以读） */
export function canReadModule(user: CurrentUser | null | undefined, mod: string): boolean {
  if (!user) return false
  const { role, company } = user
  if (role === 'ADMIN') return mod === 'employees'
  if (mod === 'employees') return role === 'DEPT_MANAGER'
  if (company === 'HAODING_HONGYI') return ['customers', 'inspections', 'experiments'].includes(mod)
  if (company === 'STATE_GRID') return ['station-rooms', 'fire-inspections'].includes(mod)
  return false
}

export interface StationRoom {
  id: string
  name: string
  remark?: string | null
  contactPerson: string
  contactInfo: string
  company: Company
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface StationRoomLog {
  id: string
  stationRoomId: string
  action: string
  detail?: string | null
  operatorId: string
  operator?: { id: string; name: string }
  createdAt: string
}

export interface StationRoomWithLogs extends StationRoom {
  logs: StationRoomLog[]
}

export interface FireInspection {
  id: string
  stationRoomId: string
  stationRoom?: { id: string; name: string }
  frequency: FireInspectionFrequency
  responsiblePerson: string
  equipment: FireEquipment[]
  gasLastInspectionDate?: string | null
  gasNextInspectionDate?: string | null
  extLastInspectionDate?: string | null
  extNextInspectionDate?: string | null
  remark?: string | null
  contactPerson: string
  contactInfo: string
  company: Company
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface FireInspectionLog {
  id: string
  fireInspectionId: string
  action: string
  detail?: string | null
  operatorId: string
  operator?: { id: string; name: string }
  createdAt: string
}

export interface FireInspectionWithLogs extends FireInspection {
  logs: FireInspectionLog[]
}
