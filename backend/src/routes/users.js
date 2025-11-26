import { Router } from "express";
import bcrypt from "bcrypt";
import * as db from "../store/db.mysql.js";

const router = Router();

// GET /users
router.get("/", async (req, res, next) => {
  try {
    const users = await db.getUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// PATCH /users/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { nickname } = req.body ?? {};

    if (!userId || userId <= 0) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const updated = await db.updateUser(userId, { nickname });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /users/:id/password - 비밀번호 변경
router.patch("/:id/password", async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { oldPassword, newPassword } = req.body ?? {};

    if (!userId || userId <= 0) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "기존 비밀번호와 새 비밀번호는 필수입니다." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "새 비밀번호는 최소 6자 이상이어야 합니다." });
    }

    // 기존 비밀번호 확인
    const currentPasswordHash = await db.getUserPasswordHash(userId);
    const isMatch = await bcrypt.compare(oldPassword, currentPasswordHash);

    if (!isMatch) {
      return res
        .status(401)
        .json({ error: "기존 비밀번호가 일치하지 않습니다." });
    }

    // 새 비밀번호 해싱 및 저장
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    const result = await db.updateUserPassword(userId, {
      newPasswordHash,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
