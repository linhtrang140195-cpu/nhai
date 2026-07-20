const mysql = require('mysql2/promise');

const DATABASE_URL = process.env.DATABASE_URL || '';

const pool = mysql.createPool(DATABASE_URL || {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nhai_day'
});

module.exports = pool;
