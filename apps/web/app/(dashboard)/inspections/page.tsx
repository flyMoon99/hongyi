'use client'

import { useState } from 'react'
import { Plus, Search, Pencil, Trash2, AlertTriangle, Calendar } from 'lucide-react'
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
import { mockInspections, mockCustomers } from '@/lib/mock-data'
import { formatDate, getDaysUntil } from '@/lib/utils'
import type { Inspection } from '@/types'
import { cn } from '@/lib/utils'

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>(mockInspections)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Inspection | null>(null)
  const [deleting, setDeleting] = useState<Inspection | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const filtered = inspections.filter(
    (i) =>
      (i.customerName || '').includes(search) ||
      i.powerEquipment.includes(search) ||
      i.contactPerson.includes(search),
  )

  const handleSave = async (data: any) => {
    setIsSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    const customer = mockCustomers.find((c) => c.id === data.customerId)
    if (editing) {
      setInspections((prev) =>
        prev.map((i) =>
          i.id === editing.id
            ? { ...i, ...data, customerName: customer?.companyName, updatedAt: new Date().toISOString() }
            : i,
        ),
      )
      toast.success('巡检记录已更新')
    } else {
      const newItem: Inspection = {
        id: `insp-${Date.now()}`,
        ...data,
        customerName: customer?.companyName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setInspections((prev) => [newItem, ...prev])
      toast.success('巡检记录添加成功')
    }
    setIsSaving(false)
    setFormOpen(false)
  }

  const handleDelete = async () => {
    if (!deleting) return
    setInspections((prev) => prev.filter((i) => i.id !== deleting.id))
    toast.success('巡检记录已删除')
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">巡检管理</h1>
          <p className="text-sm text-slate-500 mt-0.5">共 {inspections.length} 条巡检计划</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true) }} className="bg-red-600 hover:bg-red-700">
          <Plus size={16} /> 新增巡检
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索客户、设备..." className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>客户名称</TableHead>
                <TableHead>巡检频率</TableHead>
                <TableHead>电力设备</TableHead>
                <TableHead>上次巡检</TableHead>
                <TableHead>下次巡检</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-400 py-12">暂无巡检数据</TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
                  const days = getDaysUntil(item.nextInspectionDate)
                  const isOverdue = days !== null && days < 0
                  const isUrgent = days !== null && days >= 0 && days <= 7
                  return (
                    <TableRow
                      key={item.id}
                      className={cn(isOverdue && 'bg-red-50', isUrgent && 'bg-orange-50')}
                    >
                      <TableCell>
                        <span className="font-medium text-slate-800 text-sm">{item.customerName}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.frequency === 'MONTHLY' ? 'info' : 'success'} className="text-xs">
                          {item.frequency === 'MONTHLY' ? '月度巡检' : '季度巡检'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600 text-sm line-clamp-1 max-w-[160px]">{item.powerEquipment}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-500 text-sm">
                          <Calendar size={12} className="text-slate-400" />
                          {formatDate(item.lastInspectionDate) || '-'}
                        </div>
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
                          <Button variant="ghost" size="sm" onClick={() => { setEditing(item); setFormOpen(true) }} className="h-8 px-2">
                            <Pencil size={14} className="text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleting(item)} className="h-8 px-2 hover:text-red-600">
                            <Trash2 size={14} className="text-slate-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InspectionForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} inspection={editing} isSaving={isSaving} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除 <strong>{deleting?.customerName}</strong> 的巡检记录吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
