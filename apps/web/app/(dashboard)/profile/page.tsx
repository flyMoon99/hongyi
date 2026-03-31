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

const profileSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  gender: z.enum(['MALE', 'FEMALE']),
  phone: z.string().min(11, '手机号格式不正确'),
  email: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, '请输入当前密码'),
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
      phone: user?.phone || '',
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
      const url = ev.target?.result as string
      setAvatarUrl(url)
    }
    reader.readAsDataURL(file)
  }

  const onSaveProfile = async (data: ProfileForm) => {
    setIsSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    updateUser({ ...data, avatar: avatarUrl || null })
    toast.success('个人信息已更新')
    setIsSaving(false)
  }

  const onChangePassword = async (_data: PasswordForm) => {
    setIsChangingPwd(true)
    await new Promise((r) => setTimeout(r, 600))
    toast.success('密码修改成功，下次登录时生效')
    resetPwd()
    setIsChangingPwd(false)
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
                <p className="text-sm text-slate-500">{user?.isAdmin ? '管理员' : '普通用户'}</p>
                <p className="text-xs text-slate-400 mt-1">支持 JPG/PNG，最大 2MB</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>姓名 <span className="text-red-500">*</span></Label>
                <Input {...register('name')} placeholder="请输入姓名" />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>性别 <span className="text-red-500">*</span></Label>
                <Select value={gender} onValueChange={(v) => setValue('gender', v as 'MALE' | 'FEMALE')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">男</SelectItem>
                    <SelectItem value="FEMALE">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>手机号 <span className="text-red-500">*</span></Label>
                <Input {...register('phone')} type="tel" placeholder="请输入手机号" />
                {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>邮箱</Label>
                <Input {...register('email')} type="email" placeholder="请输入邮箱（选填）" />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving} className="bg-red-600 hover:bg-red-700">
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    保存中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save size={14} /> 保存信息
                  </span>
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
          <CardDescription>定期修改密码有助于保护账户安全</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePwdSubmit(onChangePassword)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>当前密码 <span className="text-red-500">*</span></Label>
              <Input {...regPwd('currentPassword')} type="password" placeholder="请输入当前密码" />
              {pwdErrors.currentPassword && (
                <p className="text-red-500 text-xs">{pwdErrors.currentPassword.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>新密码 <span className="text-red-500">*</span></Label>
                <Input {...regPwd('newPassword')} type="password" placeholder="至少6位" />
                {pwdErrors.newPassword && (
                  <p className="text-red-500 text-xs">{pwdErrors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>确认新密码 <span className="text-red-500">*</span></Label>
                <Input {...regPwd('confirmPassword')} type="password" placeholder="再次输入新密码" />
                {pwdErrors.confirmPassword && (
                  <p className="text-red-500 text-xs">{pwdErrors.confirmPassword.message}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="outline" disabled={isChangingPwd}>
                {isChangingPwd ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-600 border-t-transparent animate-spin" />
                    修改中...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock size={14} /> 修改密码
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
