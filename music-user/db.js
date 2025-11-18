// db.js
const mysql = require('mysql2/promise');

// 1. (추가) .env 파일을 읽어오는 설정
require('dotenv').config();

// 2. (수정) DB 정보를 'process.env'에서 불러오도록 변경
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;