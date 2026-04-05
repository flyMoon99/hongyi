'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import apiClient from '@/lib/api-client'
import type { CurrentUser } from '@/types'

const loginSchema = z.object({
  phone: z.string().min(1, '请输入手机号'),
  password: z.string().min(1, '请输入密码'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const doLogin = async (phone: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await apiClient.post('/auth/login', { phone, password }) as any
      const data = res.accessToken ? res : res.data
      const emp = data.employee
      const currentUser: CurrentUser = {
        id: emp.id,
        name: emp.name,
        phone: emp.phone,
        email: emp.email ?? null,
        avatar: emp.avatar ?? null,
        role: emp.role,
        gender: emp.gender,
      }
      login(currentUser, data.accessToken)
      toast.success(`欢迎回来，${currentUser.name}！`)
      window.location.replace('/')
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : '手机号或密码错误')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: LoginForm) => {
    await doLogin(data.phone.trim(), data.password.trim())
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1920&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-[#0a1628]/80" />
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-red-950/30 to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/60">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/logo.png"
              alt="皓鼎弘毅"
              width={195}
              height={66}
              priority
              style={{ width: 'auto', height: 56 }}
            />
            <p className="text-slate-400 text-[14px] mt-3 tracking-widest">电力服务管理系统</p>
            <div className="w-10 h-[2px] bg-red-600 rounded-full mt-3" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="new-password">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm font-normal">手机号</Label>
              <div className="relative">
                <Smartphone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <Input
                  {...register('phone')}
                  type="text"
                  inputMode="numeric"
                  autoComplete="new-password"
                  placeholder="请输入手机号"
                  className="pl-9 h-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-red-500/50 focus-visible:border-red-500/50"
                />
              </div>
              {errors.phone && <p className="text-red-400 text-xs">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm font-normal">密码</Label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="请输入密码"
                  className="pl-9 pr-10 h-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-red-500/50 focus-visible:border-red-500/50"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium text-sm tracking-wider transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  登录中...
                </span>
              ) : '登 录'}
            </Button>
          </form>

          {/* Quick login hint */}
          <div className="mt-5 rounded-lg bg-white/[0.03] border border-white/8 p-3.5">
            <p className="text-[11px] text-slate-500 font-medium mb-1 uppercase tracking-wider">测试账号</p>
            <p className="text-[12px] text-slate-400">手机号：<span className="font-mono text-slate-300">13800138001</span></p>
            <p className="text-[12px] text-slate-400 mt-0.5">密码：<span className="font-mono text-slate-300">Admin@123456</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
