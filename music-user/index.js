// index.js

// 1. 환경변수 로드
require("dotenv").config();

const express = require("express");
const path = require("path");
const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 3000;

// 2. 공통 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views")); // views 위치 바꾸고 싶으면 사용

// 3. 인증 미들웨어
const authMiddleware = (req, res, next) => {
  try {
    console.log("--- [디버깅] 요청 헤더 ---");
    console.log("Authorization:", req.headers["authorization"]);
    console.log("------------------------");

    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "인증 토큰이 필요합니다." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { userId, email, nickname, iat, exp }
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "토큰이 만료되었습니다." });
    }
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
};

// 4. 홈 (테스트용)
app.get("/", (req, res) => {
  res.send("🎵 My Music API 서버가 실행 중입니다! 🎵");
});

// 5. 페이지 라우트 (EJS)
app.get("/register", (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    console.error("페이지 렌더링 오류:/register", error);
    res.status(500).send("페이지를 불러오는 데 실패했습니다.");
  }
});

// 6. 내 정보 조회 API  (JWT 필요)
app.get("/users/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await db.execute(
      "SELECT user_id, email, nickname, created_at, last_login_at FROM users WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    const user = rows[0];
    res.status(200).json({
      userId: user.user_id,
      email: user.email,
      nickname: user.nickname,
      joinedAt: user.created_at,
      lastLoginAt: user.last_login_at,
    });
  } catch (error) {
    console.error("내 정보 조회 오류:", error);
    res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
  }
});

// 7. 회원가입 API
app.post("/users/register", async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "이메일과 비밀번호는 필수입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      "INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)",
      [email, hashedPassword, nickname || null]
    );

    res.status(201).json({
      message: "✅ 회원가입 성공!",
      userId: result.insertId,
      email,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "이미 사용 중인 이메일입니다." });
    }
    console.error("회원가입 오류:", error);
    res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
  }
});

// 8. 로그인 API
app.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "이메일과 비밀번호를 입력하세요." });
    }

    const [rows] = await db.execute(
      "SELECT user_id, email, password_hash, nickname FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    const user = rows[0];
    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isPasswordMatch) {
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    if (!process.env.JWT_SECRET) {
      console.warn(
        "[경고] JWT_SECRET 이 .env 에 설정되어 있지 않습니다. 임시 키 사용 중."
      );
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        email: user.email,
        nickname: user.nickname,
      },
      process.env.JWT_SECRET || "dev-secret-key",
      { expiresIn: "1h" }
    );

    await db.execute(
      "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?",
      [user.user_id]
    );

    res.status(200).json({
      message: "✅ 로그인 성공!",
      token,
    });
  } catch (error) {
    console.error("로그인 오류:", error);
    res.status(500).json({ error: "서버 내부 오류가 발생했습니다." });
  }
});

// 9. 서버 시작
app.listen(port, () => {
  console.log(`✅ 서버가 http://localhost:${port} 에서 실행되었습니다.`);
});
