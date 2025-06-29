const express   = require('express');
const bodyParser= require('body-parser');
const cors      = require('cors');
const path      = require('path');
const bcrypt    = require('bcrypt');
const multer    = require('multer');
const db        = require('./database');


const app       = express();
const PORT      = 3000;
const SALT_ROUNDS = 10;

// Configure multer for uploads
const upload = multer({
  dest: path.join(__dirname, 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max per file
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// ─── AUTH ROUTES ──────────────────────────────────────────

// Register
app.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const stmt = db.prepare(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)'
    );
    stmt.run([email, hashedPassword, role], function(err) {
      if (err) {
        console.error('DB Insert Error:', err.message);
        return res.status(400).json({ error: 'Email already exists.' });
      }
      res.json({ success: true, userId: this.lastID });
    });
  } catch (err) {
    console.error('Hashing Error:', err.message);
    res.status(500).json({ error: 'Internal error during registration.' });
  }
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('DB Query Error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    res.json({ success: true, user });
  });
});

// ─── COURSE CREATION ROUTE ─────

app.post(
  '/courses',
  upload.array('files', 5),
  (req, res) => {
    const { title, topic, description } = req.body;
    const files = req.files; // array of { filename, originalname, mimetype, path, ... }

    if (!title || !topic || !description) {
      return res.status(400).json({ error: 'Title, topic and description are required.' });
    }

    // 1) Insert course metadata
    const courseStmt = db.prepare(
      `INSERT INTO courses (title, topic, description) VALUES (?, ?, ?)`
    ); 
    courseStmt.run([title, topic, description], function(err) {
      if (err) {
        console.error('DB Insert Course Error:', err.message);
        return res.status(500).json({ error: 'Could not create course.' });
      }
      const courseId = this.lastID;

      // 2) Insert file metadata (if any)
      if (files && files.length) {
        const fileStmt = db.prepare(
          `INSERT INTO course_files (course_id, filename, originalname, mimetype, path)
           VALUES (?, ?, ?, ?, ?)`
        );
        for (const f of files) {
          fileStmt.run([
            courseId,
            f.filename,
            f.originalname,
            f.mimetype,
            f.path
          ]);
        }
      }

      console.log('New course created:', { courseId, title, topic, files });
      res.json({ success: true, courseId });
    });
  }
);

app.get('/courses', (req, res) => {
  db.all(`SELECT * FROM courses ORDER BY id DESC`, [], async (err, courses) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    const enrichedCourses = await Promise.all(
      courses.map(course => {
        return new Promise((resolve, reject) => {
          db.all(`SELECT * FROM course_files WHERE course_id = ?`, [course.id], (err, files) => {
            if (err) return reject(err);

            const filesProcessed = files.map(file => ({
              filename: file.filename,  
              originalname: file.originalname,
              mimetype: file.mimetype,
              path: file.path
            }));

            resolve({ ...course, files: filesProcessed });
          });
        });
      })
    );

    res.json({ success: true, courses: enrichedCourses });
  });
});

app.listen(PORT, () => {
  console.log(`🔐 Server running at http://localhost:${PORT}`);
});