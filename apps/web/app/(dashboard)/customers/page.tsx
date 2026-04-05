'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Eye, Building2, Phone, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CustomerForm } from '@/components/customers/customer-form'
import { useAuth } from '@/contexts/auth-context'
import { mockCustomers } from '@/lib/mock-data'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { Customer } from '@/types'

export default function CustomersPage() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState<Customer | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const filtered = customers.filter(
    (c) => c.companyName.includes(search) || c.contactPerson.includes(search) || c.contactInfo.includes(search),
  )

  const handleSave = async (data: any) => {
    setIsSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    if (editing) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editing.id
            ? { ...c, ...data, lastPatrolTime: data.lastPatrolTime || null, updatedAt: new Date().toISOString() }
            : c,
        ),
      )
      toast.success('客户信息已更新')
    } else {
      const newCustomer: Customer = {
        id: `cust-${Date.now()}`,
        ...data,
        lastPatrolTime: data.lastPatrolTime || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setCustomers((prev) => [newCustomer, ...prev])
      toast.success('客户添加成功')
    }
    setIsSaving(false)
    setFormOpen(false)
  }

  const handleDelete = async () => {
    if (!deleting) return
    setCustomers((prev) => prev.filter((c) => c.id !== deleting.id))
    toast.success('客户已删除')
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">客户管理</h1>
          <p className="text-sm text-slate-500 mt-0.5">共 {customers.length} 家客户</p>
        </div>
        <Button
          onClick={() => { setEditing(null); setFormOpen(true) }}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus size={16} /> 新增客户
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索企业名称、联系人..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>企业名称</TableHead>
                <TableHead>联系人</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead>最近巡视</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                    暂无客户数据
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Building2 size={14} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{c.companyName}</p>
                          {c.projectOverview && (
                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{c.projectOverview}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-600 text-sm">{c.contactPerson}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-600 text-sm">
                        <Phone size={12} className="text-slate-400" />
                        {c.contactInfo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-slate-500 text-sm">
                        <Calendar size={12} className="text-slate-400" />
                        {formatDate(c.lastPatrolTime) || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-500 text-sm">{formatDate(c.createdAt)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
                          <Link href={`/customers/${c.id}`}>
                            <Eye size={14} className="text-slate-500" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(c); setFormOpen(true) }} className="h-8 px-2">
                          <Pencil size={14} className="text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleting(c)}
                          className="h-8 px-2 hover:text-red-600"
                        >
                          <Trash2 size={14} className="text-slate-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <CustomerForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} customer={editing} isSaving={isSaving} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除客户 <strong>{deleting?.companyName}</strong> 吗？相关巡检和试验记录也将一并删除，此操作不可撤销。
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
