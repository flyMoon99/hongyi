'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Users, ClipboardCheck, FlaskConical, AlertTriangle, ArrowRight, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api-client'
import { formatDate, getDaysUntil } from '@/lib/utils'
import type { Inspection, Experiment } from '@/types'

interface DashboardStats {
  customers: number
  employees: number
  inspections: number
  experiments: number
}

function getUrgencyLevel(days: number | null) {
  if (days === null) return null
  if (days < 0) return { label: '已逾期', variant: 'destructive' as const }
  if (days <= 7) return { label: `${days}天后`, variant: 'default' as const }
  if (days <= 30) return { label: `${days}天后`, variant: 'warning' as const }
  return { label: `${days}天后`, variant: 'secondary' as const }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({ customers: 0, employees: 0, inspections: 0, experiments: 0 })
  const [upcomingInspections, setUpcomingInspections] = useState<Inspection[]>([])
  const [upcomingExperiments, setUpcomingExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const [customersRes, employeesRes, inspectionsRes, experimentsRes] = await Promise.allSettled([
        apiClient.get<{ total: number }>('/customers?pageSize=1'),
        apiClient.get<{ total: number }>('/employees?pageSize=1'),
        apiClient.get<{ total: number; items: Inspection[] }>('/inspections?pageSize=200'),
        apiClient.get<{ total: number; items: Experiment[] }>('/experiments?pageSize=200'),
      ])

      const val = <T,>(r: PromiseSettledResult<T>): T | undefined =>
        r.status === 'fulfilled' ? r.value : undefined

      const custData  = val(customersRes)
      const empData   = val(employeesRes)
      const inspData  = val(inspectionsRes)
      const expData   = val(experimentsRes)

      setStats({
        customers:   custData?.total  ?? 0,
        employees:   empData?.total   ?? 0,
        inspections: inspData?.total  ?? 0,
        experiments: expData?.total   ?? 0,
      })

      const sortedInspections = (inspData?.items ?? [])
        .filter((i) => i.nextInspectionDate)
        .sort((a, b) => new Date(a.nextInspectionDate!).getTime() - new Date(b.nextInspectionDate!).getTime())
        .slice(0, 5)
      setUpcomingInspections(sortedInspections)

      const sortedExperiments = (expData?.items ?? [])
        .filter((e) => e.nextTestDate)
        .sort((a, b) => new Date(a.nextTestDate!).getTime() - new Date(b.nextTestDate!).getTime())
        .slice(0, 5)
      setUpcomingExperiments(sortedExperiments)

      setLoading(false)
    }
    fetchAll()
  }, [])

  const canSeeEmployees = user?.role === 'ADMIN' || user?.role === 'DEPT_MANAGER'

  const statCards = [
    { title: '客户总数', value: stats.customers, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50', href: '/customers' },
    ...(canSeeEmployees ? [{ title: '员工人数', value: stats.employees, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', href: '/employees' }] : []),
    { title: '巡检计划', value: stats.inspections, icon: ClipboardCheck, color: 'text-green-600', bg: 'bg-green-50', href: '/inspections' },
    { title: '试验计划', value: stats.experiments, icon: FlaskConical, color: 'text-orange-600', bg: 'bg-orange-50', href: '/experiments' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          你好，{user?.name} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">欢迎使用皓鼎弘毅电力服务管理系统</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-slate-800">
                        {loading ? <span className="inline-block w-8 h-8 bg-slate-100 rounded animate-pulse" /> : stat.value}
                      </p>
                    </div>
                    <div className={`${stat.bg} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
                      <Icon className={stat.color} size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Upcoming tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Upcoming Inspections */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardCheck size={16} className="text-green-600" />
                近期巡检计划
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs text-slate-500">
                <Link href="/inspections" className="flex items-center gap-1">
                  查看全部 <ArrowRight size={12} />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-14 bg-slate-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : upcomingInspections.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">暂无巡检计划</p>
            ) : (
              <div className="space-y-2">
                {upcomingInspections.map((item) => {
                  const days = getDaysUntil(item.nextInspectionDate)
                  const urgency = getUrgencyLevel(days)
                  const customerName = item.customer?.companyName ?? item.customerName ?? '-'
                  return (
                    <Link
                      key={item.id}
                      href={`/inspections/detail?id=${encodeURIComponent(item.id)}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{customerName}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} />
                          {formatDate(item.nextInspectionDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={item.frequency === 'MONTHLY' ? 'info' : 'success'} className="text-xs">
                          {item.frequency === 'MONTHLY' ? '月度' : '季度'}
                        </Badge>
                        {urgency && days !== null && days <= 30 && (
                          <Badge variant={urgency.variant} className="text-xs">
                            {urgency.label}
                          </Badge>
                        )}
                        {days !== null && days <= 7 && (
                          <AlertTriangle size={14} className="text-red-500" />
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Experiments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FlaskConical size={16} className="text-orange-600" />
                近期试验计划
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs text-slate-500">
                <Link href="/experiments" className="flex items-center gap-1">
                  查看全部 <ArrowRight size={12} />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-14 bg-slate-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : upcomingExperiments.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">暂无试验计划</p>
            ) : (
              <div className="space-y-2">
                {upcomingExperiments.map((item) => {
                  const days = getDaysUntil(item.nextTestDate)
                  const urgency = getUrgencyLevel(days)
                  const customerName = item.customer?.companyName ?? item.customerName ?? '-'
                  return (
                    <Link
                      key={item.id}
                      href={`/experiments/detail?id=${encodeURIComponent(item.id)}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{customerName}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} />
                          {formatDate(item.nextTestDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={item.frequency === 'MONTHLY' ? 'info' : 'success'} className="text-xs">
                          {item.frequency === 'MONTHLY' ? '月度' : '季度'}
                        </Badge>
                        {urgency && days !== null && days <= 30 && (
                          <Badge variant={urgency.variant} className="text-xs">
                            {urgency.label}
                          </Badge>
                        )}
                        {days !== null && days <= 7 && (
                          <AlertTriangle size={14} className="text-red-500" />
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
