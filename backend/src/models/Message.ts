import db from './database';

export interface Message {
  id: number;
  sender_id: number;
  receiver_id?: number;
  content: string;
  room_id?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  is_read: number;
  created_at: string;
}

export interface MessageWithUser extends Message {
  sender_username: string;
  sender_avatar?: string;
}

export class MessageModel {
  static create(
    senderId: number, 
    content: string, 
    receiverId?: number, 
    roomId?: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string,
    fileSize?: number
  ): Message {
    const stmt = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, content, room_id, file_url, file_name, file_type, file_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      senderId, 
      receiverId || null, 
      content, 
      roomId || null,
      fileUrl || null,
      fileName || null,
      fileType || null,
      fileSize || null
    );
    
    return this.findById(result.lastInsertRowid as number) as Message;
  }

  static findById(id: number): Message | null {
    const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
    const message = stmt.get(id) as Message | undefined;
    return message || null;
  }

  static getMessagesByRoom(roomId: string, limit: number = 50): MessageWithUser[] {
    const stmt = db.prepare(`
      SELECT m.*, u.username as sender_username, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.room_id = ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `);
    
    const messages = stmt.all(roomId, limit) as MessageWithUser[];
    return messages.reverse(); // 按时间正序返回
  }

  static getPrivateMessages(userId1: number, userId2: number, limit: number = 50): MessageWithUser[] {
    const stmt = db.prepare(`
      SELECT m.*, u.username as sender_username, u.avatar as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at DESC
      LIMIT ?
    `);
    
    const messages = stmt.all(userId1, userId2, userId2, userId1, limit) as MessageWithUser[];
    return messages.reverse();
  }

  static markAsRead(messageIds: number[]): void {
    const stmt = db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?');
    const updateMany = db.transaction((ids: number[]) => {
      for (const id of ids) {
        stmt.run(id);
      }
    });
    updateMany(messageIds);
  }
}



