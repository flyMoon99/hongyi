'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Bell, ClipboardCheck, FlaskConical, X } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api-client'
import { getDaysUntil } from '@/lib/utils'
import type { Inspection, Experiment } from '@/types'

const URGENT_DAYS = 7

export function AlertBubble() {
  const { user } = useAuth()
  const router = useRouter()

  const [inspCount, setInspCount] = useState(0)
  const [expCount, setExpCount] = useState(0)
  const [minimized, setMinimized] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const urgentCount = inspCount + expCount

  const fetchUrgent = useCallback(async () => {
    if (!user) return
    try {
      const [inspRes, expRes] = await Promise.all([
        apiClient.get<{ items: Inspection[] }>(`/inspections?pageSize=200&search=${encodeURIComponent(user.name)}`),
        apiClient.get<{ items: Experiment[] }>(`/experiments?pageSize=200&search=${encodeURIComponent(user.name)}`),
      ])

      // API already filters by responsible person name via search param,
      // so just check the date here
      const urgentInsp = (inspRes.items ?? []).filter((i) => {
        const days = getDaysUntil(i.nextInspectionDate)
        return days !== null && days >= 0 && days <= URGENT_DAYS
      })

      const urgentExp = (expRes.items ?? []).filter((e) => {
        const days = getDaysUntil(e.nextTestDate)
        return days !== null && days >= 0 && days <= URGENT_DAYS
      })

      setInspCount(urgentInsp.length)
      setExpCount(urgentExp.length)
    } catch {
      // silently ignore – bubble is non-critical
    }
  }, [user])

  // Initial fetch + auto-refresh every 5 minutes
  useEffect(() => {
    fetchUrgent()
    const timer = setInterval(fetchUrgent, 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [fetchUrgent])

  // Close popup when clicking outside the bubble
  useEffect(() => {
    if (!popupOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopupOpen(false)
      }
    }
    // Use timeout so the click that opened the popup doesn't immediately close it
    const tid = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => {
      clearTimeout(tid)
      document.removeEventListener('mousedown', handler)
    }
  }, [popupOpen])

  if (!user || urgentCount === 0) return null

  // ── Minimized: side-tab on the right edge ────────────────────────────────
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        title="展开提醒"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50
                   flex flex-col items-center justify-center gap-1
                   w-9 py-4 rounded-l-2xl
                   bg-slate-700 text-white shadow-xl
                   hover:bg-slate-600 active:scale-95 transition-all"
      >
        <Bell size={16} />
        <span className="text-[11px] font-bold leading-none text-red-300">
          {urgentCount > 99 ? '99+' : urgentCount}
        </span>
      </button>
    )
  }

  // ── Full bubble ──────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="fixed bottom-8 right-8 z-50">

      {/* Ripple ring 1 – slow & soft */}
      <span
        className="absolute inset-0 rounded-full bg-red-400 animate-ping pointer-events-none"
        style={{ animationDuration: '2.5s', animationDelay: '0ms', opacity: 0.35 }}
      />
      {/* Ripple ring 2 – staggered offset */}
      <span
        className="absolute inset-0 rounded-full bg-red-300 animate-ping pointer-events-none"
        style={{ animationDuration: '2.5s', animationDelay: '1.2s', opacity: 0.22 }}
      />

      {/* Minimize button (top-right × ) */}
      <button
        onClick={() => { setMinimized(true); setPopupOpen(false) }}
        title="最小化"
        className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full
                   bg-slate-500 text-white flex items-center justify-center
                   hover:bg-slate-700 transition-colors shadow"
      >
        <X size={10} />
      </button>

      {/* Main circle – always opens popup */}
      <button
        onClick={() => setPopupOpen((v) => !v)}
        className="relative z-10 flex flex-col items-center justify-center
                   w-16 h-16 rounded-full bg-red-600 text-white shadow-xl
                   hover:bg-red-700 active:scale-95 transition-transform"
      >
        <AlertTriangle size={18} />
        <span className="text-xs font-bold leading-none mt-0.5">{urgentCount} 条</span>
      </button>

      {/* Popup menu above the bubble */}
      {popupOpen && (
        <div className="absolute bottom-[4.5rem] right-0 bg-white rounded-2xl shadow-2xl
                        border border-slate-100 py-2 w-52 overflow-hidden">
          <p className="text-[11px] text-slate-400 font-medium px-3 py-1.5 border-b border-slate-100">
            7 天内待处理
          </p>

          {inspCount > 0 && (
            <button
              onClick={() => {
                setPopupOpen(false)
                router.push(`/inspections?search=${encodeURIComponent(user!.name)}`)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5
                         hover:bg-slate-50 transition-colors text-left"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-green-50">
                <ClipboardCheck size={14} className="text-green-600" />
              </span>
              <span className="text-sm text-slate-700">巡检计划</span>
              <span className="ml-auto text-xs font-bold text-red-500 bg-red-50
                               px-1.5 py-0.5 rounded-full">
                {inspCount} 条
              </span>
            </button>
          )}

          {expCount > 0 && (
            <button
              onClick={() => {
                setPopupOpen(false)
                router.push(`/experiments?search=${encodeURIComponent(user!.name)}`)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5
                         hover:bg-slate-50 transition-colors text-left"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-50">
                <FlaskConical size={14} className="text-orange-500" />
              </span>
              <span className="text-sm text-slate-700">试验计划</span>
              <span className="ml-auto text-xs font-bold text-red-500 bg-red-50
                               px-1.5 py-0.5 rounded-full">
                {expCount} 条
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
