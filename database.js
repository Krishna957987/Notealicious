// database.js
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('users.db', (err) => {
    if (err) {
        console.error('Failed to connect to database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
    }
});


db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
    )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    topic TEXT,
    description TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS course_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    filename TEXT,
    originalname TEXT,
    mimetype TEXT,
    path TEXT,
    FOREIGN KEY(course_id) REFERENCES courses(id)
  )
`);
console.log('creating submissions table')
db.run(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER,
    filename TEXT,
    originalname TEXT,
    mimetype TEXT,
    path TEXT,
    mark TEXT DEFAULT NULL,
    FOREIGN KEY(course_id) REFERENCES courses(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS skipped_courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  UNIQUE(user_id, course_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(course_id) REFERENCES courses(id)
);`)





module.exports = db;
