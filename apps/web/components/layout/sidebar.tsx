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
  X,
  DoorOpen,
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import type { CurrentUser } from '@/types'
import { canReadModule } from '@/types'

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  module: string
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/', icon: LayoutDashboard, label: '仪表盘', module: 'dashboard' },
  { href: '/employees', icon: Users, label: '员工管理', module: 'employees' },
  { href: '/customers', icon: Building2, label: '客户管理', module: 'customers' },
  { href: '/inspections', icon: ClipboardCheck, label: '巡检管理', module: 'inspections' },
  { href: '/experiments', icon: FlaskConical, label: '试验管理', module: 'experiments' },
  { href: '/station-rooms', icon: DoorOpen, label: '站室管理', module: 'station-rooms' },
  { href: '/fire-inspections', icon: Flame, label: '消防巡检', module: 'fire-inspections' },
]

function getNavItems(user: CurrentUser | null): NavItem[] {
  if (!user) return []
  return ALL_NAV_ITEMS.filter((item) => {
    if (item.module === 'dashboard') return user.role !== 'ADMIN'
    return canReadModule(user, item.module)
  })
}

function isStateGridTheme(user: CurrentUser | null): boolean {
  return user?.role === 'ADMIN' || user?.company === 'STATE_GRID'
}

const TEAL = '#008C6A'
const TEAL_BG = '#F0FAF6'

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

function NavContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const navItems = getNavItems(user)
  const stateGrid = isStateGridTheme(user)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  if (stateGrid) {
    return (
      <>
        {/* 标题区 */}
        <div className="px-5 py-5 shrink-0" style={{ borderBottom: '1px solid #E8F5EF' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, #006B50, #00A87E)` }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z" fill="white" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: '#1A2E28' }}>综合业务管理后台</p>
            </div>
          </div>
        </div>

        {/* 导航 */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                  active
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-800',
                )}
                style={active ? {
                  background: `linear-gradient(135deg, #006B50, ${TEAL})`,
                  boxShadow: '0 2px 10px rgba(0,140,106,0.25)',
                } : {}}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = TEAL_BG }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '' }}
              >
                <Icon
                  className="shrink-0"
                  size={17}
                  style={{ color: active ? 'white' : '#6B8E85' }}
                />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight size={13} className="opacity-60" />}
              </Link>
            )
          })}
        </nav>
      </>
    )
  }

  // 皓鼎弘毅 theme（深色）
  return (
    <>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10 shrink-0">
        <Image src="/logo.png" alt="皓鼎弘毅" width={36} height={36} className="shrink-0" style={{ width: 36, height: 'auto' }} />
        <div>
          <p className="text-white font-bold text-sm leading-tight">皓鼎弘毅</p>
          <p className="text-slate-400 text-xs mt-0.5">管理后台</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
              )}
            >
              <Icon
                className={cn('shrink-0', active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')}
                size={18}
              />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} className="opacity-60" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 shrink-0">
        <p className="text-xs text-slate-600 text-center">皓鼎弘毅电力服务</p>
      </div>
    </>
  )
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { user } = useAuth()
  const stateGrid = isStateGridTheme(user)

  const desktopClass = stateGrid
    ? 'hidden lg:flex h-screen w-60 flex-col bg-white fixed left-0 top-0 z-40'
    : 'hidden lg:flex h-screen w-60 flex-col bg-[#0f172a] text-slate-300 fixed left-0 top-0 z-40'

  const desktopStyle = stateGrid
    ? { borderRight: '1px solid #E8F5EF' }
    : undefined

  const drawerClass = stateGrid
    ? cn(
        'fixed top-0 left-0 z-50 h-full w-72 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full',
      )
    : cn(
        'fixed top-0 left-0 z-50 h-full w-72 flex flex-col bg-[#0f172a] text-slate-300 shadow-2xl transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full',
      )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={desktopClass} style={desktopStyle}>
        <NavContent />
      </aside>

      {/* Mobile drawer */}
      <div className="lg:hidden">
        <div
          className={cn(
            'fixed inset-0 z-50 bg-black/60 transition-opacity duration-300',
            open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          )}
          onClick={onClose}
          aria-hidden
        />
        <aside className={drawerClass}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
            style={{ color: '#6B8E85' }}
            aria-label="关闭菜单"
          >
            <X size={18} />
          </button>
          <NavContent onLinkClick={onClose} />
        </aside>
      </div>
    </>
  )
}
