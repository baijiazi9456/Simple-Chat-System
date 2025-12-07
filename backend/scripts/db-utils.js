#!/usr/bin/env node

/**
 * 数据库工具脚本
 * 使用方法: node scripts/db-utils.js <command> [args]
 * 
 * 命令:
 *   list-users      - 列出所有用户
 *   list-messages   - 列出所有消息
 *   stats           - 显示统计信息
 *   backup          - 备份数据库
 *   reset           - 重置数据库（删除所有数据）
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/oa.db');

function getDb() {
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ 数据库文件不存在:', DB_PATH);
    process.exit(1);
  }
  return new Database(DB_PATH);
}

function listUsers() {
  const db = getDb();
  const stmt = db.prepare('SELECT id, username, email, created_at FROM users ORDER BY id');
  const users = stmt.all();
  
  console.log('\n📋 用户列表:');
  console.log('='.repeat(80));
  if (users.length === 0) {
    console.log('暂无用户');
  } else {
    console.table(users);
    console.log(`\n总计: ${users.length} 个用户`);
  }
  db.close();
}

function listMessages() {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      m.id,
      u1.username as sender,
      u2.username as receiver,
      m.content,
      m.created_at
    FROM messages m
    LEFT JOIN users u1 ON m.sender_id = u1.id
    LEFT JOIN users u2 ON m.receiver_id = u2.id
    ORDER BY m.created_at DESC
    LIMIT 50
  `);
  const messages = stmt.all();
  
  console.log('\n💬 消息列表（最近50条）:');
  console.log('='.repeat(80));
  if (messages.length === 0) {
    console.log('暂无消息');
  } else {
    messages.forEach(msg => {
      console.log(`[${msg.created_at}] ${msg.sender} → ${msg.receiver || '群聊'}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
    });
    console.log(`\n显示最近 ${messages.length} 条消息`);
  }
  db.close();
}

function showStats() {
  const db = getDb();
  
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages').get();
  const unreadCount = db.prepare('SELECT COUNT(*) as count FROM messages WHERE is_read = 0').get();
  
  const recentUsers = db.prepare(`
    SELECT username, created_at 
    FROM users 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();
  
  const topSenders = db.prepare(`
    SELECT 
      u.username,
      COUNT(m.id) as message_count
    FROM users u
    LEFT JOIN messages m ON u.id = m.sender_id
    GROUP BY u.id, u.username
    ORDER BY message_count DESC
    LIMIT 5
  `).all();
  
  console.log('\n📊 数据库统计信息:');
  console.log('='.repeat(80));
  console.log(`用户总数: ${userCount.count}`);
  console.log(`消息总数: ${messageCount.count}`);
  console.log(`未读消息: ${unreadCount.count}`);
  
  console.log('\n最近注册的用户:');
  if (recentUsers.length > 0) {
    console.table(recentUsers);
  } else {
    console.log('暂无用户');
  }
  
  console.log('\n消息发送排行榜:');
  if (topSenders.length > 0) {
    console.table(topSenders);
  } else {
    console.log('暂无消息');
  }
  
  // 数据库文件大小
  const stats = fs.statSync(DB_PATH);
  const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`\n数据库文件大小: ${fileSizeMB} MB`);
  
  db.close();
}

function backup() {
  const db = getDb();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = DB_PATH.replace('.db', `_backup_${timestamp}.db`);
  
  try {
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`✅ 数据库已备份到: ${backupPath}`);
    
    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`备份文件大小: ${fileSizeMB} MB`);
  } catch (error) {
    console.error('❌ 备份失败:', error.message);
    process.exit(1);
  }
  
  db.close();
}

function reset() {
  const db = getDb();
  
  console.log('⚠️  警告: 这将删除所有数据！');
  console.log('按 Ctrl+C 取消，或等待 3 秒后继续...');
  
  setTimeout(() => {
    try {
      db.exec('DELETE FROM messages');
      db.exec('DELETE FROM online_users');
      db.exec('DELETE FROM users');
      console.log('✅ 数据库已重置');
    } catch (error) {
      console.error('❌ 重置失败:', error.message);
      process.exit(1);
    }
    db.close();
  }, 3000);
}

// 主函数
const command = process.argv[2];

switch (command) {
  case 'list-users':
    listUsers();
    break;
  case 'list-messages':
    listMessages();
    break;
  case 'stats':
    showStats();
    break;
  case 'backup':
    backup();
    break;
  case 'reset':
    reset();
    break;
  default:
    console.log(`
数据库工具脚本

使用方法: node scripts/db-utils.js <command>

可用命令:
  list-users      - 列出所有用户
  list-messages   - 列出所有消息（最近50条）
  stats           - 显示统计信息
  backup          - 备份数据库
  reset           - 重置数据库（删除所有数据，危险操作！）

示例:
  node scripts/db-utils.js list-users
  node scripts/db-utils.js stats
  node scripts/db-utils.js backup
    `);
    process.exit(1);
}


