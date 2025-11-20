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
    const newEmail = 'newuser_' + Date.now() + '@example.com';
    const newPassword = 'MyPassword123!';

    console.log("=== Step 1: Register new user ===");
    console.log("Email:", newEmail);
    console.log("Password:", newPassword);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("Hashed password:", hashedPassword.substring(0, 30) + "...");

    const [regResult] = await pool.query(
      "INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, NULL)",
      [newEmail, hashedPassword]
    );
    console.log("✅ Registration successful! User ID:", regResult.insertId);

    console.log("\n=== Step 2: Login with registered credentials ===");
    
    const [loginRows] = await pool.query(
      "SELECT user_id, email, password_hash FROM users WHERE email = ?",
      [newEmail]
    );

    const user = loginRows[0];
    const isPasswordMatch = await bcrypt.compare(newPassword, user.password_hash);

    console.log("Password match:", isPasswordMatch);
    
    if (isPasswordMatch) {
      console.log("✅ Login successful!");
    } else {
      console.log("❌ Login failed!");
    }

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

test();
