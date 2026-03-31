import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: '皓鼎弘毅管理后台',
  description: '皓鼎弘毅电力服务管理系统',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  )
}
