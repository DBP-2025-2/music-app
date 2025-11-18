// backend/src/routes/playlistItems.js
import { Router } from "express";
import * as db from "../store/db.mysql.js";

const router = Router();

/**
 *  GET /playlists/:id/items
 *  → 특정 플레이리스트에 담긴 곡 리스트
 */
router.get("/:id/items", async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    const items = await db.getPlaylistItems(playlistId);
    res.json(items);
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
