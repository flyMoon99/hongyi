'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, User, ShieldCheck, Users, Clock, Mail, Phone, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import apiClient from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import { ROLE_LABELS } from '@/types'
import type { EmployeeWithLogs } from '@/types'

function RoleBadge({ role }: { role: EmployeeWithLogs['role'] }) {
  if (role === 'ADMIN')
    return (
      <Badge className="gap-1 bg-red-600 text-white text-xs">
        <ShieldCheck size={11} /> 管理员
      </Badge>
    )
  if (role === 'DEPT_MANAGER')
    return (
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

export default function EmployeeDetail({ id }: { id: string }) {
  const [employee, setEmployee] = useState<EmployeeWithLogs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient.get(`/employees/${id}`)
      .then((data) => setEmployee(data as EmployeeWithLogs))
      .catch(() => setError('员工不存在或无权限查看'))
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

  if (error || !employee) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-slate-500">{error || '员工不存在'}</p>
        <Button variant="outline" asChild>
          <Link href="/employees">
            <ArrowLeft size={14} className="mr-2" />返回列表
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="text-slate-500">
          <Link href="/employees">
            <ArrowLeft size={14} className="mr-1" />返回
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{employee.name}</h1>
          <p className="text-sm text-slate-400">员工详情</p>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User size={15} className="text-red-600" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5 mb-5">
            <Avatar className="h-16 w-16">
              <AvatarImage src={employee.avatar || ''} />
              <AvatarFallback className="bg-red-100 text-red-600 text-xl font-bold">
                {employee.name.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold text-slate-800">{employee.name}</p>
              <div className="mt-1">
                <RoleBadge role={employee.role} />
              </div>
            </div>
          </div>

          <Separator className="mb-5" />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <div>
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Phone size={11} /> 手机号
              </p>
              <p className="text-sm font-mono text-slate-700">{employee.phone}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">性别</p>
              <p className="text-sm text-slate-700">{employee.gender === 'MALE' ? '男' : '女'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Mail size={11} /> 邮箱
              </p>
              <p className="text-sm text-slate-700">{employee.email || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">角色</p>
              <p className="text-sm text-slate-700">{ROLE_LABELS[employee.role]}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <CalendarDays size={11} /> 创建时间
              </p>
              <p className="text-sm text-slate-700">{formatDate(employee.createdAt)}</p>
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
              共 {employee.employeeLogs.length} 条
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employee.employeeLogs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">暂无操作记录</p>
          ) : (
            <div className="space-y-3">
              {employee.employeeLogs.map((log) => (
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
    </div>
  )
}
