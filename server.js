const express = require('express');
const bodyParser = require('body-parser');
const cors= require('cors');
const path= require('path');
const bcrypt= require('bcrypt');
const multer= require('multer');
const db= require('./database');


const app= express();
const PORT= 3000;
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



app.post(
  '/courses',
  upload.array('files', 5),
  (req, res) => {
    const { title, topic, description } = req.body;
    const files = req.files; 

    if (!title || !topic || !description) {
      return res.status(400).json({ error: 'Title, topic and description are required.' });
    }

  
    const courseStmt = db.prepare(
      `INSERT INTO courses (title, topic, description) VALUES (?, ?, ?)`
    ); 
    courseStmt.run([title, topic, description], function(err) {
      if (err) {
        console.error('DB Insert Course Error:', err.message);
        return res.status(500).json({ error: 'Could not create course.' });
      }
      const courseId = this.lastID;


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

    app.get('/submissions', (req, res) => {
      const query = `
        SELECT submissions.*, courses.title AS courseTitle, courses.description, courses.topic
        FROM submissions
        JOIN courses ON submissions.course_id = courses.id
        ORDER BY submissions.id DESC
      `;

      db.all(query, [], (err, rows) => {
        if (err) {
          console.error('Submission fetch error:', err.message);
          return res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
        }
        res.json({ success: true, submissions: rows });
      });
    });

    res.json({ success: true, courses: enrichedCourses });
  });
});

app.post('/submit', upload.single('response'), (req, res) => {
  const { courseId } = req.body;
  const file = req.file;

  if (!courseId || !file) {
    return res.status(400).json({ error: 'Missing course ID or file.' });
  }

  const stmt = db.prepare(`
    INSERT INTO submissions (course_id, filename, originalname, mimetype, path)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    [courseId, file.filename, file.originalname, file.mimetype, file.path],
    function (err) {
      if (err) {
        console.error('Submission insert error:', err.message);
        return res.status(500).json({ error: 'Could not save submission.' });
      }

      res.json({ success: true, submissionId: this.lastID });
    }
  );
});

app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});

app.post('/submissions', upload.single('response'), (req, res) => {
  const { courseId } = req.body;
  const file = req.file;

  if (!courseId || !file) {
    return res.status(400).json({ error: 'Missing course ID or file.' });
  }

  const stmt = db.prepare(`
    INSERT INTO submissions (course_id, filename, originalname, mimetype, path)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    [courseId, file.filename, file.originalname, file.mimetype, file.path],
    function (err) {
      if (err) {
        console.error('Submission insert error:', err.message);
        return res.status(500).json({ error: 'Could not save submission.' });
      }

      res.json({ success: true, submissionId: this.lastID });
    }
  );
});

app.post('/submissions/:id/mark', (req, res) => {
  const submissionId = req.params.id;
  const { mark } = req.body;

  const stmt = db.prepare('UPDATE submissions SET mark = ? WHERE id = ?');
  stmt.run([mark, submissionId], function(err) {
    if (err) {
      console.error('Mark update error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to mark submission' });
    }
    res.json({ success: true });
  });
});

app.delete('/submissions/:id', (req, res) => {
  const submissionId = req.params.id;

  const stmt = db.prepare('DELETE FROM submissions WHERE id = ?');
  stmt.run([submissionId], function(err) {
    if (err) {
      console.error('Delete error:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to delete submission' });
    }
    res.json({ success: true });
  });
});

app.post('/skip-course', (req, res) => {
  const { userId, courseId } = req.body;
  if (!userId || !courseId) return res.status(400).json({ error: 'Missing userId or courseId' });

  const stmt = db.prepare('INSERT OR IGNORE INTO skipped_courses (user_id, course_id) VALUES (?, ?)');
  stmt.run([userId, courseId], function(err) {
    if (err) {
      console.error('Error skipping course:', err);
      return res.status(500).json({ error: 'Could not skip course' });
    }
    res.json({ success: true });
  });
});

// Modify courses fetch to exclude skipped courses for a user
app.get('/courses/:userId', (req, res) => {
  const userId = req.params.userId;
  db.all(
    `SELECT * FROM courses WHERE id NOT IN (
       SELECT course_id FROM skipped_courses WHERE user_id = ?
     ) ORDER BY id DESC`,
    [userId],
    async (err, courses) => {
      if (err) return res.status(500).json({ success: false, error: err.message });

      const enrichedCourses = await Promise.all(
        courses.map(course => new Promise((resolve, reject) => {
          db.all(`SELECT * FROM course_files WHERE course_id = ?`, [course.id], (err, files) => {
            if (err) return reject(err);
            const filesProcessed = files.map(f => ({
              filename: f.filename,
              originalname: f.originalname,
              mimetype: f.mimetype,
              path: f.path
            }));
            resolve({ ...course, files: filesProcessed });
          });
        }))
      );

      res.json({ success: true, courses: enrichedCourses });
    }
  );
});
