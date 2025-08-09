const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('blog.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE, email TEXT UNIQUE, password TEXT, role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT, slug TEXT UNIQUE, content TEXT, excerpt TEXT, featured_image TEXT,
    author_id INTEGER, status TEXT DEFAULT 'draft', meta_title TEXT, meta_description TEXT,
    tags TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE, value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  
  db.run(`CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, position TEXT,
    active BOOLEAN DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  // Default data
  db.run(`INSERT OR IGNORE INTO users (username, email, password, role) VALUES 
    ('admin', 'admin@blog.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')`);
  
  db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('site_title', 'Entrepreneur Digital Solutions Blog'),
    ('site_description', 'Expert insights on digital marketing and business growth'),
    ('home_hero_title', 'Transform Your Business with Digital Solutions')`);
  
  console.log('Database setup completed!');
});
db.close();