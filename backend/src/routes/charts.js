// backend/src/routes/charts.js
import { Router } from "express";
import * as db from "../store/db.mysql.js";
import { authMiddleware } from "./auth.js";

const router = Router();

/**
 * GET /charts/periods
 * 연도/주차 목록 + 시작/끝 날짜
 */
router.get("/periods", authMiddleware, async (req, res, next) => {
  try {
    const [rows] = await db.pool.query(
      `
      SELECT
        year,
        week,
        MIN(week_start_date) AS week_start_date,
        MAX(week_end_date)   AS week_end_date
      FROM charts
      WHERE chart_type = 'weekly'
      GROUP BY year, week
      ORDER BY year DESC, week DESC
      `
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /charts/weekly?year=2023&week=1&type=weekly
 * 선택된 주차의 차트 + 좋아요 정보
 */
// backend/src/routes/charts.js 안 일부

router.get("/weekly", authMiddleware, async (req, res, next) => {
  try {
    const { year, week, type = "weekly" } = req.query;

    if (!year || !week) {
      return res
        .status(400)
        .json({ error: "year, week 쿼리 파라미터가 필요합니다." });
    }

    const userId = req.user?.userId ?? null;

    const [rows] = await db.pool.query(
      `
      SELECT
        c.rank,
        s.song_id,
        s.title  AS song_title,
        ar.name  AS artist_name,
        al.title AS album_title,

        -- 🔹 곡별 총 좋아요 수 (중복 제거 후 카운트)
        COALESCE(l.total_likes, 0) AS total_likes,

        -- 🔹 현재 유저가 좋아요 눌렀는지만 체크 (중복 있어도 0/1)
        CASE WHEN ul.user_id IS NULL THEN 0 ELSE 1 END AS user_liked

      FROM charts c
      JOIN songs s
        ON c.song_id = s.song_id
      LEFT JOIN albums al
        ON s.album_id = al.album_id

      -- ✅ 대표 아티스트 한 명만 (듀엣 뻥튀기 방지)
      LEFT JOIN song_artists sa
        ON sa.song_id = s.song_id
       AND sa.display_order = 1
      LEFT JOIN artists ar
        ON ar.artist_id = sa.artist_id

      -- ✅ 곡별 총 좋아요 수 서브쿼리 (중복 likes도 합쳐서 한 줄)
      LEFT JOIN (
        SELECT song_id, COUNT(DISTINCT like_id) AS total_likes
        FROM likes
        GROUP BY song_id
      ) l
        ON l.song_id = s.song_id

      -- ✅ 유저별 좋아요도 서브쿼리로 1줄만 남기기
      LEFT JOIN (
        SELECT song_id, user_id
        FROM likes
        GROUP BY song_id, user_id
      ) ul
        ON ul.song_id = s.song_id
       AND ul.user_id = ?

      WHERE c.chart_type = ?
        AND c.year       = ?
        AND c.week       = ?
      ORDER BY c.rank ASC
      `,
      [userId, type, Number(year), Number(week)]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/top-liked", authMiddleware, async (req, res, next) => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({ error: "year 쿼리 파라미터가 필요합니다." });
    }

    const userId = req.user?.userId ?? null;

    const [rows] = await db.pool.query(
      `
      SELECT
        s.song_id,
        s.title                  AS song_title,
        a.name                   AS artist_name,
        al.title                 AS album_title,
        COUNT(DISTINCT l.like_id) AS total_likes,
        MAX(
          CASE
            WHEN l.user_id = ? THEN 1
            ELSE 0
          END
        )                        AS user_liked
      FROM charts c
      JOIN songs s          ON c.song_id = s.song_id
      LEFT JOIN song_artists sa ON sa.song_id = s.song_id
      LEFT JOIN artists a   ON a.artist_id = sa.artist_id
      LEFT JOIN albums al   ON s.album_id = al.album_id
      LEFT JOIN likes l     ON l.song_id = s.song_id
      WHERE c.year = ?
      GROUP BY
        s.song_id,
        s.title,
        a.name,
        al.title
      ORDER BY
        total_likes DESC,
        MIN(c.rank) ASC
      LIMIT 100
      `,
      [userId, Number(year)]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
