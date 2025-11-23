// backend/src/routes/playlistItems.js
import { Router } from "express";
import * as db from "../store/db.mysql.js";

const router = Router();

/**
 *  GET /playlists/:id/items
 *  → 특정 플레이리스트에 담긴 곡 리스트
 */
// 예시: GET /playlists/:id/items
router.get("/:id/items", async (req, res, next) => {
  const playlistId = Number(req.params.id) || 0;

  try {
    const rows = await db.query(
      `
      SELECT
        pi.item_id                         AS id,
        pi.playlist_id,
        pi.song_id                         AS songId,
        pi.position,
        pi.note,
        pi.added_at,
        s.title                            AS songTitle,
        -- 🔽 가수 이름(여러 명이면 , 로 합치기)
        GROUP_CONCAT(DISTINCT a.name ORDER BY sa.display_order SEPARATOR ', ') AS artistName
      FROM playlist_items AS pi
      JOIN songs AS s
        ON s.song_id = pi.song_id
      LEFT JOIN song_artists AS sa
        ON sa.song_id = s.song_id
      LEFT JOIN artists AS a
        ON a.artist_id = sa.artist_id
      WHERE pi.playlist_id = ?
      GROUP BY
        pi.item_id,
        pi.playlist_id,
        pi.song_id,
        pi.position,
        pi.note,
        pi.added_at,
        s.title
      ORDER BY pi.position ASC
      `,
      [playlistId]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 *  POST /playlists/:id/items
 *  body: { songId }
 *  → 플레이리스트에 곡 추가
 */
router.post("/:id/items", async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    const { songId } = req.body;

    const item = await db.addPlaylistItem({
      playlistId,
      songId: Number(songId),
    });

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

/**
 *  DELETE /playlists/:playlistId/items/:itemId
 *  → 플레이리스트에서 곡 하나 삭제
 */
router.delete("/:playlistId/items/:itemId", async (req, res, next) => {
  try {
    const itemId = Number(req.params.itemId);
    await db.deletePlaylistItem(itemId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
