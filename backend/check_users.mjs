import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'centerbeam.proxy.rlwy.net',
  port: 27266,
  user: 'root',
  password: 'suuhiJlrhOqtdTaMPKaVEaAKeIqUrUNb',
  database: 'railway',
});

async function check() {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) as count FROM users");
    console.log("Total users:", rows[0].count);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

check();
