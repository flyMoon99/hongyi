'use client'

import { useState } from 'react'
import { Plus, Search, Pencil, Trash2, ShieldCheck, User } from 'lucide-react'
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
import { mockEmployees } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import type { Employee } from '@/types'

export default function EmployeesPage() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState<Employee | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const filtered = employees.filter(
    (e) => e.name.includes(search) || e.phone.includes(search) || (e.email || '').includes(search),
  )

  const handleAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleEdit = (emp: Employee) => {
    setEditing(emp)
    setFormOpen(true)
  }

  const handleSave = async (data: any) => {
    setIsSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    if (editing) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === editing.id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e)),
      )
      toast.success('员工信息已更新')
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setEmployees((prev) => [newEmp, ...prev])
      toast.success('员工添加成功')
    }
    setIsSaving(false)
    setFormOpen(false)
  }

  const handleDelete = async () => {
    if (!deleting) return
    setEmployees((prev) => prev.filter((e) => e.id !== deleting.id))
    toast.success('员工已删除')
    setDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">员工管理</h1>
          <p className="text-sm text-slate-500 mt-0.5">共 {employees.length} 名员工</p>
        </div>
        {user?.isAdmin && (
          <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-700">
            <Plus size={16} /> 新增员工
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索姓名、手机号..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-400 py-12">
                    暂无员工数据
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((emp) => (
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
                    <TableCell>
                      {emp.isAdmin ? (
                        <Badge variant="default" className="gap-1 bg-red-600">
                          <ShieldCheck size={11} /> 管理员
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <User size={11} /> 普通用户
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-500 text-sm">{formatDate(emp.createdAt)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {user?.isAdmin ? (
                        <div className="flex items-center justify-end gap-2">
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
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(emp)} className="h-8 px-2 text-slate-500">
                          查看
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EmployeeForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        employee={editing}
        isSaving={isSaving}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除员工 <strong>{deleting?.name}</strong> 吗？此操作不可撤销。
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
