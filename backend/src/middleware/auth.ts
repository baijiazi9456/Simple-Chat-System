import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';

export interface AuthRequest extends Request {
  userId?: number;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('❌ 认证失败: 未提供token');
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const secret = JWT_SECRET;
  
  try {
    const decoded = jwt.verify(token, secret) as any;
    req.userId = decoded.userId;
    console.log(`✅ 认证成功: 用户ID ${decoded.userId}, 用户名 ${decoded.username}`);
    next();
  } catch (err: any) {
    console.error('❌ Token验证失败:', err.message);
    console.error('Token前20字符:', token.substring(0, 20) + '...');
    console.error('Token长度:', token.length);
    console.error('使用的JWT_SECRET前10字符:', secret.substring(0, 10) + '...');
    console.error('JWT_SECRET长度:', secret.length);
    console.error('错误类型:', err.name);
    return res.status(403).json({ 
      error: '无效的认证令牌',
      details: err.message 
    });
  }
}



