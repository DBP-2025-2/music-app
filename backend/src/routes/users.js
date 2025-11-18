import { Router } from "express";
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

export default router;
