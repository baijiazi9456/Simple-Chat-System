import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, User } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { JWT_SECRET } from '../config/jwt';

const router = express.Router();

// 注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: '请提供用户名、邮箱和密码' });
    }

    // 检查用户名是否已存在
    if (UserModel.findByUsername(username)) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    // 检查邮箱是否已存在
    if (UserModel.findByEmail(email)) {
      return res.status(400).json({ error: '邮箱已被注册' });
    }

    // 创建用户
    const user = await UserModel.create(username, email, password);

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log(`✅ 注册成功: 用户ID ${user.id}, 用户名 ${user.username}`);
    console.log(`🔑 使用的JWT_SECRET: ${JWT_SECRET.substring(0, 10)}...`);

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error: any) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

// 登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '请提供用户名和密码' });
    }

    // 查找用户（支持用户名或邮箱登录）
    const user = UserModel.findByUsername(username) || UserModel.findByEmail(username);

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const isValid = await UserModel.verifyPassword(user, password);
    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成 JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log(`✅ 登录成功: 用户ID ${user.id}, 用户名 ${user.username}`);
    console.log(`🔑 使用的JWT_SECRET: ${JWT_SECRET.substring(0, 10)}...`);

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error: any) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

// 获取当前用户信息
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const user = UserModel.findById(req.userId!);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json(user);
});

// 获取所有用户列表
router.get('/users', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const users = UserModel.getAllUsers();
    console.log(`获取用户列表请求，返回 ${users.length} 个用户`);
    res.json(users);
  } catch (error: any) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

export default router;



