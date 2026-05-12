'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Eye, EyeOff, Lock, Smartphone, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StateGridLogo } from '@/components/brand/state-grid-logo'
import { useAuth } from '@/contexts/auth-context'
import apiClient from '@/lib/api-client'
import type { CurrentUser } from '@/types'

const loginSchema = z.object({
  phone: z.string().min(1, '请输入手机号'),
  password: z.string().min(1, '请输入密码'),
})
type LoginForm = z.infer<typeof loginSchema>


/** 左侧装饰性波浪 SVG */
function WaveDecoration() {
  return (
    <svg
      className="absolute bottom-0 left-0 right-0 w-full"
      viewBox="0 0 800 180"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ height: 160 }}
    >
      <path
        d="M0,60 C100,120 200,0 300,80 C400,160 500,20 600,90 C700,160 750,60 800,80 L800,180 L0,180 Z"
        fill="rgba(255,255,255,0.06)"
      />
      <path
        d="M0,100 C150,40 250,140 400,100 C550,60 650,140 800,100 L800,180 L0,180 Z"
        fill="rgba(255,255,255,0.04)"
      />
    </svg>
  )
}

/** 左侧浮动数据卡片 */
function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'rgba(255,255,255,0.2)' }}
      >
        {icon}
      </div>
      <div>
        <div className="text-white font-bold text-lg leading-tight">{value}</div>
        <div className="text-white/60 text-xs leading-tight mt-0.5">{label}</div>
      </div>
    </div>
  )
}

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

  // 国家电网青绿主色（与95598.cn导航栏同色系）
  const TEAL = '#008C6A'
  const TEAL_DARK = '#006B50'
  const TEAL_LIGHT = '#00A87E'

  return (
    <div className="min-h-screen flex" style={{ background: '#F4F9F7' }}>

      {/* ══════════════════════════════════════
          左侧视觉区  55%
      ══════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:flex-col relative overflow-hidden"
        style={{
          width: '55%',
          background: `linear-gradient(145deg, ${TEAL_DARK} 0%, ${TEAL} 45%, ${TEAL_LIGHT} 100%)`,
        }}
      >
        {/* 网格纹理 */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0 L0 0 0 48" fill="none" stroke="white" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>

        {/* 大圆装饰 */}
        <div
          className="absolute pointer-events-none"
          style={{
            right: -120, top: -80,
            width: 420, height: 420,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            left: -60, bottom: -60,
            width: 320, height: 320,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
          }}
        />

        <WaveDecoration />

        {/* 内容 */}
        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <StateGridLogo dark={false} />

          {/* 主标语 */}
          <div className="flex-1 flex flex-col justify-center max-w-sm">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 self-start"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <Zap size={12} className="text-white" />
              <span className="text-white/90 text-xs tracking-widest">综合业务管理系统</span>
            </div>

            <h1 className="text-white font-bold leading-tight mb-4" style={{ fontSize: 36 }}>
              安全·绿色·高效<br />
              <span style={{ fontSize: 26, fontWeight: 400, opacity: 0.8 }}>智慧电网管理平台</span>
            </h1>

            <p className="text-white/60 text-sm leading-relaxed mb-10">
              覆盖站室管理、消防巡检、员工档案等<br />核心业务模块，让管理更简单高效。
            </p>

          </div>

          {/* 底部 */}
          <p className="text-white/25 text-xs tracking-wider relative z-10">
            © 2026 国家电网有限公司  保留所有权利
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════
          右侧登录区  45%
      ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-white">

        {/* 移动端顶部 Logo */}
        <div className="lg:hidden mb-10">
          <StateGridLogo dark={true} />
        </div>

        <div className="w-full" style={{ maxWidth: 380 }}>
          {/* 标题 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#1A2E28' }}>欢迎登录</h2>
            <p className="text-sm" style={{ color: '#7A9590' }}>请输入您的账号信息以继续访问</p>
            <div className="mt-3 h-[3px] w-8 rounded-full" style={{ background: TEAL }} />
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="new-password">
            {/* 手机号 */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium" style={{ color: '#3D5A54' }}>手机号</Label>
              <div className="relative">
                <Smartphone
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: TEAL }}
                />
                <Input
                  {...register('phone', { onChange: () => setLoginError(null) })}
                  type="text"
                  inputMode="numeric"
                  autoComplete="new-password"
                  placeholder="请输入手机号"
                  className="pl-10 h-12 placeholder:text-slate-300 transition-all"
                  style={{
                    border: `1.5px solid #E2EDE9`,
                    borderRadius: 10,
                    background: '#FAFCFB',
                    color: '#1A2E28',
                    fontSize: 14,
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = TEAL)}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E2EDE9')}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
            </div>

            {/* 密码 */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium" style={{ color: '#3D5A54' }}>密码</Label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: TEAL }}
                />
                <Input
                  {...register('password', { onChange: () => setLoginError(null) })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="请输入密码"
                  className="pl-10 pr-11 h-12 placeholder:text-slate-300 transition-all"
                  style={{
                    border: `1.5px solid #E2EDE9`,
                    borderRadius: 10,
                    background: '#FAFCFB',
                    color: '#1A2E28',
                    fontSize: 14,
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = TEAL)}
                  onBlur={e => (e.currentTarget.style.borderColor = '#E2EDE9')}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#9BB5AF' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
            </div>

            {/* 错误提示 */}
            {loginError && (
              <div
                className="flex items-start gap-2 rounded-xl px-4 py-3"
                style={{ background: '#FFF5F5', border: '1px solid #FED7D7' }}
              >
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
                <p className="text-sm text-red-600">{loginError}</p>
              </div>
            )}

            {/* 登录按钮 */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-white font-semibold tracking-[0.15em] border-0 transition-all active:scale-[0.98] mt-1"
              style={{
                background: isLoading
                  ? '#7BB5A8'
                  : `linear-gradient(135deg, ${TEAL_DARK} 0%, ${TEAL} 50%, ${TEAL_LIGHT} 100%)`,
                borderRadius: 10,
                fontSize: 15,
                boxShadow: isLoading ? 'none' : `0 6px 20px rgba(0,140,106,0.35)`,
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

          {/* 测试账号 */}
          <div
            className="mt-6 rounded-xl px-4 py-3.5"
            style={{ background: '#F0FAF6', border: `1px solid #C8EAE0` }}
          >
            <p
              className="text-[11px] font-semibold tracking-widest uppercase mb-2"
              style={{ color: TEAL }}
            >
              测试账号
            </p>
            <p className="text-[12px]" style={{ color: '#4A7A6E' }}>
              手机号：<span className="font-mono select-all" style={{ color: '#1A2E28' }}>13800138001</span>
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: '#4A7A6E' }}>
              密　码：<span className="font-mono select-all" style={{ color: '#1A2E28' }}>Admin@123456</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
