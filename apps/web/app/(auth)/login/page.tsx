'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, Smartphone, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import type { CurrentUser } from '@/types'

const loginSchema = z.object({
  phone: z.string().min(1, '请输入手机号'),
  password: z.string().min(1, '请输入密码'),
})

type LoginForm = z.infer<typeof loginSchema>

const MOCK_ACCOUNTS: Record<string, { user: CurrentUser; password: string }> = {
  '13800138001': {
    password: '123456',
    user: {
      id: 'emp-1',
      name: '张伟',
      phone: '13800138001',
      email: 'zhangwei@holdingpower.cn',
      avatar: null,
      isAdmin: true,
      gender: 'MALE',
    },
  },
  '13800138002': {
    password: '123456',
    user: {
      id: 'emp-2',
      name: '李娜',
      phone: '13800138002',
      email: 'lina@holdingpower.cn',
      avatar: null,
      isAdmin: false,
      gender: 'FEMALE',
    },
  },
}

function doLogin(account: { user: CurrentUser; password: string }, loginFn: (u: CurrentUser, t: string) => void) {
  loginFn(account.user, 'mock-jwt-token-12345')
  toast.success(`欢迎回来，${account.user.name}！`)
  window.location.replace('/')
}

export default function LoginPage() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 400))

    const account = MOCK_ACCOUNTS[data.phone.trim()]
    if (!account || account.password !== data.password.trim()) {
      toast.error('手机号或密码错误')
      setIsLoading(false)
      return
    }

    doLogin(account, login)
  }

  const quickLogin = async (phone: string) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 400))
    const account = MOCK_ACCOUNTS[phone]
    if (account) doLogin(account, login)
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
      {/* Dark overlay — keeps text readable */}
      <div className="absolute inset-0 bg-[#0a1628]/80" />
      {/* Subtle red vignette at bottom */}
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

          {/* Quick login — bypasses form fields entirely, ignores browser autofill */}
          <div className="mt-5 rounded-lg bg-white/[0.03] border border-white/8 p-3.5">
            <p className="text-[11px] text-slate-500 font-medium mb-3 uppercase tracking-wider">快速测试登录</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => quickLogin('13800138001')}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-red-500/40 px-3 py-2.5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn size={13} className="text-red-400 flex-shrink-0" />
                <div>
                  <div className="text-[12px] text-white font-medium">管理员</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">...138001</div>
                </div>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => quickLogin('13800138002')}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-slate-500/40 px-3 py-2.5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn size={13} className="text-slate-400 flex-shrink-0" />
                <div>
                  <div className="text-[12px] text-white font-medium">普通用户</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">...138002</div>
                </div>
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-2.5 text-center">点击按钮一键登录，无需填写表单</p>
          </div>

        </div>
      </div>
    </div>
  )
}
