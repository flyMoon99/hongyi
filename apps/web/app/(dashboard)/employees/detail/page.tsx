'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EmployeeDetail from './employee-detail'

function EmployeeDetailByQuery() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-slate-500">缺少员工参数，请从列表进入</p>
        <Button variant="outline" asChild>
          <Link href="/employees">
            <ArrowLeft size={14} className="mr-2" />返回列表
          </Link>
        </Button>
      </div>
    )
  }

  return <EmployeeDetail id={id} />
}

export default function EmployeeDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-slate-400">
          <div className="h-5 w-5 rounded-full border-2 border-red-500 border-t-transparent animate-spin mr-2" />
          加载中...
        </div>
      }
    >
      <EmployeeDetailByQuery />
    </Suspense>
  )
}
