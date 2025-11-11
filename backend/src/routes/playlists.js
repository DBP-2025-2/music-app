import { Router } from "express";
import db from "../store/db.js";

const router = Router();

// 플레이리스트 목록
router.get("/", (_req, res) => {
  res.json(db.listPlaylists());
});

// 생성 { name }
router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "name is required" });
  const item = db.createPlaylist(name);
  res.status(201).json(item);
});

// 수정 { name }
router.patch("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "name is required" });
  const updated = db.updatePlaylist(id, name);
  if (!updated) return res.status(404).json({ error: "not found" });
  res.json(updated);
});

// 삭제
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const ok = db.deletePlaylist(id);
  if (!ok) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

// ===================== Items =====================

// 특정 플레이리스트의 아이템 목록
router.get("/:id/items", (req, res) => {
  const id = Number(req.params.id);
  const items = db.listPlaylistItems(id);
  res.json(items);
});

// 아이템 추가 { songId }
router.post("/:id/items", (req, res) => {
  const playlistId = Number(req.params.id);
  const { songId } = req.body || {};
  if (!songId) return res.status(400).json({ error: "songId is required" });
  const { item, error } = db.addPlaylistItem({
    playlistId,
    songId: Number(songId),
  });
  if (error) return res.status(400).json({ error });
  res.status(201).json(item);
});

// 아이템 삭제
router.delete("/:id/items/:itemId", (req, res) => {
  const itemId = Number(req.params.itemId);
  const ok = db.removePlaylistItem(itemId);
  if (!ok) return res.status(404).json({ error: "not found" });
  res.status(204).end();
});

export default router;
