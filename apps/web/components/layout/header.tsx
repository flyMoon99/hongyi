'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, LogOut, Settings, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'

const breadcrumbMap: Record<string, string> = {
  '/': '仪表盘',
  '/employees': '员工管理',
  '/customers': '客户管理',
  '/inspections': '巡检管理',
  '/experiments': '试验管理',
  '/profile': '个人信息',
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return [{ label: '仪表盘', href: '/' }]

  const crumbs = [{ label: '首页', href: '/' }]
  let current = ''
  for (const seg of segments) {
    current += `/${seg}`
    const label = breadcrumbMap[current] || seg
    crumbs.push({ label, href: current })
  }
  return crumbs
}

export function Header() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)
  const [userMenuMounted, setUserMenuMounted] = React.useState(false)
  React.useEffect(() => setUserMenuMounted(true), [])

  const userTriggerInner = (
    <>
      <Avatar className="h-8 w-8">
        <AvatarImage src={user?.avatar || ''} />
        <AvatarFallback className="bg-red-100 text-red-600 text-xs font-semibold">
          {user?.name?.slice(0, 1) || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="text-left hidden sm:block">
        <p className="text-sm font-medium text-slate-800 leading-tight">{user?.name || '用户'}</p>
        <p className="text-xs text-slate-500 leading-tight">{user?.isAdmin ? '管理员' : '普通用户'}</p>
      </div>
    </>
  )

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} className="text-slate-400" />}
            {i === breadcrumbs.length - 1 ? (
              <span className="text-slate-800 font-medium">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-slate-500 hover:text-slate-700 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* User Menu: Radix useId can mismatch SSR vs first client paint; mount after hydration */}
      {userMenuMounted ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors"
            >
              {userTriggerInner}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.phone}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>个人信息</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          {userTriggerInner}
        </div>
      )}
    </header>
  )
}
