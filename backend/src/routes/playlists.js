// backend/src/routes/playlists.js
import { Router } from "express";
import {
  getPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  getPlaylistItems,
  addPlaylistItem,
  deletePlaylistItem,
  searchPublicPlaylists,
  getPopularPublicPlaylists,   
} from "../store/db.mysql.js";
import { authMiddleware } from "./auth.js";

const router = Router();

/**
 * GET /playlists
 * 현재 로그인한 사용자의 플레이리스트 목록
 */
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;           // 🔥 토큰에서 userId
    const playlists = await getPlaylists(userId);
    res.json(playlists);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /playlists
 * body: { name, isPublic }
 */
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, isPublic = true, note = "" } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const playlist = await createPlaylist({
      userId,
      name: name.trim(),
      isPublic: !!isPublic,
      note: note.trim(),
    });

    res.status(201).json(playlist);
  } catch (err) {
    next(err);
  }
});

// GET /playlists/public?q=키워드
// GET /playlists/public?q=키워드&sort=followers
router.get("/public", async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString();
    const sort = (req.query.sort || "").toString();

    if (sort === "followers") {
      // 팔로우 수 기준 인기 순
      const results = await getPopularPublicPlaylists({ limit: 50 });
      return res.json(results);
    }

    // 기본: 검색 + 최신순
    const results = await searchPublicPlaylists({ q });
    res.json(results);
  } catch (err) {
    next(err);
  }
});


/**
 * PATCH /playlists/:id
 * (지금은 이름만 수정)
 */
router.patch("/:id", authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;

    if (!id || !name || !name.trim()) {
      return res.status(400).json({ error: "invalid data" });
    }

    const updated = await updatePlaylist(id, { name: name.trim() });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /playlists/:id
 */
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "invalid id" });
    }

    await deletePlaylist(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/**
 * GET /playlists/:id/items
 */
router.get("/:id/items", authMiddleware, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    if (!playlistId) {
      return res.status(400).json({ error: "invalid playlist id" });
    }
    const items = await getPlaylistItems(playlistId);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /playlists/:id/items
 * body: { songId }
 */
router.post("/:id/items", authMiddleware, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    const { songId } = req.body;

    if (!playlistId || !songId) {
      return res.status(400).json({ error: "invalid playlistId or songId" });
    }

    const item = await addPlaylistItem({
      playlistId,
      songId: Number(songId),
    });

    res.status(201).json(item);
  } catch (err) {
    // 이미 들어있는 곡이면 400으로
    if (
      String(err.message).includes(
        "이미 이 플레이리스트에 있는 곡입니다."
      )
    ) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

/**
 * DELETE /playlists/:playlistId/items/:itemId
 */
router.delete(
  "/:playlistId/items/:itemId",
  authMiddleware,
  async (req, res, next) => {
    try {
      const itemId = Number(req.params.itemId);
      if (!itemId) {
        return res.status(400).json({ error: "invalid itemId" });
      }

      await deletePlaylistItem(itemId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);
// GET /playlists/public/search?q=...
router.get("/public/search", async (req, res, next) => {
  try {
    const q = req.query.q || "";
    const rows = await searchPublicPlaylists({ q });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /playlists/public/popular
router.get("/public/popular", async (req, res, next) => {
  try {
    const rows = await getPopularPublicPlaylists();
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
