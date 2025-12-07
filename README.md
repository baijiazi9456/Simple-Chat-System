# OA 办公系统

一个基于 React + Node.js 的现代化 Web OA 系统，包含用户注册登录和实时在线聊天功能。

> 📖 **上传到 GitHub**: 查看 [GITHUB_GUIDE.md](./GITHUB_GUIDE.md) 了解详细步骤

## 功能特性

- ✅ 用户注册和登录
- ✅ JWT 身份认证
- ✅ 实时在线聊天（基于 Socket.io）
- ✅ 用户在线状态显示
- ✅ 聊天记录保存
- ✅ 现代化 UI 设计（Tailwind CSS）

## 技术栈

### 前端
- React 18 + TypeScript
- Vite
- React Router
- Axios
- Socket.io-client
- Tailwind CSS

### 后端
- Node.js + Express
- TypeScript
- Socket.io
- JWT
- bcrypt
- SQLite

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm 或 yarn

### 安装依赖

#### 后端
```bash
cd backend
npm install
```

#### 前端
```bash
cd frontend
npm install
```

### 配置环境变量

在 `backend` 目录下创建 `.env` 文件：

```env
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
DB_PATH=./data/oa.db
```

### 启动项目

#### 启动后端服务
```bash
cd backend
npm run dev
```

后端服务将在 `http://localhost:3001` 启动

#### 启动前端服务
```bash
cd frontend
npm run dev
```

前端应用将在 `http://localhost:5173` 启动

### 构建生产版本

#### 后端
```bash
cd backend
npm run build
npm start
```

#### 前端
```bash
cd frontend
npm run build
```

## 项目结构

```
oa-system/
├── backend/              # 后端服务
│   ├── src/
│   │   ├── models/      # 数据模型
│   │   ├── routes/      # API 路由
│   │   ├── middleware/  # 中间件
│   │   ├── socket/      # Socket.io 处理
│   │   └── server.ts    # 服务器入口
│   └── package.json
├── frontend/            # 前端应用
│   ├── src/
│   │   ├── components/  # React 组件
│   │   ├── pages/       # 页面组件
│   │   ├── services/    # API 服务
│   │   ├── contexts/    # React Context
│   │   └── App.tsx      # 应用入口
│   └── package.json
└── README.md
```

## API 接口

### 认证接口

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `GET /api/auth/users` - 获取所有用户列表

### Socket.io 事件

#### 客户端发送
- `room:join` - 加入房间
- `room:leave` - 离开房间
- `message:send` - 发送消息
- `messages:history` - 获取历史消息

#### 服务器发送
- `users:list` - 在线用户列表
- `user:online` - 用户上线通知
- `user:offline` - 用户下线通知
- `message:receive` - 接收消息
- `messages:history` - 历史消息数据
- `error` - 错误信息

## 数据库操作

详细的数据操作指南请查看 [DATABASE.md](./DATABASE.md)

### 快速操作

使用数据库工具脚本：

```bash
cd backend

# 查看所有用户
node scripts/db-utils.js list-users

# 查看所有消息
node scripts/db-utils.js list-messages

# 显示统计信息
node scripts/db-utils.js stats

# 备份数据库
node scripts/db-utils.js backup

# 重置数据库（危险操作！）
node scripts/db-utils.js reset
```

### 使用 SQLite 命令行

```bash
# 连接数据库
sqlite3 backend/data/oa.db

# 在 SQLite 中执行查询
SELECT * FROM users;
```

### 使用 GUI 工具

推荐使用 **DB Browser for SQLite** (https://sqlitebrowser.org/)
1. 下载并安装
2. 打开 `backend/data/oa.db` 文件
3. 可以查看和编辑数据

## 开发计划

- [x] 项目需求分析和技术选型
- [x] 搭建项目基础结构
- [x] 实现用户注册登录功能
- [x] 实现在线聊天功能
- [x] 数据库操作文档
- [ ] 添加群聊功能
- [ ] 添加文件上传功能
- [ ] 添加消息已读/未读状态
- [ ] 优化 UI/UX
- [ ] 添加单元测试
- [ ] 部署文档

## 许可证

ISC



