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
  getPopularSongs,
} from "../store/db.mysql.js";

const router = Router();

/**
 * 🔥 GET /songs/popular
 * 차트에 가장 많이 오른 인기곡
 * query: ?limit=10 (기본 10)
 */
router.get("/popular", authMiddleware, async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const songs = await getPopularSongs(limit);
    res.json(songs);
  } catch (err) {
    next(err);
  }
});

/**
 * 🔍 GET /songs/search?q=키워드
 * 제목 or 아티스트 이름으로 곡 검색 (로그인 유저 기반 검색 가능)
 * 응답: { songs: [...] }
 */
router.get("/search", authMiddleware, async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString().trim();
    if (!q) {
      return res.json({ songs: [] });
    }

    const userId = req.user?.userId; // 필요하면 db에서 personalization에 사용
    const songs = await searchSongs({ q, userId });

    res.json({ songs });
  } catch (err) {
    next(err);
  }
});

/**
 * 🎵 GET /songs
 * - q가 있으면 빠른 검색용(searchSongs 사용)
 * - q가 없으면 전체 + 아티스트/정렬 필터(getSongs 사용)
 * query:
 *   - q: 검색어 (제목/아티스트)
 *   - artistId: 숫자
 *   - sort: 정렬 기준 (예: title-asc, title-desc 등)
 */
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const qRaw = (req.query.q || "").toString().trim();
    const artistId = req.query.artistId ? Number(req.query.artistId) : null;
    const sort = (req.query.sort || "").toString();

    // q가 있으면 searchSongs (플레이리스트/빠른 검색용)
    if (qRaw) {
      const rows = await searchSongs({
        q: qRaw,
        userId: req.user?.userId,
      });
      return res.json(rows);
    }

    // q가 없으면 Songs 페이지용: 전체 + 필터/정렬
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

/**
 * POST /songs
 * body: { title, artistId }
 */
router.post("/", async (req, res, next) => {
  try {
    const { title, artistId } = req.body ?? {};
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

/**
 * PATCH /songs/:id
 * body: { title, artistId }
 */
router.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { title, artistId } = req.body ?? {};

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

/**
 * 📊 GET /songs/:id/charts
 * 특정 노래의 차트 기록
 */
router.get("/:id/charts", async (req, res, next) => {
  try {
    const songId = Number(req.params.id);
    if (!songId) {
      return res.status(400).json({ error: "invalid song id" });
    }
    const charts = await getSongCharts(songId);
    res.json(charts);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /songs/:id
 */
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
