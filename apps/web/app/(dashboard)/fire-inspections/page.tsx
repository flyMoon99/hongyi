'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Eye, ChevronsUpDown, Check } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Textarea } from '@/components/ui/textarea'
import { DateInput } from '@/components/ui/date-input'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { getPrimaryBtnClass } from '@/lib/theme'
import { formatDate } from '@/lib/utils'
import apiClient from '@/lib/api-client'
import type {
  FireInspection, FireEquipment, FireInspectionFrequency, StationRoom, Employee,
} from '@/types'
import {
  canWriteModule, FIRE_INSPECTION_FREQUENCY_LABELS, FIRE_EQUIPMENT_LABELS, ROLE_LABELS,
} from '@/types'

interface ListResponse { items: FireInspection[]; total: number; page: number; pageSize: number }
interface StationListResponse { items: StationRoom[]; total: number }

interface FormState {
  stationRoomId: string
  frequency: FireInspectionFrequency
  responsiblePerson: string
  equipment: FireEquipment[]
  gasLastInspectionDate: string
  gasNextInspectionDate: string
  extLastInspectionDate: string
  extNextInspectionDate: string
  remark: string
  contactPerson: string
  contactInfo: string
}

const emptyForm: FormState = {
  stationRoomId: '',
  frequency: 'ANNUALLY',
  responsiblePerson: '',
  equipment: [],
  gasLastInspectionDate: '',
  gasNextInspectionDate: '',
  extLastInspectionDate: '',
  extNextInspectionDate: '',
  remark: '',
  contactPerson: '',
  contactInfo: '',
}

const EQUIPMENT_OPTIONS: FireEquipment[] = ['GAS_SUPPRESSION', 'FIRE_EXTINGUISHER']

