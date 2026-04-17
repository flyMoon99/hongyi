'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2, Eye, Building2, Phone, Calendar, Download } from 'lucide-react'
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
import { formatDate, exportToCsv } from '@/lib/utils'
import apiClient from '@/lib/api-client'
import type { Customer } from '@/types'

interface CustomersListResponse {
  items: Customer[]
  total: number
  page: number
  pageSize: number
}

export default function CustomersPage() {
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'DEPT_MANAGER'

  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [isLoading, setIsLoading] = useState(true)

  const [companyName, setCompanyName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [searchTrigger, setSearchTrigger] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState<Customer | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, string | number | undefined> = {
        page,
        pageSize,
        companyName: companyName || undefined,
        contactPerson: contactPerson || undefined,
        contactInfo: contactInfo || undefined,
      }
      const data = await apiClient.get<CustomersListResponse>('/customers', { params })
      setCustomers(data.items)
      setTotal(data.total)
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : '加载客户列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, companyName, contactPerson, contactInfo, searchTrigger]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const handleSearch = () => {
    setPage(1)
    setSearchTrigger((n) => n + 1)
  }

  const handleReset = () => {
    setCompanyName('')
    setContactPerson('')
    setContactInfo('')
    setPage(1)
    setSearchTrigger((n) => n + 1)
  }

  const handleSave = async (data: any) => {
    setIsSaving(true)
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    )
    try {
      if (editing) {
        await apiClient.put(`/customers/${editing.id}`, payload)
        toast.success('客户信息已更新')
      } else {
        await apiClient.post('/customers', payload)
        toast.success('客户添加成功')
      }
      setFormOpen(false)
      fetchCustomers()
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : '操作失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const params: Record<string, string | number | undefined> = {
        page: 1,
        pageSize: 500,
        companyName: companyName || undefined,
        contactPerson: contactPerson || undefined,
        contactInfo: contactInfo || undefined,
      }
      const data = await apiClient.get<CustomersListResponse>('/customers', { params })
      const rows = data.items.map((c) => [
        c.companyName,
        c.contactPerson,
        c.contactInfo,
        c.projectOverview ?? '',
        formatDate(c.lastPatrolTime) || '',
        formatDate(c.createdAt),
      ])
      exportToCsv(
        `客户列表_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.csv`,
        ['企业名称', '联系人', '联系方式', '项目概况', '最近巡视', '创建时间'],
        rows,
      )
      toast.success(`已导出 ${rows.length} 条记录`)
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : '导出失败')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await apiClient.delete(`/customers/${deleting.id}`)
      toast.success('客户已删除')
      setDeleting(null)
      fetchCustomers()
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : '删除失败')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">客户管理</h1>
          <p className="text-sm text-slate-500 mt-0.5">共 {total} 家客户</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting}
              className="gap-1.5"
            >
              <Download size={15} />
              {isExporting ? '导出中...' : '导出'}
            </Button>
            <Button
              onClick={() => { setEditing(null); setFormOpen(true) }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus size={16} /> 新增客户
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[140px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="企业名称"
                className="pl-8 h-9"
              />
            </div>
            <div className="relative flex-1 min-w-[120px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="联系人"
                className="pl-8 h-9"
              />
            </div>
            <div className="relative flex-1 min-w-[140px]">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="联系方式"
                className="pl-8 h-9"
              />
            </div>
            <Button size="sm" onClick={handleSearch} className="bg-red-600 hover:bg-red-700 h-9">
              搜索
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset} className="h-9">
              重置
            </Button>
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                        加载中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                      暂无客户数据
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((c) => (
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
                            <Link href={`/customers/detail?id=${encodeURIComponent(c.id)}`}>
                              <Eye size={14} className="text-slate-500" />
                            </Link>
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditing(c); setFormOpen(true) }}
                                className="h-8 px-2"
                              >
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
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {total > pageSize && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-slate-500">共 {total} 条</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  上一页
                </Button>
                <span className="text-sm text-slate-500 self-center">第 {page} 页</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * pageSize >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        customer={editing}
        isSaving={isSaving}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除客户 <strong>{deleting?.companyName}</strong> 吗？
              相关巡检和试验记录也将一并删除，删除后不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
