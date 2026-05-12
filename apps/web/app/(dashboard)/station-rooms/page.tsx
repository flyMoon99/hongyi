'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'
import { getPrimaryBtnClass } from '@/lib/theme'
import { formatDate } from '@/lib/utils'
import apiClient from '@/lib/api-client'
import type { StationRoom } from '@/types'
import { canWriteModule } from '@/types'

interface ListResponse { items: StationRoom[]; total: number; page: number; pageSize: number }

interface FormState { name: string; remark: string; contactPerson: string; contactInfo: string }

const emptyForm: FormState = { name: '', remark: '', contactPerson: '', contactInfo: '' }

export default function StationRoomsPage() {
  const { user } = useAuth()
  const canManage = canWriteModule(user, 'station-rooms')
  const primaryBtn = getPrimaryBtnClass(user?.role, user?.company)

  const [items, setItems] = useState<StationRoom[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StationRoom | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [deleting, setDeleting] = useState<StationRoom | null>(null)

  const [detailItem, setDetailItem] = useState<StationRoom | null>(null)

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.get<ListResponse>('/station-rooms', {
        params: { page, pageSize, search: search || undefined },
      })
      setItems(data.items)
      setTotal(data.total)
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : '加载站室列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSearch = () => { setPage(1); setSearch(searchInput) }

  const openAdd = () => { setEditing(null); setForm(emptyForm); setFormOpen(true) }
  const openEdit = (item: StationRoom) => {
    setEditing(item)
    setForm({ name: item.name, remark: item.remark ?? '', contactPerson: item.contactPerson, contactInfo: item.contactInfo })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.contactPerson || !form.contactInfo) {
      toast.error('请填写必填字段')
      return
    }
    setIsSaving(true)
    try {
      if (editing) {
        await apiClient.put(`/station-rooms/${editing.id}`, form)
        toast.success('站室信息已更新')
      } else {
        await apiClient.post('/station-rooms', form)
        toast.success('站室添加成功')
      }
      setFormOpen(false)
      fetchItems()
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : '操作失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await apiClient.delete(`/station-rooms/${deleting.id}`)
      toast.success('站室已删除')
      setDeleting(null)
      fetchItems()
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : '删除失败')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">站室管理</h1>
          <p className="text-sm text-slate-500 mt-0.5">共 {total} 个站室</p>
        </div>
        {canManage && (
          <Button onClick={openAdd} className={primaryBtn}>
            <Plus size={16} /> 新增站室
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
                placeholder="搜索站室名称、负责人..."
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
                  <TableHead>站室名称</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>备注</TableHead>
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
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-12">暂无站室数据</TableCell>
                  </TableRow>
                ) : items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-slate-800">{item.name}</TableCell>
                    <TableCell className="text-slate-600">{item.contactPerson}</TableCell>
                    <TableCell className="text-slate-600 font-mono text-sm">{item.contactInfo}</TableCell>
                    <TableCell className="text-slate-500 text-sm max-w-xs truncate">{item.remark || '-'}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{formatDate(item.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setDetailItem(item)} className="h-8 px-2">
                          <Eye size={14} className="text-slate-500" />
                        </Button>
                        {canManage && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-8 px-2">
                              <Pencil size={14} className="text-slate-500" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleting(item)} className="h-8 px-2 hover:text-red-600">
                              <Trash2 size={14} className="text-slate-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
          <span className="text-sm text-slate-500 flex items-center px-2">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑站室' : '新增站室'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>站室名称 <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="请输入站室名称" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>负责人 <span className="text-red-500">*</span></Label>
                <Input value={form.contactPerson} onChange={(e) => setForm(f => ({ ...f, contactPerson: e.target.value }))} placeholder="请输入负责人姓名" />
              </div>
              <div className="space-y-1.5">
                <Label>联系方式 <span className="text-red-500">*</span></Label>
                <Input value={form.contactInfo} onChange={(e) => setForm(f => ({ ...f, contactInfo: e.target.value }))} placeholder="请输入联系方式" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>站室备注</Label>
              <Textarea value={form.remark} onChange={(e) => setForm(f => ({ ...f, remark: e.target.value }))} placeholder="备注信息（选填）" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={isSaving} className={primaryBtn}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(o) => !o && setDetailItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>站室详情</DialogTitle></DialogHeader>
          {detailItem && (
            <div className="space-y-3 py-2">
              <div><p className="text-xs text-slate-500">站室名称</p><p className="font-medium">{detailItem.name}</p></div>
              <div><p className="text-xs text-slate-500">负责人</p><p>{detailItem.contactPerson}</p></div>
              <div><p className="text-xs text-slate-500">联系方式</p><p className="font-mono">{detailItem.contactInfo}</p></div>
              <div><p className="text-xs text-slate-500">站室备注</p><p className="text-slate-600">{detailItem.remark || '-'}</p></div>
              <div><p className="text-xs text-slate-500">创建时间</p><p className="text-slate-600">{formatDate(detailItem.createdAt)}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除站室 <strong>{deleting?.name}</strong> 吗？</AlertDialogDescription>
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
