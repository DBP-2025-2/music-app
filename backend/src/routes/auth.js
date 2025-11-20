// backend/src/routes/auth.js
import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as db from "../store/db.mysql.js";

const router = Router();

// 인증 미들웨어
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "인증 토큰이 필요합니다." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-key"
    );

    req.user = decoded; // { userId, email, nickname, iat, exp }
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "토큰이 만료되었습니다." });
    }
    return res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
};

// 내 정보 조회 API (JWT 필요)
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const [rows] = await db.pool.query(
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
    next(error);
  }
});

// 회원가입 API
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, nickname } = req.body;

    console.log("[REGISTER] 요청 받음:", {
      email,
      password: password ? "***" : "없음",
      nickname,
    });

    if (!email || !password) {
      console.log("[REGISTER] ❌ 이메일 또는 비밀번호 없음");
      return res.status(400).json({ error: "이메일과 비밀번호는 필수입니다." });
    }

    // 비밀번호 해싱
    console.log("[REGISTER] 비밀번호 해싱 중...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("[REGISTER] 해시 완료:", hashedPassword.substring(0, 20));

    const [result] = await db.pool.query(
      "INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)",
      [email, hashedPassword, nickname || null]
    );

    console.log("[REGISTER] ✅ 회원가입 성공, user_id:", result.insertId);

    res.status(201).json({
      message: "✅ 회원가입 성공!",
      userId: result.insertId,
      email,
    });
  } catch (error) {
    console.error("[REGISTER] ❌ 에러:", error.message);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "이미 사용 중인 이메일입니다." });
    }
    next(error);
  }
});

// 로그인 API
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log("[LOGIN] 요청 받음:", {
      email,
      password: password ? "***" : "없음",
    });

    if (!email || !password) {
      console.log("[LOGIN] ❌ 이메일 또는 비밀번호 없음");
      return res.status(400).json({ error: "이메일과 비밀번호를 입력하세요." });
    }

    const [rows] = await db.pool.query(
      "SELECT user_id, email, password_hash, nickname FROM users WHERE email = ?",
      [email]
    );

    console.log("[LOGIN] DB 조회 결과:", rows.length, "명");
    if (rows.length === 0) {
      console.log("[LOGIN] ❌ 사용자 없음:", email);
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 잘못되었습니다." });
    }

    const user = rows[0];
    console.log("[LOGIN] 사용자 찾음:", user.user_id, user.email);
    console.log("[LOGIN] DB 해시 시작:", user.password_hash.substring(0, 20));

    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    console.log("[LOGIN] 비밀번호 매칭 결과:", isPasswordMatch);

    if (!isPasswordMatch) {
      console.log("[LOGIN] ❌ 비밀번호 불일치");
      return res
        .status(401)
        .json({ error: "이메일 또는 비밀번호가 잘못되었습니다." });
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

    console.log("[LOGIN] ✅ 로그인 성공");

    await db.pool.query(
      "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?",
      [user.user_id]
    );

    res.status(200).json({
      message: "✅ 로그인 성공!",
      token,
    });
  } catch (error) {
    console.error("[LOGIN] ❌ 에러:", error.message);
    next(error);
  }
});

export default router;
