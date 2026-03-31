import axios from 'axios'
import { getToken } from '@/contexts/auth-context'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hongyi_user')
      localStorage.removeItem('hongyi_token')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data?.message || '请求失败')
  },
)

export default apiClient
