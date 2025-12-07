import db from './database';
import bcrypt from 'bcrypt';

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPublic {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  created_at: string;
}

export class UserModel {
  static async create(username: string, email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(username, email, hashedPassword);
    
    return this.findById(result.lastInsertRowid as number) as User;
  }

  static findById(id: number): UserPublic | null {
    const stmt = db.prepare('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?');
    const user = stmt.get(id) as UserPublic | undefined;
    return user || null;
  }

  static findByUsername(username: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as User | undefined;
    return user || null;
  }

  static findByEmail(email: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as User | undefined;
    return user || null;
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  static getAllUsers(): UserPublic[] {
    const stmt = db.prepare('SELECT id, username, email, avatar, created_at FROM users');
    return stmt.all() as UserPublic[];
  }

  static updateAvatar(userId: number, avatar: string): void {
    const stmt = db.prepare('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    stmt.run(avatar, userId);
  }
}




