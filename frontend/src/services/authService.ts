import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10秒超时
})

// 请求拦截器：添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log(`📤 发送请求: ${config.method?.toUpperCase()} ${config.url}, Token: ${token.substring(0, 20)}...`)
  } else {
    console.warn(`⚠️ 请求 ${config.url} 没有token`)
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 不要在这里自动清除token，让调用方决定如何处理
    // 这样可以避免网络错误时误清除有效的token
    if (error.response) {
      // 服务器返回了错误状态码
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('❌ 认证失败 (401/403)，token可能无效')
        console.error('错误详情:', error.response.data)
        console.error('请求URL:', error.config?.url)
        // 注意：不在这里清除token，让AuthContext决定
      } else {
        console.error(`服务器错误: ${error.response.status}`, error.response.data)
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应（网络错误或后端未启动）
      console.warn('网络错误：无法连接到后端服务，请检查后端是否运行')
    } else {
      // 其他错误
      console.error('请求错误:', error.message)
    }
    return Promise.reject(error)
  }
)

export const authService = {
  async login(username: string, password: string) {
    const response = await api.post('/auth/login', { username, password })
    return response.data
  },

  async register(username: string, email: string, password: string) {
    const response = await api.post('/auth/register', { username, email, password })
    return response.data
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me')
    return response.data
  },

  async getAllUsers() {
    const response = await api.get('/auth/users')
    return response.data
  },
}



