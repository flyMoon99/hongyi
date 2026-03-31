import { mockCustomers } from '@/lib/mock-data'
import CustomerDetail from './customer-detail'

export function generateStaticParams() {
  return mockCustomers.map((c) => ({ id: c.id }))
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CustomerDetail id={id} />
}
