'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardCheck,
  FlaskConical,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/',
    icon: LayoutDashboard,
    label: '仪表盘',
  },
  {
    href: '/employees',
    icon: Users,
    label: '员工管理',
  },
  {
    href: '/customers',
    icon: Building2,
    label: '客户管理',
  },
  {
    href: '/inspections',
    icon: ClipboardCheck,
    label: '巡检管理',
  },
  {
    href: '/experiments',
    icon: FlaskConical,
    label: '试验管理',
  },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex h-screen w-60 flex-col bg-[#0f172a] text-slate-300 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <Image src="/logo.png" alt="皓鼎弘毅" width={36} height={36} className="shrink-0" style={{ width: 36, height: 'auto' }} />
        <div>
          <p className="text-white font-bold text-sm leading-tight">皓鼎弘毅</p>
          <p className="text-slate-400 text-xs mt-0.5">管理后台</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
              )}
            >
              <Icon
                className={cn(
                  'w-4.5 h-4.5 shrink-0',
                  active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300',
                )}
                size={18}
              />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} className="opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-slate-600 text-center">皓鼎弘毅电力服务</p>
      </div>
    </aside>
  )
}