export default function FireInspectionsPage() {
  const { user } = useAuth()
  const canManage = canWriteModule(user, 'fire-inspections')
  const primaryBtn = getPrimaryBtnClass(user?.role, user?.company)

  const [items, setItems] = useState<FireInspection[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [stationFilter, setStationFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [stationRooms, setStationRooms] = useState<StationRoom[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [stationSearchOpen, setStationSearchOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<FireInspection | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [deleting, setDeleting] = useState<FireInspection | null>(null)
  const [detailItem, setDetailItem] = useState<FireInspection | null>(null)

  useEffect(() => {
    apiClient.get<StationListResponse>('/station-rooms', { params: { pageSize: 200 } })
      .then(d => setStationRooms(d.items))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!formOpen) return
    apiClient.get<{ items: Employee[] }>('/employees', { params: { pageSize: 200, company: 'STATE_GRID' } })
      .then(res => setEmployees((res.items ?? []).filter(e => e.role !== 'ADMIN')))
      .catch(() => setEmployees([]))
  }, [formOpen])

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.get<ListResponse>('/fire-inspections', {
        params: { page, pageSize, search: search || undefined, stationRoomId: stationFilter || undefined },
      })
      setItems(data.items)
      setTotal(data.total)
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : '加载消防巡检列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, search, stationFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSearch = () => { setPage(1); setSearch(searchInput) }

  const openAdd = () => { setEditing(null); setForm(emptyForm); setStationSearchOpen(false); setFormOpen(true) }
  const openEdit = (item: FireInspection) => {
    setEditing(item)
    setForm({
      stationRoomId: item.stationRoomId,
      frequency: item.frequency,
      responsiblePerson: item.responsiblePerson,
      equipment: item.equipment,
      gasLastInspectionDate: item.gasLastInspectionDate ? item.gasLastInspectionDate.slice(0, 10) : '',
      gasNextInspectionDate: item.gasNextInspectionDate ? item.gasNextInspectionDate.slice(0, 10) : '',
      extLastInspectionDate: item.extLastInspectionDate ? item.extLastInspectionDate.slice(0, 10) : '',
      extNextInspectionDate: item.extNextInspectionDate ? item.extNextInspectionDate.slice(0, 10) : '',
      remark: item.remark ?? '',
      contactPerson: item.contactPerson,
      contactInfo: item.contactInfo,
    })
    setFormOpen(true)
  }

  const toggleEquipment = (eq: FireEquipment) => {
    setForm(f => ({
      ...f,
      equipment: f.equipment.includes(eq) ? f.equipment.filter(e => e !== eq) : [...f.equipment, eq],
    }))
  }

  const handleSave = async () => {
    if (!form.stationRoomId || !form.responsiblePerson || !form.contactPerson || !form.contactInfo) {
      toast.error('请填写必填字段')
      return
    }
    // 日期顺序校验：下次巡检日期必须晚于上次巡检日期
    if (form.equipment.includes('GAS_SUPPRESSION') && form.gasLastInspectionDate && form.gasNextInspectionDate) {
      if (form.gasNextInspectionDate <= form.gasLastInspectionDate) {
        toast.error('气灭装置：下次巡检日期必须晚于上次巡检日期')
        return
      }
    }
    if (form.equipment.includes('FIRE_EXTINGUISHER') && form.extLastInspectionDate && form.extNextInspectionDate) {
      if (form.extNextInspectionDate <= form.extLastInspectionDate) {
        toast.error('灭火器：下次巡检日期必须晚于上次巡检日期')
        return
      }
    }
    setIsSaving(true)
    const payload = {
      ...form,
      gasLastInspectionDate: form.gasLastInspectionDate || undefined,
      gasNextInspectionDate: form.gasNextInspectionDate || undefined,
      extLastInspectionDate: form.extLastInspectionDate || undefined,
      extNextInspectionDate: form.extNextInspectionDate || undefined,
      remark: form.remark || undefined,
    }
    try {
      if (editing) {
        await apiClient.put(`/fire-inspections/${editing.id}`, payload)
        toast.success('消防巡检信息已更新')
      } else {
        await apiClient.post('/fire-inspections', payload)
        toast.success('消防巡检添加成功')
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
      await apiClient.delete(`/fire-inspections/${deleting.id}`)
      toast.success('消防巡检已删除')
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
          <h1 className="text-xl font-bold text-slate-800">消防巡检</h1>
          <p className="text-sm text-slate-500 mt-0.5">共 {total} 条记录</p>
        </div>
        {canManage && (
          <Button onClick={openAdd} className={primaryBtn}>
            <Plus size={16} /> 新增巡检
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索负责人、联系人..."
                className="pl-9 w-52"
              />
            </div>
            <select
              value={stationFilter}
              onChange={(e) => { setStationFilter(e.target.value); setPage(1) }}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">全部站室</option>
              {stationRooms.map(sr => <option key={sr.id} value={sr.id}>{sr.name}</option>)}
            </select>
            <Button variant="outline" size="sm" onClick={handleSearch}>搜索</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>站室</TableHead>
                  <TableHead>巡检频率</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>消防设备</TableHead>
                  <TableHead>下次巡检日期</TableHead>
                  <TableHead>巡检联系人</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-12">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />加载中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-slate-400 py-12">暂无消防巡检数据</TableCell></TableRow>
                ) : items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-slate-800">{item.stationRoom?.name ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{FIRE_INSPECTION_FREQUENCY_LABELS[item.frequency]}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{item.responsiblePerson}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {item.equipment.map(eq => (
                          <Badge key={eq} variant="outline" className="text-xs">{FIRE_EQUIPMENT_LABELS[eq]}</Badge>
                        ))}
                        {item.equipment.length === 0 && <span className="text-slate-400 text-sm">-</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {item.equipment.includes('GAS_SUPPRESSION') && item.gasNextInspectionDate && (
                        <div className="text-xs"><span className="text-slate-400">气灭：</span>{formatDate(item.gasNextInspectionDate)}</div>
                      )}
                      {item.equipment.includes('FIRE_EXTINGUISHER') && item.extNextInspectionDate && (
                        <div className="text-xs"><span className="text-slate-400">灭火器：</span>{formatDate(item.extNextInspectionDate)}</div>
                      )}
                      {!item.gasNextInspectionDate && !item.extNextInspectionDate && '-'}
                    </TableCell>
                    <TableCell className="text-slate-600">{item.contactPerson}</TableCell>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑消防巡检' : '新增消防巡检'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>站室 <span className="text-red-500">*</span></Label>
                <Popover open={stationSearchOpen} onOpenChange={setStationSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={stationSearchOpen}
                      className={cn(
                        'w-full justify-between font-normal',
                        !form.stationRoomId && 'text-muted-foreground',
                        form.stationRoomId && 'border-red-400',
                      )}
                    >
                      {form.stationRoomId
                        ? stationRooms.find(sr => sr.id === form.stationRoomId)?.name ?? '选择站室'
                        : '选择站室'}
                      <ChevronsUpDown size={14} className="ml-2 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="输入站室名称搜索..." />
                      <CommandList>
                        <CommandEmpty>未找到匹配的站室</CommandEmpty>
                        <CommandGroup>
                          {stationRooms.map(sr => (
                            <CommandItem
                              key={sr.id}
                              value={sr.name}
                              onSelect={() => {
                                setForm(f => ({ ...f, stationRoomId: sr.id }))
                                setStationSearchOpen(false)
                              }}
                            >
                              <Check
                                size={14}
                                className={cn('mr-2', form.stationRoomId === sr.id ? 'opacity-100' : 'opacity-0')}
                              />
                              {sr.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>巡检频率 <span className="text-red-500">*</span></Label>
                <Select value={form.frequency} onValueChange={(v) => setForm(f => ({ ...f, frequency: v as FireInspectionFrequency }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANNUALLY">年度巡检</SelectItem>
                    <SelectItem value="QUARTERLY">季度巡检</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>消防设备</Label>
              <div className="flex gap-3">
                {EQUIPMENT_OPTIONS.map(eq => (
                  <label key={eq} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.equipment.includes(eq)}
                      onChange={() => toggleEquipment(eq)}
                      className="rounded"
                    />
                    <span className="text-sm">{FIRE_EQUIPMENT_LABELS[eq]}</span>
                  </label>
                ))}
              </div>

              {/* 气灭装置日期 — 仅勾选气灭装置时显示 */}
              {form.equipment.includes('GAS_SUPPRESSION') && (
                <div className="grid grid-cols-2 gap-4 pl-1 pt-1 border-l-2 border-slate-200 ml-1">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs">气灭装置上次巡检日期</Label>
                    <DateInput
                      value={form.gasLastInspectionDate}
                      onChange={(e) => {
                        const val = e.target.value
                        setForm(f => ({
                          ...f,
                          gasLastInspectionDate: val,
                          // 若新上次日期 ≥ 已填的下次日期，清空下次日期
                          gasNextInspectionDate: f.gasNextInspectionDate && val && f.gasNextInspectionDate <= val ? '' : f.gasNextInspectionDate,
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs">气灭装置下次巡检日期</Label>
                    <DateInput
                      value={form.gasNextInspectionDate}
                      min={form.gasLastInspectionDate || undefined}
                      onChange={(e) => setForm(f => ({ ...f, gasNextInspectionDate: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* 灭火器日期 — 仅勾选灭火器时显示 */}
              {form.equipment.includes('FIRE_EXTINGUISHER') && (
                <div className="grid grid-cols-2 gap-4 pl-1 pt-1 border-l-2 border-slate-200 ml-1">
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs">灭火器上次巡检日期</Label>
                    <DateInput
                      value={form.extLastInspectionDate}
                      onChange={(e) => {
                        const val = e.target.value
                        setForm(f => ({
                          ...f,
                          extLastInspectionDate: val,
                          extNextInspectionDate: f.extNextInspectionDate && val && f.extNextInspectionDate <= val ? '' : f.extNextInspectionDate,
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-600 text-xs">灭火器下次巡检日期</Label>
                    <DateInput
                      value={form.extNextInspectionDate}
                      min={form.extLastInspectionDate || undefined}
                      onChange={(e) => setForm(f => ({ ...f, extNextInspectionDate: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>负责人 <span className="text-red-500">*</span></Label>
                <Select
                  value={form.responsiblePerson}
                  onValueChange={(v) => setForm(f => ({ ...f, responsiblePerson: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择负责人" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.length === 0 ? (
                      <SelectItem value="__empty__" disabled>暂无国家电网员工</SelectItem>
                    ) : employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.name}>
                        {emp.name}（{ROLE_LABELS[emp.role]}）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>巡检联系人 <span className="text-red-500">*</span></Label>
                <Input value={form.contactPerson} onChange={(e) => setForm(f => ({ ...f, contactPerson: e.target.value }))} placeholder="联系人姓名" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>联系方式 <span className="text-red-500">*</span></Label>
              <Input value={form.contactInfo} onChange={(e) => setForm(f => ({ ...f, contactInfo: e.target.value }))} placeholder="联系方式" />
            </div>

            <div className="space-y-1.5">
              <Label>备注</Label>
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
          <DialogHeader><DialogTitle>消防巡检详情</DialogTitle></DialogHeader>
          {detailItem && (
            <div className="space-y-3 py-2">
              <div><p className="text-xs text-slate-500">站室</p><p className="font-medium">{detailItem.stationRoom?.name ?? '-'}</p></div>
              <div><p className="text-xs text-slate-500">巡检频率</p><p>{FIRE_INSPECTION_FREQUENCY_LABELS[detailItem.frequency]}</p></div>
              <div><p className="text-xs text-slate-500">负责人</p><p>{detailItem.responsiblePerson}</p></div>
              <div>
                <p className="text-xs text-slate-500">消防设备</p>
                <div className="flex gap-1 flex-wrap mt-1">
                  {detailItem.equipment.map(eq => <Badge key={eq} variant="outline" className="text-xs">{FIRE_EQUIPMENT_LABELS[eq]}</Badge>)}
                  {detailItem.equipment.length === 0 && <span className="text-slate-400 text-sm">-</span>}
                </div>
              </div>
              {detailItem.equipment.includes('GAS_SUPPRESSION') && (
                <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-slate-200">
                  <div><p className="text-xs text-slate-500">气灭装置上次巡检日期</p><p className="text-sm">{formatDate(detailItem.gasLastInspectionDate) || '-'}</p></div>
                  <div><p className="text-xs text-slate-500">气灭装置下次巡检日期</p><p className="text-sm">{formatDate(detailItem.gasNextInspectionDate) || '-'}</p></div>
                </div>
              )}
              {detailItem.equipment.includes('FIRE_EXTINGUISHER') && (
                <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-slate-200">
                  <div><p className="text-xs text-slate-500">灭火器上次巡检日期</p><p className="text-sm">{formatDate(detailItem.extLastInspectionDate) || '-'}</p></div>
                  <div><p className="text-xs text-slate-500">灭火器下次巡检日期</p><p className="text-sm">{formatDate(detailItem.extNextInspectionDate) || '-'}</p></div>
                </div>
              )}
              <div><p className="text-xs text-slate-500">巡检联系人</p><p>{detailItem.contactPerson}</p></div>
              <div><p className="text-xs text-slate-500">联系方式</p><p className="font-mono">{detailItem.contactInfo}</p></div>
              <div><p className="text-xs text-slate-500">备注</p><p className="text-slate-600">{detailItem.remark || '-'}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除该消防巡检记录吗？</AlertDialogDescription>
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
