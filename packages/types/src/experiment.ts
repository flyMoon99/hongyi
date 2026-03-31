export type ExperimentFrequency = 'QUARTERLY' | 'MONTHLY'

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

export interface CreateExperimentDto {
  customerId: string
  frequency: ExperimentFrequency
  powerEquipment: string
  lastTestDate?: string
  nextTestDate?: string
  safetyTools?: string
  contactPerson: string
  contactInfo: string
}

export interface UpdateExperimentDto {
  customerId?: string
  frequency?: ExperimentFrequency
  powerEquipment?: string
  lastTestDate?: string
  nextTestDate?: string
  safetyTools?: string
  contactPerson?: string
  contactInfo?: string
}
