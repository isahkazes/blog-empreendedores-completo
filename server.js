const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { marked } = require('marked');

const app = express();
const PORT = 3000;
const db = new sqlite3.Database('blog.db');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'blog-secret', resave: false, saveUninitialized: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const upload = multer({ dest: 'uploads/' });

const requireAuth = (req, res, next) => {
  if (req.session.user) next();
  else res.status(401).json({ error: 'Authentication required' });
};

// API Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        req.session.user = { id: user.id, username: user.username, role: user.role };
        res.json({ message: 'Login successful', user: req.session.user });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logout successful' }));
});

app.get('/api/posts', (req, res) => {
  const { page = 1, limit = 10, status = 'published' } = req.query;
  const offset = (page - 1) * limit;
  db.all('SELECT p.*, u.username as author FROM posts p LEFT JOIN users u ON p.author_id = u.id WHERE p.status = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?',
    [status, parseInt(limit), parseInt(offset)], (err, posts) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ posts: posts.map(p => ({ ...p, content: marked(p.content || '') })) });
  });
});

app.get('/api/posts/:slug', (req, res) => {
  db.get('SELECT p.*, u.username as author FROM posts p LEFT JOIN users u ON p.author_id = u.id WHERE p.slug = ?',
    [req.params.slug], (err, post) => {
    if (err || !post) return res.status(404).json({ error: 'Post not found' });
    res.json({ ...post, content: marked(post.content || '') });
  });
});

app.post('/api/posts', requireAuth, upload.single('featured_image'), (req, res) => {
  const { title, content, excerpt, status, meta_title, meta_description, tags } = req.body;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const featured_image = req.file ? req.file.filename : null;
  
  db.run('INSERT INTO posts (title, slug, content, excerpt, featured_image, author_id, status, meta_title, meta_description, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, slug, content, excerpt, featured_image, req.session.user.id, status, meta_title, meta_description, tags],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to create post' });
      res.json({ message: 'Post created', id: this.lastID });
    });
});

app.get('/api/settings', (req, res) => {
  db.all('SELECT * FROM settings', (err, settings) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const obj = {};
    settings.forEach(s => obj[s.key] = s.value);
    res.json(obj);
  });
});

app.put('/api/settings', requireAuth, (req, res) => {
  const settings = req.body;
  const promises = Object.keys(settings).map(key => 
    new Promise((resolve, reject) => {
      db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, settings[key]], 
        err => err ? reject(err) : resolve());
    })
  );
  Promise.all(promises)
    .then(() => res.json({ message: 'Settings updated' }))
    .catch(() => res.status(500).json({ error: 'Failed to update' }));
});

app.get('/api/ads', (req, res) => {
  db.all('SELECT * FROM ads WHERE active = 1', (err, ads) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(ads);
  });
});

app.post('/api/ads', requireAuth, (req, res) => {
  const { title, content, position } = req.body;
  db.run('INSERT INTO ads (title, content, position) VALUES (?, ?, ?)', [title, content, position],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to create ad' });
      res.json({ message: 'Ad created', id: this.lastID });
    });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));