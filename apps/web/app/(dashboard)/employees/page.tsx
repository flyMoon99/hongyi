'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, ShieldCheck, Users, User, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EmployeeForm } from '@/components/employees/employee-form'
import { useAuth } from '@/contexts/auth-context'
import { canManageEmployees, canManageEmployeeRecord } from '@/types'
import { formatDate } from '@/lib/utils'
import apiClient from '@/lib/api-client'
import Link from 'next/link'
import type { Employee, EmployeeFormValues, EmployeesListResponse } from '@/types'

export default function EmployeesPage() {
  const { user } = useAuth()
  const canManage = canManageEmployees(user?.role)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState<Employee | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.get('/employees', {
        params: { page, pageSize, search: search || undefined },
      }) as EmployeesListResponse
      setEmployees(data.items)
      setTotal(data.total)
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : '加载员工列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const handleSearch = () => {
    setPage(1)
    setSearch(searchInput)
  }

  const handleAdd = () => { setEditing(null); setFormOpen(true) }
  const handleEdit = (emp: Employee) => {
    if (!canManageEmployeeRecord(user?.role, emp.role)) {
      toast.error('当前账号不能修改该员工')
      return
    }
    setEditing(emp)
    setFormOpen(true)
  }

  const handleSave = async (data: EmployeeFormValues) => {
    setIsSaving(true)
    // Strip empty strings so optional fields (email, password) pass backend validation
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    )
    try {
      if (editing) {
        await apiClient.put(`/employees/${editing.id}`, payload)
        toast.success('员工信息已更新')
      } else {
        await apiClient.post('/employees', payload)
        toast.success('员工添加成功')
      }
      setFormOpen(false)
      fetchEmployees()
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : '操作失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await apiClient.delete(`/employees/${deleting.id}`)
      toast.success('员工已删除')
      setDeleting(null)
      fetchEmployees()
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : '删除失败')
    }
  }

  const roleBadge = (role: Employee['role']) => {
    if (role === 'ADMIN') return (
      <Badge className="gap-1 bg-red-600 text-white text-xs">
        <ShieldCheck size={11} /> 管理员
      </Badge>
    )
    if (role === 'DEPT_MANAGER') return (
      <Badge className="gap-1 bg-orange-500 text-white text-xs">
        <Users size={11} /> 部门负责人
      </Badge>
    )
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <User size={11} /> 职员
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">员工管理</h1>
          <p className="text-sm text-slate-500 mt-0.5">共 {total} 名员工</p>
        </div>
        {canManage && (
          <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus size={16} /> 新增员工
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex gap-2 max-w-sm">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索姓名、手机号..."
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSearch} className="shrink-0">搜索</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>员工</TableHead>
                  <TableHead>性别</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-12">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                        加载中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-12">
                      暂无员工数据
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={emp.avatar || ''} />
                            <AvatarFallback className="bg-red-100 text-red-600 text-xs font-semibold">
                              {emp.name.slice(0, 1)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-slate-800">{emp.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600 text-sm">{emp.gender === 'MALE' ? '男' : '女'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600 text-sm font-mono">{emp.phone}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-500 text-sm">{emp.email || '-'}</span>
                      </TableCell>
                      <TableCell>{roleBadge(emp.role)}</TableCell>
                      <TableCell>
                        <span className="text-slate-500 text-sm">{formatDate(emp.createdAt)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild className="h-8 px-2">
                            <Link href={`/employees/detail?id=${encodeURIComponent(emp.id)}`}>
                              <Eye size={14} className="text-slate-500" />
                            </Link>
                          </Button>
                          {canManage && canManageEmployeeRecord(user?.role, emp.role) && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(emp)} className="h-8 px-2">
                                <Pencil size={14} className="text-slate-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleting(emp)}
                                className="h-8 px-2 hover:text-red-600"
                                disabled={emp.id === user?.id}
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
        </CardContent>
      </Card>

      <EmployeeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        employee={editing}
        currentUserRole={user?.role}
        isSaving={isSaving}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除员工 <strong>{deleting?.name}</strong> 吗？删除后该员工将无法登录系统。
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
