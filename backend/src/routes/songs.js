// backend/src/routes/songs.js
import { Router } from "express";
import { authMiddleware } from "./auth.js";
import {
  getSongs,
  createSong,
  updateSong,
  deleteSong,
  searchSongs,
} from "../store/db.mysql.js";

const router = Router();

// GET /songs  (?q=...)
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString().trim();

    if (!q) {
      // 검색어 없으면 그냥 빈 배열 리턴
      return res.json([]);
    }

    const rows = await searchSongs({ q });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});
// POST /songs
router.post("/", async (req, res, next) => {
  try {
    const { title, artistId } = req.body;
    if (!title || !title.trim() || !artistId) {
      return res.status(400).json({ error: "title, artistId required" });
    }
    const song = await createSong({
      title: title.trim(),
      artistId: Number(artistId),
    });
    res.status(201).json(song);
  } catch (err) {
    next(err);
  }
});

// PATCH /songs/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, artistId } = req.body;
    if (!id || !title || !title.trim() || !artistId) {
      return res.status(400).json({ error: "invalid data" });
    }
    const updated = await updateSong(id, {
      title: title.trim(),
      artistId: Number(artistId),
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /songs/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid id" });
    await deleteSong(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
