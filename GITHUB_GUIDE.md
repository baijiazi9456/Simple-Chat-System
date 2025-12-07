# GitHub 上传指南

本指南将帮助您将 OA 系统项目上传到 GitHub。

## 前置准备

### 1. 安装 Git

如果还没有安装 Git，请先安装：

**Windows:**
- 下载: https://git-scm.com/download/win
- 安装后重启终端

**macOS:**
```bash
# 使用 Homebrew
brew install git

# 或下载安装包
# https://git-scm.com/download/mac
```

**Linux:**
```bash
sudo apt-get install git
```

### 2. 配置 Git（首次使用）

```bash
# 设置用户名
git config --global user.name "Your Name"

# 设置邮箱
git config --global user.email "your.email@example.com"

# 验证配置
git config --global --list
```

### 3. 创建 GitHub 账号

如果还没有 GitHub 账号：
1. 访问 https://github.com
2. 点击 "Sign up" 注册账号
3. 验证邮箱

## 步骤一：在 GitHub 上创建仓库

1. 登录 GitHub
2. 点击右上角的 **"+"** → **"New repository"**
3. 填写仓库信息：
   - **Repository name**: `oa-system` (或您喜欢的名称)
   - **Description**: `OA办公系统 - 基于React和Node.js的实时聊天系统`
   - **Visibility**: 选择 Public（公开）或 Private（私有）
   - **不要**勾选 "Initialize this repository with a README"（我们已经有了）
4. 点击 **"Create repository"**
5. 复制仓库地址（例如：`https://github.com/yourusername/oa-system.git`）

## 步骤二：初始化本地 Git 仓库

### 1. 打开终端，进入项目目录

```bash
cd d:\oa-system
```

### 2. 初始化 Git 仓库

```bash
git init
```

### 3. 检查文件状态

```bash
git status
```

您应该看到很多未跟踪的文件。

## 步骤三：添加文件到 Git

### 1. 添加所有文件

```bash
git add .
```

### 2. 检查将要提交的文件

```bash
git status
```

**重要检查项：**
- ✅ 确保 `.env` 文件**没有**被添加（应该在 .gitignore 中）
- ✅ 确保 `backend/data/oa.db` **没有**被添加
- ✅ 确保 `node_modules/` **没有**被添加

### 3. 提交文件

```bash
git commit -m "Initial commit: OA办公系统项目"
```

## 步骤四：连接到 GitHub 仓库

### 1. 添加远程仓库

```bash
# 替换为您的实际仓库地址
git remote add origin https://github.com/yourusername/oa-system.git
```

### 2. 验证远程仓库

```bash
git remote -v
```

应该显示：
```
origin  https://github.com/yourusername/oa-system.git (fetch)
origin  https://github.com/yourusername/oa-system.git (push)
```

## 步骤五：推送到 GitHub

### 1. 推送到主分支

```bash
git branch -M main
git push -u origin main
```

### 2. 输入 GitHub 凭证

- **用户名**: 您的 GitHub 用户名
- **密码**: 使用 Personal Access Token（不是 GitHub 密码）

#### 如何创建 Personal Access Token：

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 "Generate new token (classic)"
3. 填写信息：
   - **Note**: `OA System Project`
   - **Expiration**: 选择过期时间（建议 90 天或更长）
   - **Scopes**: 勾选 `repo`（完整仓库访问权限）
4. 点击 "Generate token"
5. **重要**: 立即复制 token（只显示一次）
6. 在 Git 提示输入密码时，粘贴这个 token

### 3. 验证上传

推送成功后，访问您的 GitHub 仓库页面，应该能看到所有文件。

## 步骤六：后续更新

当您修改代码后，使用以下命令更新 GitHub：

```bash
# 1. 查看修改的文件
git status

# 2. 添加修改的文件
git add .

# 3. 提交修改
git commit -m "描述您的修改内容"

# 4. 推送到 GitHub
git push
```

## 常见问题解决

### 问题 1: 推送被拒绝

**错误信息**: `error: failed to push some refs`

**解决方法**:
```bash
# 先拉取远程更改
git pull origin main --allow-unrelated-histories

# 解决冲突后再次推送
git push
```

### 问题 2: 忘记添加 .gitignore

如果已经提交了敏感文件（如 `.env` 或数据库文件）：

```bash
# 从 Git 中删除但保留本地文件
git rm --cached backend/.env
git rm --cached backend/data/oa.db

# 提交删除
git commit -m "Remove sensitive files from Git"

# 推送到 GitHub
git push
```

### 问题 3: 需要更新 .gitignore

```bash
# 编辑 .gitignore 文件
# 然后执行
git add .gitignore
git commit -m "Update .gitignore"
git push
```

### 问题 4: 撤销最后一次提交

```bash
# 撤销提交但保留修改
git reset --soft HEAD~1

# 或完全撤销（会丢失修改）
git reset --hard HEAD~1
```

## 安全检查清单

在上传前，请确认：

- [ ] `.env` 文件没有被提交
- [ ] 数据库文件（`.db`）没有被提交
- [ ] `node_modules/` 没有被提交
- [ ] 没有硬编码的密码或密钥
- [ ] `JWT_SECRET` 在代码中使用环境变量
- [ ] 敏感信息都在 `.env` 文件中

## 推荐的仓库结构

上传后，您的 GitHub 仓库应该包含：

```
oa-system/
├── .gitignore              ✅
├── README.md               ✅
├── DATABASE.md             ✅
├── QUICKSTART.md           ✅
├── GITHUB_GUIDE.md         ✅
├── backend/
│   ├── .gitignore          ✅
│   ├── package.json        ✅
│   ├── tsconfig.json       ✅
│   ├── env.example         ✅ (不是 .env)
│   ├── src/                ✅
│   └── scripts/            ✅
├── frontend/
│   ├── .gitignore          ✅
│   ├── package.json        ✅
│   ├── vite.config.ts      ✅
│   └── src/                ✅
└── (不包含 node_modules, .env, *.db) ❌
```

## 使用 SSH 密钥（可选，更安全）

### 1. 生成 SSH 密钥

```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
```

按 Enter 使用默认路径，设置密码（可选）。

### 2. 添加 SSH 密钥到 GitHub

```bash
# Windows
type %USERPROFILE%\.ssh\id_ed25519.pub

# Linux/macOS
cat ~/.ssh/id_ed25519.pub
```

复制输出的内容，然后：
1. GitHub → Settings → SSH and GPG keys
2. 点击 "New SSH key"
3. 粘贴密钥内容
4. 点击 "Add SSH key"

### 3. 使用 SSH 地址

```bash
# 删除 HTTPS 远程地址
git remote remove origin

# 添加 SSH 地址
git remote add origin git@github.com:yourusername/oa-system.git

# 推送
git push -u origin main
```

## 添加 GitHub Actions（可选）

可以添加自动化的 CI/CD，创建 `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install backend dependencies
      run: |
        cd backend
        npm install
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm install
    
    - name: Build backend
      run: |
        cd backend
        npm run build
    
    - name: Build frontend
      run: |
        cd frontend
        npm run build
```

## 总结

完成以上步骤后，您的项目就已经成功上传到 GitHub 了！

**快速命令总结：**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/oa-system.git
git branch -M main
git push -u origin main
```

**后续更新：**
```bash
git add .
git commit -m "Update: 描述修改内容"
git push
```

祝您使用愉快！🎉


