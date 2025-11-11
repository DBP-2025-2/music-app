import { Router } from "express";
import db from "../store/db.js";

const router = Router();

router.get("/", (req, res) => {
  const { artistId } = req.query;
  res.json(db.listSongs({ artistId }));
});

router.post("/", (req, res) => {
  const { title, artistId } = req.body;
  if (!title?.trim())
    return res.status(400).json({ error: "title is required" });
  if (!artistId) return res.status(400).json({ error: "artistId is required" });

  if (!db.findArtist(Number(artistId)))
    return res.status(404).json({ error: "artist not found" });

  const item = db.createSong({ title, artistId });
  res.status(201).json(item);
});

router.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { title, artistId } = req.body;

  if (title !== undefined && !String(title).trim())
    return res.status(400).json({ error: "title is required" });

  if (artistId !== undefined && !db.findArtist(Number(artistId)))
    return res.status(404).json({ error: "artist not found" });

  const updated = db.updateSong(id, { title, artistId });
  if (!updated) return res.status(404).json({ error: "not found" });

  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const ok = db.deleteSong(id);
  if (!ok) return res.status(404).json({ error: "not found" });

  res.status(204).end();
});

export default router;
