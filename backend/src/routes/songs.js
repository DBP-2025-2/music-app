// backend/src/routes/songs.js
import { Router } from "express";
import { authMiddleware } from "./auth.js";
import {
  getSongs,
  createSong,
  updateSong,
  deleteSong,
  searchSongs,
  getSongCharts,
  getRecommendedSongs,
} from "../store/db.mysql.js";

const router = Router();

/**
 * GET /songs
 */
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const qRaw = (req.query.q || "").toString().trim();
    const artistId = req.query.artistId ? Number(req.query.artistId) : null;
    const sort = (req.query.sort || "").toString();

    //플레이리스트 / 빠른 검색용: q가 있으면 searchSongs 사용
    if (qRaw) {
      const rows = await searchSongs({ q: qRaw });
      return res.json(rows);
    }

    // 🎵 q가 없으면 Songs 페이지용: 전체 + 필터/정렬
    const rows = await getSongs({
      artistId,
      q: "",
      sort,
    });

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /songs
router.post("/", async (req, res, next) => {
  try {
    const { title, artistId } = req.body;
    if (!title || !title.trim() || !artistId) {
      return res.status(400).json({ error: "title, artistId required" });
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

// ⭐ GET /songs/:id/charts - 특정 노래의 차트 기록 (더 구체적인 패턴이므로 먼저 와야 함)
router.get("/:id/charts", async (req, res, next) => {
  try {
    const songId = Number(req.params.id);
    console.log(`📊 [GET /songs/:id/charts] songId: ${songId}`);
    if (!songId || songId <= 0) {
      return res.status(400).json({ error: "invalid song id" });
    }
    const charts = await getSongCharts(songId);
    console.log(`📊 [GET /songs/:id/charts] Found ${charts.length} chart records`);
    res.json(charts);
  } catch (err) {
    console.error("❌ [GET /songs/:id/charts] Error:", err);
    next(err);
  }
});

// ⭐ GET /songs/:id/recommendations - 추천곡
router.get("/:id/recommendations", async (req, res, next) => {
  try {
    const songId = Number(req.params.id);
    console.log(`🎵 [GET /songs/:id/recommendations] songId: ${songId}`);
    if (!songId || songId <= 0) {
      return res.status(400).json({ error: "invalid song id" });
    }
    const recommendations = await getRecommendedSongs(songId);
    console.log(`🎵 [GET /songs/:id/recommendations] Found ${recommendations.length} recommendations`);
    res.json(recommendations);
  } catch (err) {
    console.error("❌ [GET /songs/:id/recommendations] Error:", err);
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
    if (!id) return res.status(400).json({ error: "invalid id" });
    await deleteSong(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
