import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const pool = mysql.createPool({
  host: 'centerbeam.proxy.rlwy.net',
  port: 27266,
  user: 'root',
  password: 'suuhiJlrhOqtdTaMPKaVEaAKeIqUrUNb',
  database: 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function test() {
  try {
    console.log("=== Connecting to database ===");
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM users");
    console.log("Total users:", rows[0]);

    console.log("\n=== All users ===");
    const [allUsers] = await pool.query("SELECT user_id, email, nickname FROM users");
    allUsers.forEach(u => console.log(u));

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

test();
