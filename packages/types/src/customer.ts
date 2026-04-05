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

export interface CustomerWithDetails extends Customer {
  inspections: Array<{
    id: string
    customerId: string
    frequency: 'QUARTERLY' | 'MONTHLY'
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
    frequency: 'QUARTERLY' | 'MONTHLY'
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

export interface CustomerLog {
  id: string
  customerId: string
  action: string
  detail?: string | null
  operatorId: string
  operatorName?: string
  createdAt: string
}

export interface CreateCustomerDto {
  companyName: string
  projectOverview?: string
  contactPerson: string
  contactInfo: string
  lastPatrolTime?: string
}

export interface UpdateCustomerDto {
  companyName?: string
  projectOverview?: string
  contactPerson?: string
  contactInfo?: string
  lastPatrolTime?: string
}
