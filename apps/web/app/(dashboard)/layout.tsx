'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { AlertBubble } from '@/components/layout/alert-bubble'
import { useAuth } from '@/contexts/auth-context'
import { canReadModule } from '@/types'

/** 从路径推断模块名，与 MODULE_POLICY 键对应 */
function getModuleFromPath(pathname: string): string | null {
  if (pathname === '/') return 'dashboard'
  if (pathname.startsWith('/employees')) return 'employees'
  if (pathname.startsWith('/customers')) return 'customers'
  if (pathname.startsWith('/inspections')) return 'inspections'
  if (pathname.startsWith('/experiments')) return 'experiments'
  if (pathname.startsWith('/station-rooms')) return 'station-rooms'
  if (pathname.startsWith('/fire-inspections')) return 'fire-inspections'
  return null
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    document.title = '综合业务管理系统'
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    // ADMIN 直接跳到员工管理
    if (user.role === 'ADMIN' && pathname === '/') {
      router.replace('/employees')
      return
    }
    // 路由权限守卫
    const mod = getModuleFromPath(pathname)
    if (mod && mod !== 'dashboard') {
      if (!canReadModule(user, mod)) {
        // 跳到第一个有权限的页面
        if (user.role === 'ADMIN') {
          router.replace('/employees')
        } else if (user.company === 'STATE_GRID') {
          router.replace('/station-rooms')
        } else {
          router.replace('/')
        }
      }
    }
  }, [isLoading, user, pathname, router])

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 rounded-full border-4 border-[#008C6A] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden lg:ml-60">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
      <AlertBubble />
    </div>
  )
}
