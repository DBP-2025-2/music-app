// [backend/src/routes/playHistory.js]
import { Router } from "express";
import { authMiddleware } from "./auth.js";
import { 
  getAllSongsForHistory, 
  addPlayHistory, 
  getMyPlayHistory 
} from "../store/db.mysql.js";

const router = Router();

// 1. 페이지 렌더링 (GET /play-history)
router.get("/", authMiddleware, (req, res) => {
  // views 폴더 내의 playHistory.ejs를 보여줌
  res.render("playHistory", { 
    title: "Play History",
    user: req.user // 로그인한 유저 정보 전달
  });
});

// 2. 검색용 노래 목록 (GET /play-history/songs)
router.get("/songs", authMiddleware, async (req, res, next) => {
  try {
    const songs = await getAllSongsForHistory();
    res.json({ songs });
  } catch (error) {
    next(error);
  }
});

// 3. 기록 저장 (POST /play-history)
router.post("/", authMiddleware, async (req, res, next) => {
  const { song_id } = req.body;
  const userId = req.user.userId; // 토큰에서 바로 ID 추출

  if (!song_id) return res.status(400).json({ message: "노래를 선택해주세요." });

  try {
    await addPlayHistory(userId, song_id);
    res.status(201).json({ message: "재생 기록 저장 완료" });
  } catch (error) {
    next(error);
  }
});

// 4. 내 기록 조회 (GET /play-history/list)
router.get("/list", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const history = await getMyPlayHistory(userId);
    res.json({ history });
  } catch (error) {
    next(error);
  }
});

export default router;