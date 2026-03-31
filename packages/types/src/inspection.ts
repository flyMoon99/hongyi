export type InspectionFrequency = 'QUARTERLY' | 'MONTHLY'

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

export interface CreateInspectionDto {
  customerId: string
  frequency: InspectionFrequency
  powerEquipment: string
  lastInspectionDate?: string
  nextInspectionDate?: string
  safetyTools?: string
  contactPerson: string
  contactInfo: string
}

export interface UpdateInspectionDto {
  customerId?: string
  frequency?: InspectionFrequency
  powerEquipment?: string
  lastInspectionDate?: string
  nextInspectionDate?: string
  safetyTools?: string
  contactPerson?: string
  contactInfo?: string
}
