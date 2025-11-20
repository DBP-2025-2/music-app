import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const pool = mysql.createPool({
  host: 'centerbeam.proxy.rlwy.net',
  port: 27266,
  user: 'root',
  password: 'suuhiJlrhOqtdTaMPKaVEaAKeIqUrUNb',
  database: 'railway',
});

async function testFlow() {
  try {
    const testEmail = 'testuser_' + Date.now() + '@example.com';
    const testPassword = 'TestPassword123!';
    const testNickname = 'TestUser_' + Date.now();

    console.log("╔════════════════════════════════════════╗");
    console.log("║       FULL AUTH FLOW TEST             ║");
    console.log("╚════════════════════════════════════════╝");

    // ============ STEP 1: REGISTER ============
    console.log("\n[Step 1] REGISTER");
    console.log("Email:", testEmail);
    console.log("Password:", testPassword);
    console.log("Nickname:", testNickname);

    const hashedPassword = await bcrypt.hash(testPassword, 10);
    console.log("✓ Password hashed (rounds: 10)");

    const [regResult] = await pool.query(
      "INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)",
      [testEmail, hashedPassword, testNickname]
    );
    console.log("✅ Registration successful!");
    console.log("   User ID:", regResult.insertId);
    console.log("   Hash preview:", hashedPassword.substring(0, 20) + "...");

    // ============ STEP 2: LOGIN ============
    console.log("\n[Step 2] LOGIN");

    const [loginRows] = await pool.query(
      "SELECT user_id, email, password_hash, nickname FROM users WHERE email = ?",
      [testEmail]
    );

    if (loginRows.length === 0) {
      console.log("❌ User not found in DB!");
      return;
    }

    const user = loginRows[0];
    console.log("✓ User found in DB");
    console.log("   User ID:", user.user_id);
    console.log("   Email:", user.email);

    const isPasswordMatch = await bcrypt.compare(testPassword, user.password_hash);
    console.log("✓ Password comparison result:", isPasswordMatch);

    if (!isPasswordMatch) {
      console.log("❌ Password does NOT match!");
      console.log("   Stored hash:", user.password_hash.substring(0, 30));
      console.log("   Input password:", testPassword);
      return;
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        nickname: user.nickname,
      },
      'dev-secret-key',
      { expiresIn: '1h' }
    );

    console.log("✅ Login successful!");
    console.log("   Token:", token.substring(0, 30) + "...");

    // ============ STEP 3: VERIFY TOKEN ============
    console.log("\n[Step 3] VERIFY TOKEN");

    const decoded = jwt.verify(token, 'dev-secret-key');
    console.log("✅ Token verified!");
    console.log("   User ID:", decoded.userId);
    console.log("   Email:", decoded.email);

    console.log("\n╔════════════════════════════════════════╗");
    console.log("║     ✅ ALL TESTS PASSED!             ║");
    console.log("╚════════════════════════════════════════╝");

  } catch (err) {
    console.error("\n❌ ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

testFlow();
