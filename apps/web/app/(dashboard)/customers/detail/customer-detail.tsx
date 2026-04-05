'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Phone, Calendar, ClipboardCheck, FlaskConical, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import apiClient from '@/lib/api-client'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { CustomerWithDetails } from '@/types'

export default function CustomerDetail({ id }: { id: string }) {
  const [customer, setCustomer] = useState<CustomerWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .get<CustomerWithDetails>(`/customers/${id}`)
      .then((data) => setCustomer(data))
      .catch(() => setError('客户不存在或无权限查看'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="h-5 w-5 rounded-full border-2 border-red-500 border-t-transparent animate-spin mr-2" />
        加载中...
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-slate-500">{error || '客户不存在'}</p>
        <Button variant="outline" asChild>
          <Link href="/customers">
            <ArrowLeft size={14} className="mr-2" />返回列表
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Back + Title */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="text-slate-500">
          <Link href="/customers">
            <ArrowLeft size={14} className="mr-1" />返回
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{customer.companyName}</h1>
          <p className="text-sm text-slate-400">客户详情</p>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 size={15} className="text-blue-600" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <div>
              <p className="text-xs text-slate-400 mb-1">企业名称</p>
              <p className="text-sm font-medium text-slate-800">{customer.companyName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">联系人</p>
              <p className="text-sm text-slate-700">{customer.contactPerson}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">联系方式</p>
              <div className="flex items-center gap-1.5">
                <Phone size={12} className="text-slate-400" />
                <p className="text-sm text-slate-700">{customer.contactInfo}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">最近巡视时间</p>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-400" />
                <p className="text-sm text-slate-700">{formatDate(customer.lastPatrolTime) || '暂无'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">创建时间</p>
              <p className="text-sm text-slate-700">{formatDate(customer.createdAt)}</p>
            </div>
          </div>
          {customer.projectOverview && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-xs text-slate-400 mb-1.5">工程概况</p>
                <p className="text-sm text-slate-700 leading-relaxed">{customer.projectOverview}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Inspections */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck size={15} className="text-green-600" />
                最近巡检记录
                <span className="text-xs font-normal text-slate-400">（{customer.inspections.length} 条）</span>
              </CardTitle>
              {customer.inspections.length > 0 && (
                <Button variant="ghost" size="sm" asChild className="text-xs text-slate-500">
                  <Link href="/inspections" className="flex items-center gap-1">
                    查看更多 <ArrowRight size={12} />
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {customer.inspections.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">暂无巡检记录</p>
            ) : (
              <div className="space-y-2">
                {customer.inspections.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{item.powerEquipment}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={11} /> 上次：{formatDate(item.lastInspectionDate) || '暂无'}
                        </span>
                        <span className="text-xs text-slate-400">
                          下次：{formatDate(item.nextInspectionDate) || '暂无'}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={item.frequency === 'MONTHLY' ? 'default' : 'secondary'}
                      className="text-xs shrink-0 ml-2"
                    >
                      {item.frequency === 'MONTHLY' ? '月度' : '季度'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experiments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical size={15} className="text-orange-600" />
                最近试验记录
                <span className="text-xs font-normal text-slate-400">（{customer.experiments.length} 条）</span>
              </CardTitle>
              {customer.experiments.length > 0 && (
                <Button variant="ghost" size="sm" asChild className="text-xs text-slate-500">
                  <Link href="/experiments" className="flex items-center gap-1">
                    查看更多 <ArrowRight size={12} />
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {customer.experiments.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">暂无试验记录</p>
            ) : (
              <div className="space-y-2">
                {customer.experiments.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{item.powerEquipment}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar size={11} /> 上次：{formatDate(item.lastTestDate) || '暂无'}
                        </span>
                        <span className="text-xs text-slate-400">
                          下次：{formatDate(item.nextTestDate) || '暂无'}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={item.frequency === 'MONTHLY' ? 'default' : 'secondary'}
                      className="text-xs shrink-0 ml-2"
                    >
                      {item.frequency === 'MONTHLY' ? '月度' : '季度'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operation Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock size={15} className="text-slate-500" />
            操作日志
            <span className="text-xs font-normal text-slate-400 ml-1">共 {customer.logs.length} 条</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {customer.logs.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">暂无操作记录</p>
          ) : (
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
              <div className="space-y-4 pl-8">
                {customer.logs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-red-600 border-2 border-white shadow-sm" />
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{log.action}</p>
                        {log.detail && <p className="text-xs text-slate-400 mt-0.5">{log.detail}</p>}
                        <p className="text-xs text-slate-400 mt-1">
                          操作人：{log.operator?.name || log.operatorId}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0 ml-4">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
