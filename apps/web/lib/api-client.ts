import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { getToken } from '@/contexts/auth-context'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

/** Axios instance whose response interceptor returns `response.data` (typed as T on get/post/...). */
export type ApiClient = Omit<
  AxiosInstance,
  'get' | 'post' | 'put' | 'patch' | 'delete' | 'request'
> & {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>
  request<T = unknown>(config: AxiosRequestConfig): Promise<T>
}

const raw = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

raw.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

raw.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('hongyi_user')
      localStorage.removeItem('hongyi_token')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data?.message || '请求失败')
  },
)

export const apiClient = raw as ApiClient
export default apiClient
