import { Router } from "express";
// 🔹 [중요] 모든 함수를 db 객체로 묶어서 가져와야 기존 코드(db.getAlbums 등)와 호환됩니다.
import * as db from "../store/db.mysql.js";

const router = Router();


/** 🔍 GET /albums/search?q=키워드 */
router.get("/search", async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString().trim();
    if (!q) return res.json({ albums: [] });

    const albums = await db.searchAlbums({ q });
    res.json({ albums });
  } catch (err) {
    next(err);
  }
});

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

// 🔹 [추가] 앨범 상세 정보 조회
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    // db.mysql.js에 추가한 함수 호출
    const album = await db.getAlbumById(id);

    if (!album) return res.status(404).json({ error: "Album not found" });
    res.json(album);
  } catch (err) {
    next(err);
  }
});

// 🔹 [추가] 앨범 수록곡 목록 조회
router.get("/:id/tracks", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    // db.mysql.js에 추가한 함수 호출
    const tracks = await db.getAlbumTracks(id);
    res.json(tracks);
  } catch (err) {
    next(err);
  }
});

export default router;