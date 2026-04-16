'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateInput } from '@/components/ui/date-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/auth-context'
import type { Experiment, Customer, Employee } from '@/types'

const schema = z.object({
  customerId: z.string().min(1, '请选择客户'),
  responsiblePersonId: z.string().min(1, '请选择负责人'),
  frequency: z.string().refine(
    (v): v is 'QUARTERLY' | 'MONTHLY' => v === 'QUARTERLY' || v === 'MONTHLY',
    { message: '请选择试验频率' },
  ),
  powerEquipment: z.string().min(1, '电力设备不能为空'),
  lastTestDate: z.string().optional().or(z.literal('')),
  nextTestDate: z.string().optional().or(z.literal('')),
  safetyTools: z.string().optional().or(z.literal('')),
  contactPerson: z.string().min(1, '联系人不能为空'),
  contactInfo: z.string().min(1, '联系方式不能为空'),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
  experiment?: Experiment | null
  isSaving?: boolean
}

export function ExperimentForm({ open, onClose, onSave, experiment, isSaving }: Props) {
  const isEdit = !!experiment
  const { user } = useAuth()
  const isStaff = user?.role === 'STAFF'
  const [customers, setCustomers] = useState<Customer[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {},
  })

  useEffect(() => {
    if (!open) return
    apiClient.get<{ items: Customer[] }>('/customers?pageSize=200&isDeleted=false')
      .then((res) => setCustomers(res.items ?? []))
      .catch(() => setCustomers([]))
    apiClient.get<{ items: Employee[] }>('/employees?pageSize=200')
      .then((res) => setEmployees((res.items ?? []).filter((e) => e.role !== 'ADMIN')))
      .catch(() => setEmployees([]))
  }, [open])

  useEffect(() => {
    if (open) {
      if (experiment) {
        reset({
          customerId: experiment.customerId,
          responsiblePersonId: experiment.responsiblePersonId,
          frequency: experiment.frequency,
          powerEquipment: experiment.powerEquipment,
          lastTestDate: experiment.lastTestDate ? experiment.lastTestDate.split('T')[0] : '',
          nextTestDate: experiment.nextTestDate ? experiment.nextTestDate.split('T')[0] : '',
          safetyTools: experiment.safetyTools || '',
          contactPerson: experiment.contactPerson,
          contactInfo: experiment.contactInfo,
        })
      } else {
        reset({
          customerId: '',
          // STAFF defaults to themselves; others start blank
          responsiblePersonId: isStaff && user ? user.id : '',
          frequency: '' as 'QUARTERLY' | 'MONTHLY',
          powerEquipment: '',
          safetyTools: '',
          contactPerson: '',
          contactInfo: '',
        })
      }
    }
  }, [open, experiment, reset, isStaff, user])

  const frequency = watch('frequency')
  const customerId = watch('customerId')
  const responsiblePersonId = watch('responsiblePersonId')

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑试验' : '新增试验'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>客户 <span className="text-red-500">*</span></Label>
              <Select value={customerId} onValueChange={(v) => setValue('customerId', v)}>
                <SelectTrigger><SelectValue placeholder="请选择客户" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && <p className="text-red-500 text-xs">{errors.customerId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>试验频率 <span className="text-red-500">*</span></Label>
              <Select value={frequency ?? ''} onValueChange={(v) => setValue('frequency', v as 'QUARTERLY' | 'MONTHLY', { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUARTERLY">每年1次</SelectItem>
                  <SelectItem value="MONTHLY">2年1次</SelectItem>
                </SelectContent>
              </Select>
              {errors.frequency && <p className="text-red-500 text-xs">{errors.frequency.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>负责人 <span className="text-red-500">*</span></Label>
            <Select
              value={responsiblePersonId}
              onValueChange={(v) => setValue('responsiblePersonId', v)}
              disabled={isStaff}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择负责人（非管理员）" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}（{e.role === 'DEPT_MANAGER' ? '部门负责人' : '职员'}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isStaff && <p className="text-xs text-slate-400">职员只能将自己设为负责人</p>}
            {errors.responsiblePersonId && <p className="text-red-500 text-xs">{errors.responsiblePersonId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>电力设备 <span className="text-red-500">*</span></Label>
            <Textarea {...register('powerEquipment')} placeholder="例：主变压器绕组绝缘电阻测试" className="resize-none h-20" />
            {errors.powerEquipment && <p className="text-red-500 text-xs">{errors.powerEquipment.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>上次试验日期</Label>
              <DateInput {...register('lastTestDate')} />
            </div>
            <div className="space-y-1.5">
              <Label>下次试验日期</Label>
              <DateInput {...register('nextTestDate')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>安全工器具</Label>
            <Textarea {...register('safetyTools')} placeholder="例：绝缘手套、绝缘靴、验电器等" className="resize-none h-20" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>试验联系人 <span className="text-red-500">*</span></Label>
              <Input {...register('contactPerson')} placeholder="联系人姓名" />
              {errors.contactPerson && <p className="text-red-500 text-xs">{errors.contactPerson.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>联系方式 <span className="text-red-500">*</span></Label>
              <Input {...register('contactInfo')} placeholder="手机号" />
              {errors.contactInfo && <p className="text-red-500 text-xs">{errors.contactInfo.message}</p>}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={isSaving} className="bg-red-600 hover:bg-red-700">
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  保存中...
                </span>
              ) : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
