// backend/src/routes/albums.js
import { Router } from "express";
import {
  getAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
} from "../store/db.mysql.js";

const router = Router();

// GET /albums
router.get("/", async (req, res, next) => {
  try {
    const albums = await getAlbums();
    res.json(albums);
  } catch (err) {
    next(err);
  }
});

// POST /albums
router.post("/", async (req, res, next) => {
  try {
    const { title, artistId, year } = req.body;
    if (!title || !title.trim() || !artistId) {
      return res.status(400).json({ error: "title and artistId are required" });
    }
    const album = await createAlbum({
      title: title.trim(),
      artistId: Number(artistId),
      year: year ? Number(year) : null,
    });
    res.status(201).json(album);
  } catch (err) {
    next(err);
  }
});

// PATCH /albums/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, artistId, year } = req.body;
    if (!id || !title || !title.trim() || !artistId) {
      return res.status(400).json({ error: "invalid data" });
    }
    const updated = await updateAlbum(id, {
      title: title.trim(),
      artistId: Number(artistId),
      year: year ? Number(year) : null,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /albums/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "invalid id" });
    }
    await deleteAlbum(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
