// backend/src/server.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import artistsRouter from "./routes/artists.js";
import songsRouter from "./routes/songs.js";
import albumsRouter from "./routes/albums.js";
import playlistsRouter from "./routes/playlists.js";
import { testConnection } from "./store/db.mysql.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// 라우터
app.use("/artists", artistsRouter);
app.use("/songs", songsRouter);
app.use("/albums", albumsRouter);
app.use("/playlists", playlistsRouter);

// 헬스체크 & DB 연결 테스트용
app.get("/health", async (req, res) => {
  try {
    const ok = await testConnection();
    res.json({ ok, db: "mysql" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "Server error", detail: String(err) });
});

app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT}`);
});
