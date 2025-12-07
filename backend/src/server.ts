import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import { initDatabase } from './models/database';
import { setupSocketIO } from './socket/socketHandler';
// 导入JWT配置以确保初始化（必须在其他导入之后，因为需要先加载.env）
import { JWT_SECRET } from './config/jwt';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务（用于访问上传的文件）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 初始化数据库
initDatabase();

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);

// Socket.io 处理
setupSocketIO(io);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'OA系统后端服务运行中' });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});



