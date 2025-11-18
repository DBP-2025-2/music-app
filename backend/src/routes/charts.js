import { Router } from "express";
import * as db from "../store/db.mysql.js";

const router = Router();

// GET /charts
router.get("/", async (req, res, next) => {
  try {
    const charts = await db.getCharts();
    res.json(charts);
  } catch (err) {
    next(err);
  }
});

export default router;
