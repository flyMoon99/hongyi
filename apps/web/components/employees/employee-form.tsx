'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { canAssignEmployeeRole } from '@/types'
import type { Employee, EmployeeFormValues, UserRole } from '@/types'

const schema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  gender: z.enum(['MALE', 'FEMALE']),
  phone: z.string().min(11, '手机号格式不正确'),
  password: z.string().min(6, '密码至少6位').optional().or(z.literal('')),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'DEPT_MANAGER', 'STAFF']),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: EmployeeFormValues) => Promise<void>
  employee?: Employee | null
  currentUserRole?: UserRole
  isSaving?: boolean
}

const roleOptions: Array<{ value: FormData['role']; label: string }> = [
  { value: 'ADMIN', label: '管理员' },
  { value: 'DEPT_MANAGER', label: '部门负责人' },
  { value: 'STAFF', label: '职员' },
]

export function EmployeeForm({ open, onClose, onSave, employee, currentUserRole, isSaving }: Props) {
  const isEdit = !!employee
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { gender: 'MALE', role: 'STAFF' },
  })

  useEffect(() => {
    if (open) {
      if (employee) {
        reset({
          name: employee.name,
          gender: employee.gender,
          phone: employee.phone,
          email: employee.email || '',
          role: employee.role,
          password: '',
        })
      } else {
        reset({ name: '', gender: 'MALE', phone: '', email: '', role: 'STAFF', password: '' })
      }
    }
  }, [open, employee, reset])

  const gender = watch('gender')
  const role = watch('role')
  const availableRoles = roleOptions.filter((item) => canAssignEmployeeRole(currentUserRole, item.value))

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑员工' : '新增员工'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>姓名 <span className="text-red-500">*</span></Label>
              <Input {...register('name')} placeholder="请输入姓名" />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>性别 <span className="text-red-500">*</span></Label>
              <Select value={gender} onValueChange={(v) => setValue('gender', v as 'MALE' | 'FEMALE')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">男</SelectItem>
                  <SelectItem value="FEMALE">女</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>手机号 <span className="text-red-500">*</span></Label>
            <Input {...register('phone')} type="tel" placeholder="请输入手机号" />
            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>
              {isEdit ? '新密码（不修改则留空）' : '密码'}
              {!isEdit && <span className="text-red-500"> *</span>}
            </Label>
            <Input {...register('password')} type="password" placeholder={isEdit ? '不修改请留空' : '请设置登录密码'} />
            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>邮箱</Label>
            <Input {...register('email')} type="email" placeholder="请输入邮箱（选填）" />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>角色 <span className="text-red-500">*</span></Label>
            <Select value={role} onValueChange={(v) => setValue('role', v as FormData['role'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableRoles.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>取消</Button>
            <Button type="submit" disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white">
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
