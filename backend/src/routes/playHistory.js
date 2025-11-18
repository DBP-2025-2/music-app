import { Router } from "express";
import * as db from "../store/db.mysql.js";

const router = Router();

// GET /play-history
router.get("/", async (req, res, next) => {
  try {
    const history = await db.getPlayHistory();
    res.json(history);
  } catch (err) {
    next(err);
  }
});

export default router;
