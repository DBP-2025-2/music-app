// backend/src/routes/albums.js
import { Router } from "express";
import * as db from "../store/db.mysql.js";

const router = Router();

// GET /albums
router.get("/", async (req, res, next) => {
  try {
    const albums = await db.getAlbums();
    res.json(albums);
  } catch (err) {
    next(err);
  }
});

// POST /albums
// body: { title, artistId, year }
router.post("/", async (req, res, next) => {
  try {
    const { title, artistId, year } = req.body ?? {};
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "title is required" });
    }

    const aId = Number(artistId);
    if (!aId || aId <= 0) {
      return res.status(400).json({ error: "artistId must be a valid number" });
    }

    const album = await db.createAlbum({ title, artistId: aId });
    res.status(201).json(album);
  } catch (err) {
    next(err);
  }
});

// PATCH /albums/:id
// body: { title, artistId, year }
router.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, artistId, year } = req.body ?? {};
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "title is required" });
    }

    const aId = Number(artistId);
    if (!aId || aId <= 0) {
      return res.status(400).json({ error: "artistId must be a valid number" });
    }

    const updated = await db.updateAlbum(id, { title, artistId: aId });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /albums/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.deleteAlbum(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
