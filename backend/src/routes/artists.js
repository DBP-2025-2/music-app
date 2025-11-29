// backend/src/routes/artists.js
import { Router } from "express";
import * as db from "../store/db.mysql.js";

const router = Router();

router.get("/search", async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString().trim();
    if (!q) return res.json({ artists: [] });

    const artists = await db.searchArtists({ q });
    res.json({ artists });
  } catch (err) {
    next(err);
  }
});

// GET /artists
router.get("/", async (req, res, next) => {
  try {
    const artists = await db.getArtists();
    res.json(artists);
  } catch (err) {
    next(err);
  }
});

// POST /artists
router.post("/", async (req, res, next) => {
  try {
    const { name } = req.body ?? {};
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const artist = await db.createArtist({ name });
    res.status(201).json(artist);
  } catch (err) {
    next(err);
  }
});

// PATCH /artists/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body ?? {};
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const updated = await db.updateArtist(id, { name });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /artists/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await db.deleteArtist(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
