import { Router } from "express";
// 1. authMiddleware 가져오기
import { authMiddleware } from "./auth.js"; 
import { 
  getMyFollows, 
  findUserByNickname, 
  findArtistByName, 
  createFollow, 
  deleteFollow, 
  getRecommendations,
  findUserByEmail
} from "../store/db.mysql.js";

const router = Router();

// 2. 모든 라우터에 authMiddleware 적용
// 1) 내 팔로우 목록 조회
router.get("/list", authMiddleware, async (req, res, next) => {
  try {
    // authMiddleware를 통과하면 req.user.userId에 내 ID가 들어있습니다.
    const myId = req.user.userId; 

    // 목록 조회
    const follows = await getMyFollows(myId);
    res.json({ count: follows.length, follows });
  } catch (err) {
    next(err);
  }
});

// 2) 팔로우 추가
router.post("/", authMiddleware, async (req, res, next) => {
  const { target_input, target_type } = req.body;
  const myId = req.user.userId; // 토큰에서 내 ID 바로 가져옴

  if (!target_input || !target_type) return res.status(400).json({ message: "정보가 누락되었습니다." });

  try {
    // 상대방 ID 찾기
    let followingId;
    if (target_type === "user") {
      const target = await findUserByNickname(target_input);
      if (!target) return res.status(404).json({ message: `유저 '${target_input}'를 찾을 수 없습니다.` });
      
      // 내 ID와 상대 ID 비교 (자신 팔로우 방지)
      if (myId === target.id) return res.status(400).json({ message: "자신을 팔로우할 수 없습니다." });
      
      followingId = target.id;
    } else {
      const target = await findArtistByName(target_input);
      if (!target) return res.status(404).json({ message: `아티스트 '${target_input}'를 찾을 수 없습니다.` });
      followingId = target.id;
    }

    // 저장
    await createFollow(myId, followingId, target_type);
    res.status(201).json({ message: "팔로우 성공!" });

  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "이미 팔로우 중입니다." });
    }
    next(err);
  }
});

// 3) 언팔로우
router.delete("/", authMiddleware, async (req, res, next) => {
  const { following_id, target_type } = req.body;
  const myId = req.user.userId;

  try {
    const success = await deleteFollow(myId, following_id, target_type);
    
    // 이미 삭제되었거나 없는 경우도 그냥 성공으로 처리하거나 404
    if (!success) return res.status(404).json({ message: "팔로우 내역이 없습니다." });

    res.json({ message: "언팔로우 완료" });
  } catch (err) {
    next(err);
  }
});

// 4) 추천 목록
router.get("/recommendations", authMiddleware, async (req, res, next) => {
  try {
    const myEmail = req.user.email;
    const data = await getRecommendations(myEmail);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;