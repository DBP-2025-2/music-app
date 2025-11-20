import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const pool = mysql.createPool({
  host: 'centerbeam.proxy.rlwy.net',
  port: 27266,
  user: 'root',
  password: 'suuhiJlrhOqtdTaMPKaVEaAKeIqUrUNb',
  database: 'railway',
});

async function test() {
  try {
    const testEmail = 'test@example.com';
    const testPassword = 'password123';

    console.log("=== Testing login flow ===");
    
    // 1. 기존 사용자 조회
    const [rows] = await pool.query(
      "SELECT user_id, email, password_hash FROM users WHERE email = ?",
      [testEmail]
    );

    if (rows.length === 0) {
      console.log("User not found");
      return;
    }

    const user = rows[0];
    console.log("Found user:", user.user_id, user.email);
    console.log("Password hash in DB:", user.password_hash.substring(0, 20) + "...");

    // 2. 비밀번호 비교
    const isMatch = await bcrypt.compare(testPassword, user.password_hash);
    console.log("\nPassword match result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password does not match!");
      console.log("This is why login fails!");
    }

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

test();
