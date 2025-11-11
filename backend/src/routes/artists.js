import { Router } from "express";
import db from "../store/db.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(db.listArtists());
});

router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "name is required" });

  const item = db.createArtist(name);
  res.status(201).json(item);
});

router.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { name } = req.body;

  if (!name?.trim()) return res.status(400).json({ error: "name is required" });

  const updated = db.updateArtist(id, name);
  if (!updated) return res.status(404).json({ error: "not found" });

  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const ok = db.deleteArtist(id);

  if (!ok) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

export default router;
