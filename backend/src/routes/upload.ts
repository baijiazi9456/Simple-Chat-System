import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 文件过滤器
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 允许图片和常见文件类型
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型: ' + file.mimetype));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 限制
  }
});

// 文件上传接口
router.post('/file', authenticateToken, upload.single('file'), (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      file: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error: any) {
    console.error('文件上传错误:', error);
    res.status(500).json({ error: '文件上传失败: ' + error.message });
  }
});

// 多文件上传接口
router.post('/files', authenticateToken, upload.array('files', 10), (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const files = (req.files as Express.Multer.File[]).map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }));

    res.json({
      success: true,
      files
    });
  } catch (error: any) {
    console.error('文件上传错误:', error);
    res.status(500).json({ error: '文件上传失败: ' + error.message });
  }
});

// 获取文件（用于下载）
router.get('/file/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    res.sendFile(filePath);
  } catch (error: any) {
    console.error('文件获取错误:', error);
    res.status(500).json({ error: '文件获取失败' });
  }
});

export default router;

