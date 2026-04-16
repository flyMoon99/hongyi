'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Clock, CalendarDays, Zap, User, Phone,
  Wrench, Building2, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import apiClient from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { canManageEmployees } from '@/types'
import type { InspectionWithLogs } from '@/types'

const FREQUENCY_LABEL: Record<string, string> = {
  QUARTERLY: '季度巡检',
  MONTHLY: '月度巡检',
  TWICE_MONTHLY: '每月2次',
  ANNUALLY: '年度巡检',
}

export default function InspectionDetail({ id }: { id: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const canManage = canManageEmployees(user?.role)

  const [inspection, setInspection] = useState<InspectionWithLogs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    apiClient
      .get<InspectionWithLogs>(`/inspections/${id}`)
      .then((data) => setInspection(data))
      .catch(() => setError('巡检记录不存在或无权限查看'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await apiClient.delete(`/inspections/${id}`)
      toast.success('巡检记录已删除')
      router.push('/inspections')
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : '删除失败')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="h-5 w-5 rounded-full border-2 border-red-500 border-t-transparent animate-spin mr-2" />
        加载中...
      </div>
    )
  }

  if (error || !inspection) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-slate-500">{error || '巡检记录不存在'}</p>
        <Button variant="outline" asChild>
          <Link href="/inspections">
            <ArrowLeft size={14} className="mr-2" />返回列表
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="text-slate-500">
            <Link href="/inspections">
              <ArrowLeft size={14} className="mr-1" />返回
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {inspection.customer.companyName}
            </h1>
            <p className="text-sm text-slate-400">巡检详情</p>
          </div>
        </div>
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 size={14} className="mr-1" />删除记录
          </Button>
        )}
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 size={15} className="text-red-600" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <Zap size={22} className="text-red-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800">{inspection.customer.companyName}</p>
              <Badge
                variant={
                  inspection.frequency === 'MONTHLY' ? 'info'
                  : inspection.frequency === 'TWICE_MONTHLY' ? 'warning'
                  : inspection.frequency === 'ANNUALLY' ? 'outline'
                  : 'success'
                }
                className="text-xs mt-1"
              >
                {FREQUENCY_LABEL[inspection.frequency] ?? inspection.frequency}
              </Badge>
            </div>
          </div>

          <Separator className="mb-5" />

          {/* 电力设备 - 单独一行 */}
          <div className="mb-5">
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Zap size={11} /> 电力设备
            </p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{inspection.powerEquipment}</p>
          </div>

          {/* 其他备注 - 单独一行 */}
          <div className="mb-5">
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Wrench size={11} /> 其他备注
            </p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{inspection.safetyTools || '-'}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <div>
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <User size={11} /> 负责人
              </p>
              <p className="text-sm text-slate-700">{inspection.responsiblePerson?.name ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Phone size={11} /> 巡检联系人
              </p>
              <p className="text-sm text-slate-700">{inspection.contactPerson}</p>
              <p className="text-xs text-slate-400">{inspection.contactInfo}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <CalendarDays size={11} /> 上次巡检
              </p>
              <p className="text-sm text-slate-700">{formatDate(inspection.lastInspectionDate) || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <CalendarDays size={11} /> 下次巡检
              </p>
              <p className="text-sm text-slate-700">{formatDate(inspection.nextInspectionDate) || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <CalendarDays size={11} /> 创建时间
              </p>
              <p className="text-sm text-slate-700">{formatDate(inspection.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operation Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock size={15} className="text-slate-500" />
            操作日志
            <span className="text-xs font-normal text-slate-400 ml-1">
              共 {inspection.logs.length} 条
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inspection.logs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">暂无操作记录</p>
          ) : (
            <div className="space-y-3">
              {inspection.logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                  <div className="w-2 h-2 rounded-full bg-red-400 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {log.action}
                      </Badge>
                      <span className="text-xs text-slate-400">{formatDate(log.createdAt)}</span>
                      <span className="text-xs text-slate-400">操作人：{log.operator.name}</span>
                    </div>
                    {log.detail && (
                      <p className="text-sm text-slate-600 mt-1">{log.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(o) => !o && setShowDeleteDialog(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除 <strong>{inspection.customer.companyName}</strong> 的巡检记录吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
