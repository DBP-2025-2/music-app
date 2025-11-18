// backend/src/routes/artists.js
import { Router } from "express";
import {
  getArtists,
  createArtist,
  updateArtist,
  deleteArtist,
} from "../store/db.mysql.js";

const router = Router();

// GET /artists
router.get("/", async (req, res, next) => {
  try {
    const artists = await getArtists();
    res.json(artists);
  } catch (err) {
    next(err);
  }
});

// POST /artists
router.post("/", async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    const artist = await createArtist({ name: name.trim() });
    res.status(201).json(artist);
  } catch (err) {
    next(err);
  }
});

// PATCH /artists/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;
    if (!id || !name || !name.trim()) {
      return res.status(400).json({ error: "invalid id or name" });
    }
    const updated = await updateArtist(id, { name: name.trim() });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /artists/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "invalid id" });
    }
    await deleteArtist(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
