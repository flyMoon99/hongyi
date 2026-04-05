'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Camera, Save, Lock, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/auth-context'
import { ROLE_LABELS } from '@/types'
import apiClient from '@/lib/api-client'

const profileSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  gender: z.enum(['MALE', 'FEMALE']),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
})

const passwordSchema = z
  .object({
    newPassword: z.string().min(6, '新密码至少6位'),
    confirmPassword: z.string().min(1, '请确认新密码'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: '两次密码不一致',
    path: ['confirmPassword'],
  })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPwd, setIsChangingPwd] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      gender: user?.gender || 'MALE',
      email: user?.email || '',
    },
  })

  const {
    register: regPwd,
    handleSubmit: handlePwdSubmit,
    reset: resetPwd,
    formState: { errors: pwdErrors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAvatarUrl(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const onSaveProfile = async (data: ProfileForm) => {
    setIsSaving(true)
    try {
      const res = await apiClient.put('/auth/me', { ...data, avatar: avatarUrl || null }) as any
      const updated = res.id ? res : res.data
      updateUser({ ...updated })
      toast.success('个人信息已更新')
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : '更新失败')
    } finally {
      setIsSaving(false)
    }
  }

  const onChangePassword = async (data: PasswordForm) => {
    setIsChangingPwd(true)
    try {
      await apiClient.put('/auth/me/password', { newPassword: data.newPassword })
      toast.success('密码修改成功，下次登录时生效')
      resetPwd()
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : '密码修改失败')
    } finally {
      setIsChangingPwd(false)
    }
  }

  const gender = watch('gender')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User size={16} className="text-red-600" />
            基本信息
          </CardTitle>
          <CardDescription>修改您的个人资料信息</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-red-100 text-red-600 text-xl font-bold">
                    {user?.name?.slice(0, 1) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition-colors"
                >
                  <Camera size={12} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>
              <div>
                <p className="font-medium text-slate-800">{user?.name}</p>
                <p className="text-sm text-slate-500">{user?.role ? ROLE_LABELS[user.role] : ''}</p>
                <p className="text-xs text-slate-400 mt-1">支持 JPG/PNG，最大 2MB</p>
              </div>
            </div>

            <Separator />

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
              <Label>邮箱</Label>
              <Input {...register('email')} type="email" placeholder="请输入邮箱（选填）" />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>手机号</Label>
              <Input value={user?.phone || ''} disabled className="bg-slate-50 text-slate-500" />
              <p className="text-xs text-slate-400">手机号为登录账号，不可修改</p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white">
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    保存中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><Save size={15} /> 保存信息</span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock size={16} className="text-red-600" />
            修改密码
          </CardTitle>
          <CardDescription>定期修改密码以保障账户安全</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePwdSubmit(onChangePassword)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>新密码 <span className="text-red-500">*</span></Label>
              <Input {...regPwd('newPassword')} type="password" placeholder="至少6位" />
              {pwdErrors.newPassword && <p className="text-red-500 text-xs">{pwdErrors.newPassword.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>确认新密码 <span className="text-red-500">*</span></Label>
              <Input {...regPwd('confirmPassword')} type="password" placeholder="再次输入新密码" />
              {pwdErrors.confirmPassword && <p className="text-red-500 text-xs">{pwdErrors.confirmPassword.message}</p>}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isChangingPwd} variant="outline">
                {isChangingPwd ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
                    修改中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><Lock size={15} /> 修改密码</span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
