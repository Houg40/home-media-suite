const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'media.sqlite');
const db = new sqlite3.Database(DB_PATH);

function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Media items table
      db.run(`
        CREATE TABLE IF NOT EXISTS media_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          filepath TEXT UNIQUE NOT NULL,
          filename TEXT NOT NULL,
          filesize INTEGER DEFAULT 0,
          duration REAL DEFAULT 0,
          width INTEGER DEFAULT 0,
          height INTEGER DEFAULT 0,
          codec TEXT,
          container TEXT,
          bitrate INTEGER DEFAULT 0,
          artist TEXT,
          album TEXT,
          year TEXT,
          genre TEXT,
          thumbnail_path TEXT,
          is_favorite INTEGER DEFAULT 0,
          folder_id INTEGER,
          folder_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Migrations for existing DBs
      db.run("ALTER TABLE media_items ADD COLUMN folder_id INTEGER", () => {});
      db.run("ALTER TABLE media_items ADD COLUMN folder_name TEXT", () => {});

      // Watch & playback progress table
      db.run(`
        CREATE TABLE IF NOT EXISTS watch_progress (
          media_id INTEGER PRIMARY KEY,
          position_seconds REAL DEFAULT 0,
          duration_seconds REAL DEFAULT 0,
          completed INTEGER DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (media_id) REFERENCES media_items(id) ON DELETE CASCADE
        )
      `);

      // Library folders table
      db.run(`
        CREATE TABLE IF NOT EXISTS library_folders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          path TEXT UNIQUE NOT NULL,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          is_enabled INTEGER DEFAULT 1,
          last_scanned DATETIME
        )
      `, () => {
        db.run("ALTER TABLE library_folders ADD COLUMN is_enabled INTEGER DEFAULT 1", () => {});
        resolve(db);
      });
    });
  });
}

// Helpers for async query execution
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

module.exports = {
  db,
  initDb,
  run,
  get,
  all
};
