const mysql = require('mysql2/promise');

const DATABASE_URL = process.env.DATABASE_URL || '';

// dateStrings: true makes mysql2 return DATE/DATETIME/TIMESTAMP columns as plain
// strings (e.g. "2026-07-31", "2026-07-20 08:47:34") instead of JS Date objects —
// matching what PostgREST returned and what the frontend's date-parsing code expects.
// Without this, JSON.stringify(Date) turns a DATE column into a full ISO datetime,
// and code that concatenates its own time suffix onto the string breaks.
const pool = DATABASE_URL
  ? mysql.createPool({ uri: DATABASE_URL, dateStrings: true })
  : mysql.createPool({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'nhai_day',
      dateStrings: true
    });

module.exports = pool;
