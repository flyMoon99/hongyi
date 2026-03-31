'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Customer } from '@/types'

const schema = z.object({
  companyName: z.string().min(1, '企业名称不能为空'),
  projectOverview: z.string().optional().or(z.literal('')),
  contactPerson: z.string().min(1, '联系人不能为空'),
  contactInfo: z.string().min(1, '联系方式不能为空'),
  lastPatrolTime: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
  customer?: Customer | null
  isSaving?: boolean
}

export function CustomerForm({ open, onClose, onSave, customer, isSaving }: Props) {
  const isEdit = !!customer
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      if (customer) {
        reset({
          companyName: customer.companyName,
          projectOverview: customer.projectOverview || '',
          contactPerson: customer.contactPerson,
          contactInfo: customer.contactInfo,
          lastPatrolTime: customer.lastPatrolTime ? customer.lastPatrolTime.split('T')[0] : '',
        })
      } else {
        reset({ companyName: '', projectOverview: '', contactPerson: '', contactInfo: '', lastPatrolTime: '' })
      }
    }
  }, [open, customer, reset])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑客户' : '新增客户'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>企业名称 <span className="text-red-500">*</span></Label>
            <Input {...register('companyName')} placeholder="请输入企业名称" />
            {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>工程概况</Label>
            <textarea
              {...register('projectOverview')}
              placeholder="请简述工程项目概况"
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>联系人 <span className="text-red-500">*</span></Label>
              <Input {...register('contactPerson')} placeholder="请输入联系人" />
              {errors.contactPerson && <p className="text-red-500 text-xs">{errors.contactPerson.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>联系方式 <span className="text-red-500">*</span></Label>
              <Input {...register('contactInfo')} placeholder="手机号或座机" />
              {errors.contactInfo && <p className="text-red-500 text-xs">{errors.contactInfo.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>最近巡视时间</Label>
            <Input {...register('lastPatrolTime')} type="date" />
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
