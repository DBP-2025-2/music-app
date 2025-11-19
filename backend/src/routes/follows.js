import { Router } from "express";
import { getFollows } from "../store/db.mysql.js";  
const router = Router();

// GET /follows
router.get("/", async (req, res, next) => {
  try {
    const follows = await getFollows(); 
    res.json(follows);
  } catch (err) {
    console.error("Follows route error:", err);  
    next(err);
  }
});

export default router;
