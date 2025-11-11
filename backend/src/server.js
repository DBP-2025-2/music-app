import express from "express";
import cors from "cors";

// 라우트
import artists from "./routes/artists.js";
import songs from "./routes/songs.js";
import albums from "./routes/albums.js";
import playlists from "./routes/playlists.js";

const app = express();

app.use(cors());
app.use(express.json());

// 서버체크
app.get("/health", (_req, res) => res.json({ ok: true }));

// 라우트 등록
app.use("/artists", artists);
app.use("/songs", songs);
app.use("/albums", albums);
app.use("/playlists", playlists);

// 에러 핸들러
app.use((err, _req, res, _next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "server error" });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT}`);
});
