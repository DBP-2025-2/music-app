import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'centerbeam.proxy.rlwy.net',
  port: 27266,
  user: 'root',
  password: 'suuhiJlrhOqtdTaMPKaVEaAKeIqUrUNb',
  database: 'railway',
});

async function reset() {
  try {
    console.log("=== Resetting users table ===");
    
    // Foreign key constraint 비활성화
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");
    
    // users 테이블 비우기
    const [delResult] = await pool.query("DELETE FROM users");
    console.log("✅ Deleted users:", delResult.affectedRows);
    
    // Auto increment 초기화
    await pool.query("ALTER TABLE users AUTO_INCREMENT = 1");
    console.log("✅ Reset AUTO_INCREMENT");
    
    // Foreign key constraint 활성화
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");
    
    console.log("✅ Users table reset complete!");

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await pool.end();
  }
}

reset();
