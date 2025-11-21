// backend/src/routes/likes.js
import { Router } from "express";
import * as db from "../store/db.mysql.js";
import { authMiddleware } from "./auth.js";

const router = Router();

// 좋아요 토글
router.post("/toggle", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;                  // auth.js 에서 넣어준 값
    const { songId } = req.body;                     // 프런트에서 보낼 이름

    if (!songId) {
      return res.status(400).json({ error: "songId is required" });
    }

    // 이미 좋아요 했는지 확인
    const [rows] = await db.pool.query(
      "SELECT like_id FROM likes WHERE user_id = ? AND song_id = ?",
      [userId, songId]
    );

    if (rows.length > 0) {
      // 있으면 → 취소
      await db.pool.query(
        "DELETE FROM likes WHERE user_id = ? AND song_id = ?",
        [userId, songId]
      );
      return res.json({ liked: false });
    } else {
      // 없으면 → 추가
      await db.pool.query(
        "INSERT INTO likes (user_id, song_id) VALUES (?, ?)",
        [userId, songId]
      );
      return res.json({ liked: true });
    }
  } catch (err) {
    console.error("POST /likes/toggle error:", err);
    next(err);
  }
});

// 내가 좋아요한 곡 목록
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const [rows] = await db.pool.query(
      `
      SELECT
        l.song_id,
        s.title           AS song_title,
        ar.name           AS artist_name,
        al.title          AS album_title,
        l.created_at      AS liked_at
      FROM likes l
      JOIN songs s           ON l.song_id = s.song_id
      LEFT JOIN song_artists sa ON sa.song_id = s.song_id AND sa.display_order = 1
      LEFT JOIN artists ar       ON sa.artist_id = ar.artist_id
      LEFT JOIN albums al        ON s.album_id = al.album_id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC;
      `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /likes/me error:", err);
    next(err);
  }
});

export default router;
