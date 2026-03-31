export interface Customer {
  id: string
  companyName: string
  projectOverview?: string | null
  contactPerson: string
  contactInfo: string
  lastPatrolTime?: string | null
  createdAt: string
  updatedAt: string
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
