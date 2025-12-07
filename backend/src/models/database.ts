import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './data/oa.db';

// 确保数据目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);

export function initDatabase() {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 消息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER,
      content TEXT NOT NULL,
      room_id TEXT,
      file_url TEXT,
      file_name TEXT,
      file_type TEXT,
      file_size INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    )
  `);

  // 如果表已存在但没有新字段，添加新字段
  try {
    db.exec(`ALTER TABLE messages ADD COLUMN file_url TEXT`);
  } catch (e: any) {
    // 字段已存在，忽略错误
  }
  try {
    db.exec(`ALTER TABLE messages ADD COLUMN file_name TEXT`);
  } catch (e: any) {
    // 字段已存在，忽略错误
  }
  try {
    db.exec(`ALTER TABLE messages ADD COLUMN file_type TEXT`);
  } catch (e: any) {
    // 字段已存在，忽略错误
  }
  try {
    db.exec(`ALTER TABLE messages ADD COLUMN file_size INTEGER`);
  } catch (e: any) {
    // 字段已存在，忽略错误
  }

  // 在线用户表（用于跟踪在线状态）
  db.exec(`
    CREATE TABLE IF NOT EXISTS online_users (
      user_id INTEGER PRIMARY KEY,
      socket_id TEXT NOT NULL,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('✅ 数据库初始化完成');
}

export default db;



