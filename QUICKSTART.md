# 快速启动指南

## 在 Cursor 中安装环境

### 前置要求
确保已安装 Node.js（版本 >= 16.0.0）
- 检查 Node.js：在 Cursor 终端运行 `node -v`
- 检查 npm：在 Cursor 终端运行 `npm -v`
- 如果未安装，请访问 [Node.js 官网](https://nodejs.org/) 下载安装

### 在 Cursor 中打开终端

Cursor 中打开终端的方法：
1. **快捷键**：按 `Ctrl + `` (反引号) 或 `Ctrl + ~`
2. **菜单**：`Terminal` → `New Terminal`
3. **命令面板**：`Ctrl + Shift + P` → 输入 "Terminal: Create New Terminal"

### 第一步：安装依赖

#### 安装后端依赖
在 Cursor 终端中执行：

```bash
# 进入后端目录
cd backend

# 安装依赖（可能需要几分钟）
npm install
```

安装成功后会看到类似输出：
```
added 150 packages, and audited 151 packages in 30s
```

#### 安装前端依赖
在 Cursor 终端中执行（可以新开一个终端标签页）：

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install
```

**提示**：在 Cursor 中可以：
- 点击终端右上角的 `+` 创建新终端标签页
- 使用 `Ctrl + Shift + `` 快速创建新终端
- 每个终端标签页可以独立运行不同的命令

### 第二步：配置环境变量

#### Windows 系统（在 Cursor 终端中）
```bash
# 进入后端目录
cd backend

# 复制环境变量示例文件
copy env.example .env
```

#### 或者直接在 Cursor 中创建文件
1. 在左侧文件资源管理器中，右键点击 `backend` 文件夹
2. 选择 `New File`
3. 文件名输入 `.env`
4. 复制 `env.example` 的内容到 `.env` 文件

#### 编辑 .env 文件
在 Cursor 中打开 `backend/.env` 文件，修改以下内容：

```env
PORT=3001
JWT_SECRET=your-secret-key-change-in-production-请修改为随机字符串
DB_PATH=./data/oa.db
FRONTEND_URL=http://localhost:5173
```

**重要**：将 `JWT_SECRET` 修改为一个安全的随机字符串（建议至少 32 个字符）

### 第三步：启动服务

在 Cursor 中，建议使用**两个终端标签页**分别运行前端和后端：

#### 启动后端服务（终端 1）
1. 在 Cursor 中打开终端（`Ctrl + ``）
2. 确保在项目根目录，然后执行：
```bash
cd backend
npm run dev
```

看到以下输出表示启动成功：
```
🚀 服务器运行在 http://localhost:3001
✅ 数据库初始化完成
```

#### 启动前端服务（终端 2）
1. 点击终端右上角的 `+` 创建新终端标签页
2. 或者按 `Ctrl + Shift + `` 创建新终端
3. 执行：
```bash
cd frontend
npm run dev
```

看到以下输出表示启动成功：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**提示**：在 Cursor 中：
- 可以同时看到多个终端标签页
- 每个终端标签页可以独立运行命令
- 使用 `Ctrl + PageUp/PageDown` 切换终端标签页

### 第四步：使用系统

1. **打开浏览器**访问 `http://localhost:5173`
   - 可以直接在 Cursor 中按 `Ctrl + 点击` 链接打开
   - 或者在终端中看到链接后，`Ctrl + 点击` 打开浏览器

2. **注册账号**：
   - 点击"立即注册"
   - 输入用户名、邮箱和密码（至少6位）
   - 点击"注册"按钮

3. **开始聊天**：
   - 注册成功后自动跳转到聊天页面
   - 在左侧用户列表中选择一个用户
   - 在底部输入框输入消息并发送

4. **测试多用户**：
   - 打开浏览器的**无痕窗口**（`Ctrl + Shift + N`）
   - 访问 `http://localhost:5173`
   - 注册另一个账号
   - 两个窗口可以互相发送消息测试实时聊天功能

## 常见问题

### 端口被占用
如果 3001 或 5173 端口被占用，可以：
- 修改 `backend/.env` 中的 `PORT`
- 修改 `frontend/vite.config.ts` 中的 `server.port`

### 数据库文件位置
数据库文件默认保存在 `backend/data/oa.db`，首次运行会自动创建。

### Socket.io 连接失败
确保：
1. 后端服务已启动
2. `.env` 文件中的 `FRONTEND_URL` 与前端地址一致
3. 防火墙允许连接

