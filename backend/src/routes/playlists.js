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
} from "../store/db.mysql.js";

const router = Router();

// GET /playlists
router.get("/", async (req, res, next) => {
  try {
    const playlists = await getPlaylists();
    res.json(playlists);
  } catch (err) {
    next(err);
  }
});

// POST /playlists
router.post("/", async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    const playlist = await createPlaylist({ name: name.trim() });
    res.status(201).json(playlist);
  } catch (err) {
    next(err);
  }
});

// PATCH /playlists/:id
router.patch("/:id", async (req, res, next) => {
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

// DELETE /playlists/:id
router.delete("/:id", async (req, res, next) => {
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

// GET /playlists/:id/items
router.get("/:id/items", async (req, res, next) => {
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

// POST /playlists/:id/items
router.post("/:id/items", async (req, res, next) => {
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
    if (String(err.message).includes("이미 이 플레이리스트에 있는 곡입니다.")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// DELETE /playlists/:playlistId/items/:itemId
router.delete("/:playlistId/items/:itemId", async (req, res, next) => {
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
});

export default router;
