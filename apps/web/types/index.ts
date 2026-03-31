export type Gender = 'MALE' | 'FEMALE'
export type InspectionFrequency = 'QUARTERLY' | 'MONTHLY'
export type ExperimentFrequency = 'QUARTERLY' | 'MONTHLY'

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
  isAdmin: boolean
  gender: Gender
}
