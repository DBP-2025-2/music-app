import { Router } from "express";
import * as db from "../store/db.mysql.js";

const router = Router();

// GET /follows
router.get("/", async (req, res, next) => {
  try {
    const follows = await db.getFollows();
    res.json(follows);
  } catch (err) {
    next(err);
  }
});

export default router;
