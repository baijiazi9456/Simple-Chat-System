# 数据库操作指南

## 数据库基本信息

- **数据库类型**: SQLite
- **数据库文件位置**: `backend/data/oa.db`
- **数据库文件**: 单个文件，便于备份和迁移

## 数据库表结构

### 1. users 表（用户表）
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 2. messages 表（消息表）
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER,
  content TEXT NOT NULL,
  room_id TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
)
```

### 3. online_users 表（在线用户表）
```sql
CREATE TABLE online_users (
  user_id INTEGER PRIMARY KEY,
  socket_id TEXT NOT NULL,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

## 方法一：使用命令行工具（SQLite CLI）

### 安装 SQLite

**Windows:**
1. 下载 SQLite: https://www.sqlite.org/download.html
2. 解压后将 `sqlite3.exe` 添加到系统 PATH

**macOS:**
```bash
# 通常已预装，如果没有：
brew install sqlite
```

**Linux:**
```bash
sudo apt-get install sqlite3
```

### 连接数据库

在项目根目录或 `backend` 目录下执行：

```bash
# Windows (PowerShell)
sqlite3 backend\data\oa.db

# Linux/macOS
sqlite3 backend/data/oa.db
```

### 常用 SQL 命令

#### 查看所有表
```sql
.tables
```

#### 查看表结构
```sql
.schema users
.schema messages
.schema online_users
```

#### 查看所有用户
```sql
SELECT id, username, email, created_at FROM users;
```

#### 查看用户详细信息（不包括密码）
```sql
SELECT id, username, email, avatar, created_at, updated_at FROM users;
```

#### 查看所有消息
```sql
SELECT * FROM messages;
```

#### 查看两个用户之间的消息
```sql
SELECT 
  m.id,
  u1.username as sender,
  u2.username as receiver,
  m.content,
  m.created_at
FROM messages m
LEFT JOIN users u1 ON m.sender_id = u1.id
LEFT JOIN users u2 ON m.receiver_id = u2.id
WHERE (m.sender_id = 1 AND m.receiver_id = 2) 
   OR (m.sender_id = 2 AND m.receiver_id = 1)
ORDER BY m.created_at;
```

#### 统计每个用户的消息数量
```sql
SELECT 
  u.username,
  COUNT(m.id) as message_count
FROM users u
LEFT JOIN messages m ON u.id = m.sender_id
GROUP BY u.id, u.username
ORDER BY message_count DESC;
```

#### 删除用户（谨慎操作）
```sql
-- 先删除该用户的所有消息
DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?;

-- 再删除用户
DELETE FROM users WHERE id = ?;
```

#### 清空所有消息
```sql
DELETE FROM messages;
```

#### 重置数据库（删除所有数据）
```sql
-- 注意：这会删除所有数据！
DELETE FROM messages;
DELETE FROM online_users;
DELETE FROM users;
```

#### 退出 SQLite
```sql
.quit
或
.exit
```

## 方法二：使用 GUI 工具

### 推荐工具

#### 1. DB Browser for SQLite（免费，推荐）
- **下载**: https://sqlitebrowser.org/
- **特点**: 跨平台，界面友好，功能完整

**使用步骤:**
1. 下载并安装 DB Browser for SQLite
2. 打开软件
3. 点击 "打开数据库"
4. 选择 `backend/data/oa.db` 文件
5. 在 "浏览数据" 标签页查看和编辑数据
6. 在 "执行 SQL" 标签页执行 SQL 命令

#### 2. DBeaver（免费，功能强大）
- **下载**: https://dbeaver.io/
- **特点**: 支持多种数据库，功能强大

**使用步骤:**
1. 下载并安装 DBeaver
2. 新建连接 → 选择 SQLite
3. 数据库路径选择 `backend/data/oa.db`
4. 连接后可以查看和操作数据库

#### 3. VS Code 扩展
- **扩展名**: SQLite Viewer 或 SQLite
- **安装**: 在 VS Code 扩展市场搜索安装
- **使用**: 右键点击 `.db` 文件选择查看

## 方法三：使用 Node.js 脚本

### 创建数据库操作脚本

创建 `backend/scripts/db-query.js`:

```javascript
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/oa.db');
const db = new Database(dbPath);

// 查询所有用户
function getAllUsers() {
  const stmt = db.prepare('SELECT id, username, email, created_at FROM users');
  return stmt.all();
}

// 查询所有消息
function getAllMessages() {
  const stmt = db.prepare(`
    SELECT 
      m.*,
      u1.username as sender_name,
      u2.username as receiver_name
    FROM messages m
    LEFT JOIN users u1 ON m.sender_id = u1.id
    LEFT JOIN users u2 ON m.receiver_id = u2.id
    ORDER BY m.created_at DESC
  `);
  return stmt.all();
}

// 执行
console.log('所有用户:');
console.table(getAllUsers());

console.log('\n所有消息:');
console.table(getAllMessages());

db.close();
```

**运行脚本:**
```bash
cd backend
node scripts/db-query.js
```

## 常用操作场景

### 1. 查看数据库文件大小
```bash
# Windows
dir backend\data\oa.db

# Linux/macOS
ls -lh backend/data/oa.db
```

### 2. 备份数据库
```bash
# Windows
copy backend\data\oa.db backend\data\oa_backup_$(date +%Y%m%d).db

# Linux/macOS
cp backend/data/oa.db backend/data/oa_backup_$(date +%Y%m%d).db
```

### 3. 恢复数据库
```bash
# Windows
copy backend\data\oa_backup_20240101.db backend\data\oa.db

# Linux/macOS
cp backend/data/oa_backup_20240101.db backend/data/oa.db
```

### 4. 重置数据库（清空所有数据）
```bash
# 停止后端服务
# 删除数据库文件
rm backend/data/oa.db  # Linux/macOS
del backend\data\oa.db  # Windows

# 重启后端服务，会自动创建新数据库
```

### 5. 导出数据为 CSV
```sql
.headers on
.mode csv
.output users.csv
SELECT * FROM users;
.output messages.csv
SELECT * FROM messages;
.quit
```

### 6. 导入数据
```sql
.mode csv
.import users.csv users
.import messages.csv messages
```

## 数据库维护

### 优化数据库
```sql
-- 压缩数据库
VACUUM;

-- 分析并优化
ANALYZE;
```

### 检查数据库完整性
```sql
PRAGMA integrity_check;
```

### 查看数据库信息
```sql
-- 查看数据库版本
SELECT sqlite_version();

-- 查看所有表
SELECT name FROM sqlite_master WHERE type='table';

-- 查看数据库文件信息
PRAGMA database_list;
```

## 注意事项

1. **操作前备份**: 在进行删除或修改操作前，建议先备份数据库
2. **停止服务**: 修改数据库时，建议先停止后端服务
3. **密码加密**: 用户密码是加密存储的，不能直接查看明文
4. **外键约束**: 删除用户前，需要先删除相关的消息记录
5. **时间格式**: 时间使用 ISO 8601 格式存储

## 快速参考

### 常用查询

```sql
-- 查看用户总数
SELECT COUNT(*) FROM users;

-- 查看消息总数
SELECT COUNT(*) FROM messages;

-- 查看最近注册的用户
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- 查看最近的消息
SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;

-- 查看未读消息
SELECT * FROM messages WHERE is_read = 0;

-- 查看在线用户
SELECT * FROM online_users;
```

### 常用修改

```sql
-- 更新用户邮箱
UPDATE users SET email = 'new@example.com' WHERE id = 1;

-- 标记消息为已读
UPDATE messages SET is_read = 1 WHERE id = 1;

-- 删除旧消息（30天前）
DELETE FROM messages WHERE created_at < datetime('now', '-30 days');
```

## 故障排除

### 数据库被锁定
如果遇到 "database is locked" 错误：
1. 确保后端服务已停止
2. 检查是否有其他程序正在使用数据库文件
3. 等待几秒后重试

### 数据库文件损坏
如果数据库文件损坏：
1. 尝试使用备份恢复
2. 使用 `PRAGMA integrity_check;` 检查
3. 如果无法修复，删除数据库文件，重启服务会自动重建

### 权限问题
如果无法访问数据库文件：
1. 检查文件权限
2. 确保有读写权限
3. Windows 下可能需要以管理员身份运行


