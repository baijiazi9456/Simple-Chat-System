import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function initSocket(token: string): Socket {
  // 如果已有连接且token相同，直接返回
  if (socket?.connected) {
    return socket
  }

  // 如果已有socket但未连接，先断开
  if (socket) {
    socket.disconnect()
    socket = null
  }

  // 创建新连接
  socket = io('http://localhost:3001', {
    auth: {
      token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => {
    console.log('Socket连接成功')
  })

  socket.on('disconnect', () => {
    console.log('Socket断开连接')
  })

  socket.on('connect_error', (error) => {
    console.error('Socket连接错误:', error)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket.removeAllListeners()
    socket = null
    console.log('Socket已断开并清理')
  }
}

export function getSocket(): Socket | null {
  return socket
}



