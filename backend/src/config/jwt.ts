// 统一的JWT密钥配置
// 注意：此文件被导入时，dotenv.config()应该已经在server.ts中执行
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 在启动时验证JWT_SECRET
if (process.env.NODE_ENV !== 'production' && JWT_SECRET === 'your-secret-key-change-in-production') {
  console.warn('⚠️  警告: 使用默认JWT_SECRET，生产环境请设置环境变量');
}

// 延迟日志输出，确保在server.ts中dotenv.config()执行后再输出
if (typeof process !== 'undefined' && process.env) {
  console.log(`🔑 JWT_SECRET已加载: ${JWT_SECRET.substring(0, 10)}... (长度: ${JWT_SECRET.length})`);
}

