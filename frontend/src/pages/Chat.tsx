import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { initSocket, disconnectSocket, getSocket } from '../services/socketService'
import { authService } from '../services/authService'

interface User {
  id: number
  username: string
  email: string
  avatar?: string
}

interface Message {
  id: number
  senderId: number
  senderUsername: string
  senderAvatar?: string
  receiverId: number | null
  content: string
  roomId: string | null
  fileUrl?: string
  fileName?: string
  fileType?: string
  fileSize?: number
  createdAt: string
}

export default function Chat() {
  const { user, token, logout } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    if (!token || !user) return

    setLoading(true)
    setError(null)

    // 初始化 Socket
    const socket = initSocket(token)
    socketRef.current = socket

    // 获取用户列表
    const fetchUsers = async () => {
      try {
        console.log('开始获取用户列表...')
        const userList = await authService.getAllUsers()
        console.log('获取到的用户列表:', userList)
        
        if (Array.isArray(userList)) {
          setUsers(userList)
          setError(null)
        } else {
          console.warn('用户列表格式不正确:', userList)
          setUsers([])
          setError('用户列表格式错误')
        }
      } catch (err: any) {
        console.error('获取用户列表失败:', err)
        const errorMessage = err.response?.data?.error 
          || err.message 
          || '获取用户列表失败，请检查网络连接或刷新页面重试'
        setError(errorMessage)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()

    // Socket 事件监听
    socket.on('users:list', (userList: any[]) => {
      console.log('收到在线用户列表:', userList)
      if (Array.isArray(userList) && userList.length > 0) {
        const onlineIds = new Set(userList.map((u: any) => u.userId || u.user_id))
        console.log('在线用户ID集合:', Array.from(onlineIds))
        setOnlineUsers(onlineIds)
      } else {
        console.log('在线用户列表为空')
        setOnlineUsers(new Set())
      }
    })

    socket.on('user:online', (data: { userId: number; username?: string }) => {
      console.log('用户上线:', data)
      setOnlineUsers(prev => {
        const newSet = new Set(prev)
        newSet.add(data.userId)
        console.log('更新后的在线用户:', Array.from(newSet))
        return newSet
      })
    })

    socket.on('user:offline', (data: { userId: number }) => {
      console.log('用户下线:', data)
      setOnlineUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(data.userId)
        console.log('更新后的在线用户:', Array.from(newSet))
        return newSet
      })
    })

    socket.on('message:receive', (message: any) => {
      console.log('收到新消息:', message)
      try {
        const formattedMessage: Message = {
          id: message.id,
          senderId: message.senderId,
          senderUsername: message.senderUsername || '未知用户',
          senderAvatar: message.senderAvatar,
          receiverId: message.receiverId,
          content: message.content || '',
          roomId: message.roomId,
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          fileType: message.fileType,
          fileSize: message.fileSize,
          createdAt: message.createdAt || new Date().toISOString()
        }
        setMessages(prev => [...prev, formattedMessage])
      } catch (error) {
        console.error('处理新消息时出错:', error)
      }
    })

    socket.on('messages:history', (historyMessages: any[]) => {
      console.log('收到历史消息:', historyMessages)
      try {
        if (Array.isArray(historyMessages)) {
          // 确保消息格式正确
          const formattedMessages = historyMessages.map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender_id || msg.senderId,
            senderUsername: msg.sender_username || msg.senderUsername || '未知用户',
            senderAvatar: msg.sender_avatar || msg.senderAvatar,
            receiverId: msg.receiver_id || msg.receiverId,
            content: msg.content || '',
            roomId: msg.room_id || msg.roomId,
            fileUrl: msg.file_url || msg.fileUrl,
            fileName: msg.file_name || msg.fileName,
            fileType: msg.file_type || msg.fileType,
            fileSize: msg.file_size || msg.fileSize,
            createdAt: msg.created_at || msg.createdAt
          }))
          setMessages(formattedMessages)
          console.log('历史消息已加载:', formattedMessages.length, '条')
        } else {
          console.warn('历史消息格式不正确:', historyMessages)
          setMessages([])
        }
      } catch (error) {
        console.error('处理历史消息时出错:', error)
        setMessages([])
      }
    })

    socket.on('error', (error: { message: string }) => {
      console.error('Socket错误:', error.message)
      setError('连接错误: ' + error.message)
    })

    socket.on('connect', () => {
      console.log('Socket已连接')
      setError(null)
      // 连接成功后，可以主动请求在线用户列表（虽然服务器会自动推送）
      // 但为了确保数据同步，我们等待服务器推送
    })

    socket.on('disconnect', () => {
      console.log('Socket已断开')
    })

    // 清理函数：组件卸载时断开连接
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners()
      }
      // 注意：这里不调用disconnectSocket()，因为可能只是切换路由，不是真正退出
      // 只有在真正退出登录时才断开连接
    }
  }, [token, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedUser) {
      setMessages([])
      return
    }

    if (!socketRef.current) {
      console.warn('Socket未初始化，无法获取历史消息')
      return
    }

    if (socketRef.current.connected) {
      console.log('请求历史消息，用户ID:', selectedUser.id)
      // 清空当前消息，准备加载新对话的历史消息
      setMessages([])
      // 获取历史消息
      socketRef.current.emit('messages:history', {
        userId: selectedUser.id
      })
    } else {
      console.log('Socket未连接，等待连接...')
      // Socket未连接，等待连接后再获取历史消息
      const connectHandler = () => {
        console.log('Socket已连接，请求历史消息')
        setMessages([])
        socketRef.current?.emit('messages:history', {
          userId: selectedUser.id
        })
        socketRef.current?.off('connect', connectHandler)
      }
      socketRef.current.once('connect', connectHandler)
    }
  }, [selectedUser])

  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if ((!messageInput.trim() && !uploading) || !selectedUser || !socketRef.current) return

    socketRef.current.emit('message:send', {
      content: messageInput,
      receiverId: selectedUser.id
    })

    setMessageInput('')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedUser || !socketRef.current) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/upload/file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('文件上传失败')
      }

      const data = await response.json()
      
      // 发送文件消息
      socketRef.current.emit('message:send', {
        content: messageInput || `[文件] ${file.name}`,
        receiverId: selectedUser.id,
        fileUrl: data.file.url,
        fileName: data.file.originalName,
        fileType: data.file.mimetype,
        fileSize: data.file.size
      })

      setMessageInput('')
    } catch (error) {
      console.error('文件上传错误:', error)
      alert('文件上传失败，请重试')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const isImageFile = (fileType?: string) => {
    return fileType?.startsWith('image/')
  }

  const handleLogout = () => {
    disconnectSocket()
    logout()
  }

  // 计算在线用户数量（不包括当前用户）
  // 只统计在用户列表中的在线用户
  const otherUsers = users.filter(u => u.id !== user?.id)
  const onlineOtherUsers = otherUsers.filter(u => onlineUsers.has(u.id))
  const onlineCount = onlineOtherUsers.length
  const offlineCount = Math.max(0, otherUsers.length - onlineCount) // 确保不为负数
  const totalUsers = otherUsers.length
  
  // 调试信息
  useEffect(() => {
    if (user) {
      console.log('=== 用户列表状态 ===')
      console.log('当前用户ID:', user.id)
      console.log('所有用户:', users)
      console.log('其他用户（排除自己）:', otherUsers)
      console.log('在线用户ID集合:', Array.from(onlineUsers))
      console.log('在线其他用户:', onlineOtherUsers)
      console.log('在线数量:', onlineCount)
      console.log('离线数量:', offlineCount)
      console.log('总用户数量:', totalUsers)
    }
  }, [onlineUsers, users, user, onlineCount, offlineCount, totalUsers])

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-lg border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  OA办公系统
                </h1>
                <p className="text-xs text-gray-500">实时聊天</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {onlineCount > 0 ? `${onlineCount} 人在线` : '暂无其他用户在线'}
              </span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                {user?.username[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-md hover:shadow-lg transform hover:scale-105"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧用户列表 */}
        <aside className="w-72 bg-white border-r border-gray-200 overflow-hidden flex flex-col shadow-lg">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-800 text-lg">用户列表</h2>
              <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                {totalUsers} 人
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">在线 {onlineCount}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span className="font-medium">离线 {offlineCount}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="animate-spin h-8 w-8 text-indigo-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm text-gray-500">加载用户列表...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center max-w-xs">
                  <div className="text-5xl mb-3">⚠️</div>
                  <p className="text-sm text-red-600 mb-1 font-medium">{error}</p>
                  <p className="text-xs text-gray-500 mb-4">请检查后端服务是否正常运行</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        setError(null)
                        setLoading(true)
                        authService.getAllUsers()
                          .then((userList) => {
                            if (Array.isArray(userList)) {
                              setUsers(userList)
                              setError(null)
                            } else {
                              setUsers([])
                              setError('用户列表格式错误')
                            }
                            setLoading(false)
                          })
                          .catch((err: any) => {
                            const errorMessage = err.response?.data?.error 
                              || err.message 
                              || '获取用户列表失败，请刷新页面重试'
                            setError(errorMessage)
                            setLoading(false)
                          })
                      }}
                      className="text-xs px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      重试
                    </button>
                    <button
                      onClick={() => {
                        window.location.reload()
                      }}
                      className="text-xs px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      刷新页面
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {totalUsers === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-5xl mb-4">👥</div>
                    <p className="text-sm font-medium text-gray-700 mb-1">暂无其他用户</p>
                    <p className="text-xs text-gray-500 mb-4">打开新窗口注册更多账号开始聊天</p>
                    <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
                      <p className="mb-1">💡 提示：</p>
                      <p>使用无痕窗口或另一个浏览器注册新账号</p>
                    </div>
                  </div>
                ) : (
                  users
                    .filter(u => u.id !== user?.id)
                    .sort((a, b) => {
                      // 在线用户排在前面
                      const aOnline = onlineUsers.has(a.id)
                      const bOnline = onlineUsers.has(b.id)
                      if (aOnline && !bOnline) return -1
                      if (!aOnline && bOnline) return 1
                      return 0
                    })
                    .map(u => {
                      const isOnline = onlineUsers.has(u.id)
                      return (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className={`w-full p-4 text-left hover:bg-gray-50 transition-all ${
                            selectedUser?.id === u.id 
                              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 shadow-sm' 
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md ${
                                isOnline 
                                  ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
                              }`}>
                                {u.username[0].toUpperCase()}
                              </div>
                              {isOnline && (
                                <>
                                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-ping"></div>
                                </>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-gray-800 truncate">{u.username}</div>
                                {isOnline && (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                    在线
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate mt-0.5">{u.email}</div>
                            </div>
                          </div>
                        </button>
                      )
                    })
                )}
              </div>
            )}
          </div>
        </aside>

        {/* 右侧聊天区域 */}
        <main className="flex-1 flex flex-col bg-white">
          {selectedUser ? (
            <>
              {/* 聊天头部 */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 px-6 py-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold text-xl shadow-lg ${
                      onlineUsers.has(selectedUser.id)
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                        : 'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      {selectedUser.username[0].toUpperCase()}
                    </div>
                    {onlineUsers.has(selectedUser.id) && (
                      <>
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-ping"></div>
                      </>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-gray-800 text-lg">{selectedUser.username}</div>
                      {onlineUsers.has(selectedUser.id) ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          在线
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                          离线
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{selectedUser.email}</div>
                  </div>
                </div>
              </div>

              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white">
                <div className="space-y-4 max-w-4xl mx-auto">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">💬</div>
                      <p className="text-gray-500">还没有消息，开始对话吧！</p>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      try {
                        const isOwn = message.senderId === user?.id
                        const senderInitial = message.senderUsername?.[0]?.toUpperCase() || '?'
                        const messageContent = message.content || ''
                        const messageTime = message.createdAt 
                          ? new Date(message.createdAt).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : ''

                        return (
                          <div
                            key={message.id || index}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                          >
                            <div className={`flex items-end gap-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                              {!isOwn && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-md">
                                  {senderInitial}
                                </div>
                              )}
                              <div
                                className={`px-4 py-3 rounded-2xl shadow-md ${
                                  isOwn
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-md'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                                }`}
                              >
                                {!isOwn && message.senderUsername && (
                                  <div className="text-xs font-semibold mb-1.5 opacity-90">
                                    {message.senderUsername}
                                  </div>
                                )}
                                {/* 文件显示 */}
                                {message.fileUrl && (
                                  <div className="mb-2">
                                    {isImageFile(message.fileType) ? (
                                      <div className="rounded-lg overflow-hidden max-w-xs">
                                        <img 
                                          src={`http://localhost:3001${message.fileUrl}`}
                                          alt={message.fileName || '图片'}
                                          className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => window.open(`http://localhost:3001${message.fileUrl}`, '_blank')}
                                        />
                                      </div>
                                    ) : (
                                      <a
                                        href={`http://localhost:3001${message.fileUrl}`}
                                        download={message.fileName}
                                        className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${
                                          isOwn 
                                            ? 'bg-indigo-400 hover:bg-indigo-300' 
                                            : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                      >
                                        <div className="flex-shrink-0">
                                          <svg className={`w-8 h-8 ${isOwn ? 'text-white' : 'text-indigo-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-800'}`}>
                                            {message.fileName || '文件'}
                                          </div>
                                          {message.fileSize && (
                                            <div className={`text-xs ${isOwn ? 'text-indigo-100' : 'text-gray-500'}`}>
                                              {formatFileSize(message.fileSize)}
                                            </div>
                                          )}
                                        </div>
                                        <svg className={`w-5 h-5 flex-shrink-0 ${isOwn ? 'text-indigo-100' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                )}
                                {/* 文本内容 */}
                                {messageContent && (
                                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {messageContent}
                                  </div>
                                )}
                                {messageTime && (
                                  <div
                                    className={`text-xs mt-2 ${
                                      isOwn ? 'text-indigo-100' : 'text-gray-400'
                                    }`}
                                  >
                                    {messageTime}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      } catch (error) {
                        console.error('渲染消息时出错:', error, message)
                        return null
                      }
                    }).filter(Boolean)
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* 消息输入框 */}
              <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4 shadow-lg">
                <div className="flex gap-3 max-w-4xl mx-auto">
                  {/* 文件上传按钮 */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file-input"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                  />
                  <label
                    htmlFor="file-input"
                    className="flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors"
                    title="上传文件"
                  >
                    {uploading ? (
                      <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    )}
                  </label>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="输入消息..."
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                  <button
                    type="submit"
                    disabled={(!messageInput.trim() && !uploading)}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg font-semibold"
                  >
                    {uploading ? '上传中...' : '发送'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-3xl mb-6 shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">选择一个用户开始聊天</h3>
                <p className="text-gray-500">从左侧用户列表中选择一个用户开始对话</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}



