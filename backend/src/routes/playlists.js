import { Router } from "express";
import {
  getPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  getPlaylistItems,
  addPlaylistItem,
  deletePlaylistItem,
  searchPublicPlaylists,
  getPopularPublicPlaylists,
  // 🔽 [추가] 새로 필요한 DB 함수들을 임포트합니다.
  getPublicPlaylistsByUserId,
  checkFollow,
  createFollow,
  deleteFollow
} from "../store/db.mysql.js";
import { authMiddleware } from "./auth.js";

const router = Router();

/**
 * GET /playlists
 * 현재 로그인한 사용자의 플레이리스트 목록
 */
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const playlists = await getPlaylists(userId);
    res.json(playlists);
  } catch (err) {
    next(err);
  }
});

// 🔽 [신규] 특정 유저의 공개 플레이리스트 목록 (UserPage용)
router.get("/user/:userId", authMiddleware, async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const viewerId = req.user.userId; // 🔹 토큰에서 내 ID 가져오기
    
    // DB 함수에 viewerId도 전달
    const playlists = await getPublicPlaylistsByUserId(userId, viewerId);
    res.json(playlists);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /playlists
 * body: { name, isPublic }
 */
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, isPublic = true, note = "" } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const playlist = await createPlaylist({
      userId,
      name: name.trim(),
      isPublic: !!isPublic,
      note: note.trim(),
    });

    res.status(201).json(playlist);
  } catch (err) {
    next(err);
  }
});

// GET /playlists/public?q=키워드
// GET /playlists/public?q=키워드&sort=followers
router.get("/public", authMiddleware, async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString();
    const sort = (req.query.sort || "").toString();
    const viewerId = req.user.userId; // 🔹 내 ID 가져오기

    if (sort === "followers") {
      // 🔹 viewerId 전달
      const results = await getPopularPublicPlaylists({ limit: 50, viewerId });
      return res.json(results);
    }

    // 🔹 viewerId 전달
    const results = await searchPublicPlaylists({ q, viewerId });
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// 🔽 [신규] 플레이리스트 팔로우 토글
router.post("/:id/follow", authMiddleware, async (req, res, next) => {
  try {
    const myId = req.user.userId;
    const playlistId = Number(req.params.id);
    
    // 이미 팔로우 중인지 확인
    const isFollowing = await checkFollow(myId, playlistId, 'playlist');

    if (isFollowing) {
      await deleteFollow(myId, playlistId, 'playlist');
      return res.json({ followed: false });
    } else {
      await createFollow(myId, playlistId, 'playlist');
      return res.json({ followed: true });
    }
  } catch (err) {
    next(err);
  }
});

// 🔽 [신규] 내가 이 플레이리스트를 팔로우했는지 확인
router.get("/:id/follow", authMiddleware, async (req, res, next) => {
  try {
    const myId = req.user.userId;
    const playlistId = Number(req.params.id);
    const isFollowing = await checkFollow(myId, playlistId, 'playlist');
    res.json({ followed: isFollowing });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /playlists/:id
 * (지금은 이름만 수정)
 */
router.patch("/:id", authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;

    if (!id || !name || !name.trim()) {
      return res.status(400).json({ error: "invalid data" });
    }

    const updated = await updatePlaylist(id, { name: name.trim() });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /playlists/:id
 */
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "invalid id" });
    }

    await deletePlaylist(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/**
 * GET /playlists/:id/items
 */
router.get("/:id/items", authMiddleware, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    if (!playlistId) {
      return res.status(400).json({ error: "invalid playlist id" });
    }
    const items = await getPlaylistItems(playlistId);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /playlists/:id/items
 * body: { songId }
 */
router.post("/:id/items", authMiddleware, async (req, res, next) => {
  try {
    const playlistId = Number(req.params.id);
    const { songId } = req.body;

    if (!playlistId || !songId) {
      return res.status(400).json({ error: "invalid playlistId or songId" });
    }

    const item = await addPlaylistItem({
      playlistId,
      songId: Number(songId),
    });

    res.status(201).json(item);
  } catch (err) {
    // 이미 들어있는 곡이면 400으로
    if (
      String(err.message).includes(
        "이미 이 플레이리스트에 있는 곡입니다."
      )
    ) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

/**
 * DELETE /playlists/:playlistId/items/:itemId
 */
router.delete(
  "/:playlistId/items/:itemId",
  authMiddleware,
  async (req, res, next) => {
    try {
      const itemId = Number(req.params.itemId);
      if (!itemId) {
        return res.status(400).json({ error: "invalid itemId" });
      }

      await deletePlaylistItem(itemId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);

// GET /playlists/public/search (기존 코드 유지)
router.get("/public/search", async (req, res, next) => {
  try {
    const q = req.query.q || "";
    const rows = await searchPublicPlaylists({ q });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /playlists/public/popular (기존 코드 유지)
router.get("/public/popular", async (req, res, next) => {
  try {
    const rows = await getPopularPublicPlaylists();
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;