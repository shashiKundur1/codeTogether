import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, 'editor.db'));

export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create rooms table
      db.run(`
        CREATE TABLE IF NOT EXISTS rooms (
          id TEXT PRIMARY KEY,
          name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT,
          room_id TEXT,
          color TEXT,
          cursor_line INTEGER DEFAULT 0,
          cursor_column INTEGER DEFAULT 0,
          last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (room_id) REFERENCES rooms(id)
        )
      `);

      // Create code_snapshots table
      db.run(`
        CREATE TABLE IF NOT EXISTS code_snapshots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          room_id TEXT,
          content TEXT,
          language TEXT DEFAULT 'javascript',
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (room_id) REFERENCES rooms(id)
        )
      `, (err) => {
        if (err) {
          console.error('Database initialization error:', err);
          reject(err);
        } else {
          console.log('✅ Database initialized successfully');
          resolve();
        }
      });
    });
  });
};

export const saveRoom = (roomId, roomName = 'Untitled Room') => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR IGNORE INTO rooms (id, name) VALUES (?, ?)',
      [roomId, roomName],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

export const saveCodeSnapshot = (roomId, content, language = 'javascript') => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO code_snapshots (room_id, content, language) VALUES (?, ?, ?)',
      [roomId, content, language],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

export const getCodeSnapshot = (roomId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM code_snapshots WHERE room_id = ? ORDER BY updated_at DESC LIMIT 1',
      [roomId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

export const updateUserCursor = (username, roomId, line, column) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET cursor_line = ?, cursor_column = ?, last_active = CURRENT_TIMESTAMP 
       WHERE username = ? AND room_id = ?`,
      [line, column, username, roomId],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

export const addUser = (username, roomId, color) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO users (username, room_id, color) VALUES (?, ?, ?)',
      [username, roomId, color],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

export const removeUser = (username, roomId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM users WHERE username = ? AND room_id = ?',
      [username, roomId],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

export const getRoomUsers = (roomId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT username, color, cursor_line, cursor_column FROM users WHERE room_id = ? ORDER BY last_active DESC',
      [roomId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

export { db };