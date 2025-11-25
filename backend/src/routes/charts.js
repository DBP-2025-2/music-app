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
        
        -- [수정 1] 여러 아티스트를 쉼표(,)로 합쳐서 가져오기
        GROUP_CONCAT(DISTINCT ar.name ORDER BY sa.display_order SEPARATOR ', ') AS artist_name,
        
        al.title AS album_title,
        COALESCE(l.total_likes, 0) AS total_likes,
        CASE WHEN ul.user_id IS NULL THEN 0 ELSE 1 END AS user_liked

      FROM charts c
      JOIN songs s
        ON c.song_id = s.song_id
      LEFT JOIN albums al
        ON s.album_id = al.album_id

      -- [수정 2] 기존에는 sa.display_order = 1 조건 때문에 한 명만 나왔거나, 
      -- 조건을 빼면 뻥튀기 되었을 것입니다. 
      -- 모든 아티스트를 다 가져오기 위해 조건을 풉니다.
      LEFT JOIN song_artists sa
        ON sa.song_id = s.song_id
      LEFT JOIN artists ar
        ON ar.artist_id = sa.artist_id

      -- 곡별 총 좋아요 수
      LEFT JOIN (
        SELECT song_id, COUNT(DISTINCT like_id) AS total_likes
        FROM likes
        GROUP BY song_id
      ) l
        ON l.song_id = s.song_id

      -- 유저별 좋아요 여부
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
      
      -- [수정 3] ★가장 중요★ 노래 ID 기준으로 그룹핑을 해야 중복이 사라집니다.
      GROUP BY 
        c.rank, 
        s.song_id, 
        s.title, 
        al.title, 
        l.total_likes, 
        ul.user_id

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
        
        -- [수정] 여기도 GROUP_CONCAT 적용해야 함
        GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') AS artist_name,
        
        al.title                 AS album_title,
        COUNT(DISTINCT l.like_id) AS total_likes,
        MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS user_liked
      FROM charts c
      JOIN songs s          ON c.song_id = s.song_id
      LEFT JOIN song_artists sa ON sa.song_id = s.song_id
      LEFT JOIN artists a   ON a.artist_id = sa.artist_id
      LEFT JOIN albums al   ON s.album_id = al.album_id
      LEFT JOIN likes l     ON l.song_id = s.song_id
      WHERE c.year = ?
      
      -- [수정] GROUP BY에서 a.name을 빼야 합쳐짐
      GROUP BY
        s.song_id,
        s.title,
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
