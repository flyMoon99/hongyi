'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, AlertTriangle, Calendar, Eye, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { InspectionForm } from '@/components/inspections/inspection-form'
import { formatDate, getDaysUntil, exportToCsv } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/auth-context'
import { canManageEmployees } from '@/types'
import type { Inspection } from '@/types'
import { cn } from '@/lib/utils'

const FREQUENCY_LABEL: Record<string, string> = {
  QUARTERLY: '季度巡检',
  MONTHLY: '月度巡检',
  TWICE_MONTHLY: '每月2次',
  ANNUALLY: '年度巡检',
}

const FREQUENCY_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'outline'> = {
  QUARTERLY: 'success',
  MONTHLY: 'info',
  TWICE_MONTHLY: 'warning',
  ANNUALLY: 'outline',
}

export default function InspectionsPage() {
  const { user } = useAuth()
  const canManage = canManageEmployees(user?.role)

  const [inspections, setInspections] = useState<Inspection[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Inspection | null>(null)
  const [deleting, setDeleting] = useState<Inspection | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Initialize search from URL query param (e.g. navigating from alert bubble)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('search')
    if (q) setSearch(q)
  }, [])

  const fetchInspections = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '50' })
      if (search) params.set('search', search)
      const data = await apiClient.get<{ items: Inspection[]; total: number }>(`/inspections?${params}`)
      setInspections(data.items)
      setTotal(data.total)
    } catch {
      toast.error('获取巡检列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchInspections()
  }, [fetchInspections])

  const handleSave = async (data: any) => {
    setIsSaving(true)
    try {
      if (editing) {
        await apiClient.put(`/inspections/${editing.id}`, data)
        toast.success('巡检记录已更新')
      } else {
        await apiClient.post('/inspections', data)
        toast.success('巡检记录添加成功')
      }
      setFormOpen(false)
      fetchInspections()
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setIsDeleting(true)
    try {
      await apiClient.delete(`/inspections/${deleting.id}`)
      toast.success('巡检记录已删除')
      setDeleting(null)
      fetchInspections()
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : '删除失败')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '500' })
      if (search) params.set('search', search)
      const data = await apiClient.get<{ items: Inspection[]; total: number }>(`/inspections?${params}`)
      const rows = data.items.map((item) => [
        item.customer?.companyName ?? item.customerName ?? '',
        FREQUENCY_LABEL[item.frequency] ?? item.frequency,
        item.powerEquipment,
        item.responsiblePerson?.name ?? '',
        item.contactPerson,
        item.contactInfo,
        formatDate(item.lastInspectionDate),
        formatDate(item.nextInspectionDate),
        item.safetyTools ?? '',
        formatDate(item.createdAt),
      ])
      exportToCsv(`巡检列表_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.csv`,
        ['客户名称', '巡检频率', '电力设备', '负责人', '联系人', '联系方式', '上次巡检', '下次巡检', '其他备注', '创建时间'],
        rows)
      toast.success(`已导出 ${rows.length} 条记录`)
    } catch {
      toast.error('导出失败')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">巡检管理</h1>
          <p className="text-sm text-slate-500 mt-0.5">共 {total} 条巡检计划</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={isExporting} className="gap-1.5">
              <Download size={15} />
              {isExporting ? '导出中...' : '导出'}
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true) }} className="bg-red-600 hover:bg-red-700">
              <Plus size={16} /> 新增巡检
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索客户、设备、负责人..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>客户名称</TableHead>
                  <TableHead>巡检频率</TableHead>
                  <TableHead>电力设备</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>下次巡检</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-12">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : inspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-12">
                      暂无巡检数据
                    </TableCell>
                  </TableRow>
                ) : (
                  inspections.map((item) => {
                    const days = getDaysUntil(item.nextInspectionDate)
                    const isOverdue = days !== null && days < 0
                    const isUrgent = days !== null && days >= 0 && days <= 7
                    const customerName = item.customer?.companyName ?? item.customerName ?? '-'
                    return (
                      <TableRow
                        key={item.id}
                        className={cn(isOverdue && 'bg-red-50', isUrgent && 'bg-orange-50')}
                      >
                        <TableCell>
                          <span className="font-medium text-slate-800 text-sm">{customerName}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={FREQUENCY_VARIANT[item.frequency] ?? 'outline'} className="text-xs">
                            {FREQUENCY_LABEL[item.frequency] ?? item.frequency}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600 text-sm line-clamp-1 max-w-[160px]">{item.powerEquipment}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600 text-sm">{item.responsiblePerson?.name ?? '-'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar size={12} className={isOverdue ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-slate-400'} />
                              <span className={cn(
                                isOverdue ? 'text-red-600 font-medium' : isUrgent ? 'text-orange-600 font-medium' : 'text-slate-500',
                              )}>
                                {formatDate(item.nextInspectionDate) || '-'}
                              </span>
                            </div>
                            {(isOverdue || isUrgent) && (
                              <AlertTriangle size={13} className={isOverdue ? 'text-red-500' : 'text-orange-500'} />
                            )}
                          </div>
                          {isOverdue && <p className="text-xs text-red-500 mt-0.5">已逾期 {Math.abs(days!)} 天</p>}
                          {isUrgent && <p className="text-xs text-orange-500 mt-0.5">还剩 {days} 天</p>}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-slate-700">{item.contactPerson}</p>
                            <p className="text-xs text-slate-400">{item.contactInfo}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild className="h-8 px-2">
                              <Link href={`/inspections/detail?id=${encodeURIComponent(item.id)}`}>
                                <Eye size={14} className="text-slate-500" />
                              </Link>
                            </Button>
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditing(item); setFormOpen(true) }}
                                className="h-8 px-2"
                              >
                                <Pencil size={14} className="text-slate-500" />
                              </Button>
                            )}
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleting(item)}
                                className="h-8 px-2 hover:text-red-600"
                              >
                                <Trash2 size={14} className="text-slate-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InspectionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        inspection={editing}
        isSaving={isSaving}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除 <strong>{deleting?.customer?.companyName ?? deleting?.customerName}</strong> 的巡检记录吗？此操作不可撤销。
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
