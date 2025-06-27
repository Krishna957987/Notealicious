// database.js
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('users.db', (err) => {
    if (err) {
        console.error('❌ Failed to connect to database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database.');
    }
});

// Create table if it doesn't exist
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
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT NOT NULL
  )
`);

// Create a course_files table
db.run(`
  CREATE TABLE IF NOT EXISTS course_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    originalname TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    path TEXT NOT NULL,
    FOREIGN KEY(course_id) REFERENCES courses(id)
  )
`);

module.exports = db;
