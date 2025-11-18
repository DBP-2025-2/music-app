// backend/src/routes/songs.js
import { Router } from "express";
import {
  getSongs,
  createSong,
  updateSong,
  deleteSong,
} from "../store/db.mysql.js";

const router = Router();

// GET /songs?artistId=1 (선택)
router.get("/", async (req, res, next) => {
  try {
    const { artistId } = req.query;
    const songs = await getSongs({
      artistId: artistId ? Number(artistId) : undefined,
    });
    res.json(songs);
  } catch (err) {
    next(err);
  }
});

// POST /songs
router.post("/", async (req, res, next) => {
  try {
    const { title, artistId } = req.body;
    if (!title || !title.trim() || !artistId) {
      return res.status(400).json({ error: "title and artistId are required" });
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
    if (!id) {
      return res.status(400).json({ error: "invalid id" });
    }
    await deleteSong(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
