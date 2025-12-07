# OA 办公系统

## 项目概述
从零开始开发一个 Web OA 系统，包含用户注册登录和在线聊天功能。

## 功能需求

### 1. 用户认证模块
- 用户注册
  - 用户名、邮箱、密码
  - 密码加密存储
  - 注册验证
- 用户登录
  - 用户名/邮箱登录
  - JWT Token 认证
  - 登录状态保持
- 用户管理
  - 个人信息查看/编辑
  - 密码修改

### 2. 在线聊天模块
- 实时消息发送/接收
- 用户列表显示
- 聊天记录保存
- 消息状态（已读/未读）
- 多用户聊天支持

## 技术栈

### 前端
- React 18 + TypeScript
- Vite（构建工具）
- React Router（路由）
- Axios（HTTP 请求）
- Socket.io-client（实时通信）
- Tailwind CSS（样式）

### 后端
- Node.js + Express
- TypeScript
- Socket.io（WebSocket 实时通信）
- JWT（身份认证）
- bcrypt（密码加密）
- SQLite（数据库，便于部署）

## 项目结构
```
oa-system/
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.tsx
│   └── package.json
├── backend/           # 后端项目
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── socket/
│   │   └── server.ts
│   └── package.json
└── README.md
```

## 开发计划
1. ✅ 项目需求分析和技术选型
2. ⏳ 搭建项目基础结构
3. ⏳ 实现用户注册登录功能
4. ⏳ 实现在线聊天功能
5. ⏳ 测试和优化
