'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Eye, EyeOff, Lock, Smartphone } from 'lucide-react'
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

const TEAL = '#008C6A'
const TEAL_DARK = '#006B50'
const TEAL_LIGHT = '#00A87E'

export default function LoginPage() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const doLogin = async (phone: string, password: string) => {
    setIsLoading(true)
    setLoginError(null)
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
        company: emp.company ?? null,
      }
      login(currentUser, data.accessToken)
      window.location.replace('/')
    } catch (err: any) {
      setLoginError(typeof err === 'string' ? err : '手机号或密码错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: LoginForm) => {
    await doLogin(data.phone.trim(), data.password.trim())
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* 极细顶部色条 */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${TEAL_DARK}, ${TEAL_LIGHT})` }} />

      {/* 主体居中 */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">

        {/* 系统标识 */}
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-2xl font-bold tracking-wide" style={{ color: '#1A2E28' }}>综合业务管理系统</h1>
          <p className="text-xs tracking-widest mt-2" style={{ color: '#9BB5AF' }}>INTEGRATED BUSINESS MANAGEMENT SYSTEM</p>
        </div>

        {/* 登录卡片 */}
        <div
          className="w-full bg-white"
          style={{
            maxWidth: 400,
            borderRadius: 16,
            border: '1px solid #EAEFED',
            boxShadow: '0 4px 40px rgba(0,0,0,0.07)',
            padding: '36px 36px 32px',
          }}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-800">账号登录</h2>
            <div className="mt-2 h-[3px] w-6 rounded-full" style={{ background: TEAL }} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="new-password">

            {/* 手机号 */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-600">手机号</Label>
              <div className="relative">
                <Smartphone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: TEAL }} />
                <Input
                  {...register('phone', { onChange: () => setLoginError(null) })}
                  type="text"
                  inputMode="numeric"
                  autoComplete="new-password"
                  placeholder="请输入手机号"
                  className="pl-10 h-11 text-sm placeholder:text-slate-300 bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-0 transition-all"
                  onFocus={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,140,106,0.1)` }}
                  onBlur={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = '' }}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
            </div>

            {/* 密码 */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-600">密码</Label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: TEAL }} />
                <Input
                  {...register('password', { onChange: () => setLoginError(null) })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="请输入密码"
                  className="pl-10 pr-11 h-11 text-sm placeholder:text-slate-300 bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-0 transition-all"
                  onFocus={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(0,140,106,0.1)` }}
                  onBlur={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = '' }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
            </div>

            {/* 错误提示 */}
            {loginError && (
              <div className="flex items-start gap-2 rounded-lg px-4 py-3 bg-red-50 border border-red-100">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
                <p className="text-sm text-red-600">{loginError}</p>
              </div>
            )}

            {/* 登录按钮 */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-white font-semibold tracking-[0.1em] border-0 transition-all active:scale-[0.98] mt-1 rounded-lg"
              style={{
                background: isLoading
                  ? '#7BB5A8'
                  : `linear-gradient(135deg, ${TEAL_DARK} 0%, ${TEAL} 55%, ${TEAL_LIGHT} 100%)`,
                boxShadow: isLoading ? 'none' : `0 4px 16px rgba(0,140,106,0.3)`,
                fontSize: 15,
              }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  登录中...
                </span>
              ) : '登　　录'}
            </Button>
          </form>
        </div>
      </div>

      {/* 底部版权 */}
      <p className="text-center text-xs text-slate-300 py-6">
        © 2026 北京皓鼎弘毅电力科技有限公司&nbsp;&nbsp;保留所有权
      </p>
    </div>
  )
}
