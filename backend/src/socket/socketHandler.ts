import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { MessageModel } from '../models/Message';
import { JWT_SECRET } from '../config/jwt';

interface SocketUser {
  userId: number;
  username: string;
  socketId: string;
}

const onlineUsers = new Map<number, SocketUser>();

export function setupSocketIO(io: Server) {
  // Socket.io 认证中间件
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('未提供认证令牌'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.data.userId = decoded.userId;
      socket.data.username = decoded.username;
      next();
    } catch (err) {
      next(new Error('无效的认证令牌'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    const username = socket.data.username;

    console.log(`用户 ${username} (ID: ${userId}) 已连接`);

    // 添加在线用户
    onlineUsers.set(userId, {
      userId,
      username,
      socketId: socket.id
    });

    console.log(`当前在线用户数: ${onlineUsers.size}`, Array.from(onlineUsers.values()).map(u => u.username));

    // 通知所有用户有新用户上线
    io.emit('user:online', {
      userId,
      username
    });

    // 向所有客户端广播更新后的在线用户列表
    const onlineUsersList = Array.from(onlineUsers.values());
    io.emit('users:list', onlineUsersList);
    console.log('已广播在线用户列表给所有客户端:', onlineUsersList);

    // 加入房间（用于群聊）
    socket.on('room:join', (roomId: string) => {
      socket.join(roomId);
      console.log(`用户 ${username} 加入房间 ${roomId}`);
    });

    // 离开房间
    socket.on('room:leave', (roomId: string) => {
      socket.leave(roomId);
      console.log(`用户 ${username} 离开房间 ${roomId}`);
    });

    // 发送消息
    socket.on('message:send', async (data: { 
      content: string; 
      receiverId?: number; 
      roomId?: string;
      fileUrl?: string;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
    }) => {
      try {
        const { content, receiverId, roomId, fileUrl, fileName, fileType, fileSize } = data;

        if ((!content || content.trim() === '') && !fileUrl) {
          socket.emit('error', { message: '消息内容或文件不能为空' });
          return;
        }

        // 保存消息到数据库
        const message = MessageModel.create(
          userId, 
          content || (fileUrl ? `[文件] ${fileName || '未命名文件'}` : ''), 
          receiverId, 
          roomId,
          fileUrl,
          fileName,
          fileType,
          fileSize
        );
        const user = UserModel.findById(userId);

        const messageData = {
          id: message.id,
          senderId: userId,
          senderUsername: username,
          senderAvatar: user?.avatar,
          receiverId: receiverId || null,
          content: content || '',
          roomId: roomId || null,
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          fileType: fileType || null,
          fileSize: fileSize || null,
          createdAt: message.created_at
        };
        
        console.log('发送消息:', messageData);

        if (roomId) {
          // 群聊消息
          io.to(roomId).emit('message:receive', messageData);
        } else if (receiverId) {
          // 私聊消息
          const receiver = onlineUsers.get(receiverId);
          if (receiver) {
            io.to(receiver.socketId).emit('message:receive', messageData);
          }
          socket.emit('message:receive', messageData); // 发送者也收到确认
        } else {
          socket.emit('error', { message: '请指定接收者或房间' });
        }
      } catch (error) {
        console.error('发送消息错误:', error);
        socket.emit('error', { message: '发送消息失败' });
      }
    });

    // 获取历史消息
    socket.on('messages:history', (data: { roomId?: string; userId?: number }) => {
      try {
        const { roomId, userId: otherUserId } = data;
        let messages;

        if (roomId) {
          messages = MessageModel.getMessagesByRoom(roomId);
        } else if (otherUserId) {
          messages = MessageModel.getPrivateMessages(userId, otherUserId);
        } else {
          socket.emit('error', { message: '请指定房间或用户ID' });
          return;
        }

        // 格式化消息数据，确保字段名一致
        const formattedMessages = messages.map((msg: any) => ({
          id: msg.id,
          senderId: msg.sender_id,
          senderUsername: msg.sender_username || '未知用户',
          senderAvatar: msg.sender_avatar,
          receiverId: msg.receiver_id,
          content: msg.content,
          roomId: msg.room_id,
          fileUrl: msg.file_url,
          fileName: msg.file_name,
          fileType: msg.file_type,
          fileSize: msg.file_size,
          createdAt: msg.created_at
        }));

        console.log(`发送历史消息给用户 ${userId}，共 ${formattedMessages.length} 条`);
        socket.emit('messages:history', formattedMessages);
      } catch (error) {
        console.error('获取历史消息错误:', error);
        socket.emit('error', { message: '获取历史消息失败' });
      }
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`用户 ${username} (ID: ${userId}) 已断开连接`);
      onlineUsers.delete(userId);
      
      console.log(`当前在线用户数: ${onlineUsers.size}`, Array.from(onlineUsers.values()).map(u => u.username));
      
      // 通知所有用户有用户下线
      io.emit('user:offline', { userId });
      
      // 向所有客户端广播更新后的在线用户列表
      const onlineUsersList = Array.from(onlineUsers.values());
      io.emit('users:list', onlineUsersList);
      console.log('已广播更新后的在线用户列表:', onlineUsersList);
    });
  });
}



