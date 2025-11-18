// backend/src/routes/songs.js
import { Router } from "express";
import * as db from "../store/db.mysql.js";

const router = Router();

// GET /songs  (optional ?artistId=)
router.get("/", async (req, res, next) => {
  try {
    const artistId = req.query.artistId
      ? Number(req.query.artistId)
      : undefined;
    const songs = await db.getSongs(artistId ? { artistId } : undefined);
    res.json(songs);
  } catch (err) {
    next(err);
  }
});

// POST /songs
// body: { title, artistId }
router.post("/", async (req, res, next) => {
  try {
    const { title, artistId } = req.body ?? {};

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "title is required" });
    }

    const aId = Number(artistId);
    if (!aId || aId <= 0) {
      return res.status(400).json({ error: "artistId must be a valid number" });
    }

    const song = await db.createSong({ title, artistId: aId });
    res.status(201).json(song);
  } catch (err) {
    next(err);
  }
});

// PATCH /songs/:id
// body: { title, artistId }
router.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, artistId } = req.body ?? {};

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "title is required" });
    }

    const aId = Number(artistId);
    if (!aId || aId <= 0) {
      return res.status(400).json({ error: "artistId must be a valid number" });
    }

    const updated = await db.updateSong(id, { title, artistId: aId });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /songs/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.deleteSong(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
