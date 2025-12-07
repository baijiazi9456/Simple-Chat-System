import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

interface User {
  id: number
  username: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 从 localStorage 恢复登录状态
    const savedToken = localStorage.getItem('token')
    console.log('🔍 检查localStorage中的token...')
    if (savedToken) {
      console.log('✅ 找到保存的token，长度:', savedToken.length)
      setToken(savedToken)
      console.log('开始验证token...')
      
      // 验证 token 是否有效并获取用户信息
      authService.getCurrentUser()
        .then(userData => {
          if (userData && userData.id) {
            setUser(userData)
            console.log('✅ 登录状态已恢复:', userData)
          } else {
            console.warn('⚠️ 用户数据无效，清除token')
            // token 无效，清除
            localStorage.removeItem('token')
            setToken(null)
            setUser(null)
          }
        })
        .catch((err: any) => {
          // 区分不同类型的错误
          if (err.response) {
            // 服务器返回了错误状态码
            if (err.response.status === 401 || err.response.status === 403) {
              // 明确的认证失败，清除token
              console.error('❌ Token无效或已过期，清除登录状态')
              localStorage.removeItem('token')
              setToken(null)
              setUser(null)
            } else {
              // 其他服务器错误（如500），可能是后端问题，保留token但显示错误
              console.error('⚠️ 服务器错误，但保留登录状态:', err.response.status)
              // 保留token，但可能需要提示用户
            }
          } else if (err.request) {
            // 网络错误，后端可能未启动，保留token
            console.warn('⚠️ 网络错误，无法验证登录状态，但保留token（可能是后端未启动）')
            // 保留token，假设用户仍然登录
            // 不设置user，让用户知道需要检查连接
          } else {
            // 其他错误
            console.error('❌ 恢复登录状态时发生错误:', err.message)
            // 为了安全，清除token
            localStorage.removeItem('token')
            setToken(null)
            setUser(null)
          }
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      console.log('未找到保存的token')
      setLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    const response = await authService.login(username, password)
    if (response.token) {
      console.log('✅ 登录成功，保存token到localStorage')
      setToken(response.token)
      setUser(response.user)
      localStorage.setItem('token', response.token)
      console.log('✅ Token已保存，长度:', response.token.length)
    } else {
      console.error('❌ 登录响应中没有token')
      throw new Error('登录失败：未收到token')
    }
  }

  const register = async (username: string, email: string, password: string) => {
    const response = await authService.register(username, email, password)
    if (response.token) {
      console.log('✅ 注册成功，保存token到localStorage')
      setToken(response.token)
      setUser(response.user)
      localStorage.setItem('token', response.token)
      console.log('✅ Token已保存，长度:', response.token.length)
    } else {
      console.error('❌ 注册响应中没有token')
      throw new Error('注册失败：未收到token')
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}



