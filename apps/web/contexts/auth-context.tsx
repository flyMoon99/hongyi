'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import type { CurrentUser } from '@/types'

interface AuthContextType {
  user: CurrentUser | null
  isLoading: boolean
  login: (user: CurrentUser, token: string) => void
  logout: () => void
  updateUser: (updates: Partial<CurrentUser>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'hongyi_user'
const TOKEN_KEY = 'hongyi_token'

// 默认管理员账号，开发阶段直接免登录
const DEFAULT_ADMIN: CurrentUser = {
  id: 'emp-1',
  name: '张伟',
  phone: '13800138001',
  email: 'zhangwei@holdingpower.cn',
  avatar: null,
  isAdmin: true,
  gender: 'MALE',
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(DEFAULT_ADMIN)
  const [isLoading] = useState(false)

  const login = useCallback((userData: CurrentUser, token: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
    localStorage.setItem(TOKEN_KEY, token)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    window.location.href = '/login'
  }, [])

  const updateUser = useCallback((updates: Partial<CurrentUser>) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}
