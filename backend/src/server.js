// backend/src/server.js
import express from "express";
import morgan from "morgan";
import cors from "cors";

import artistsRouter from "./routes/artists.js";
import albumsRouter from "./routes/albums.js";
import songsRouter from "./routes/songs.js";
import playlistsRouter from "./routes/playlists.js";
import playlistItemsRouter from "./routes/playlistItems.js";
import chartsRouter from "./routes/charts.js";
import followsRouter from "./routes/follows.js";
import playHistoryRouter from "./routes/playHistory.js";
import usersRouter from "./routes/users.js";

const app = express();

// 🔧 공통 미들웨어
app.use(morgan("dev"));
app.use(cors());
// ❗ JSON body 파싱 (이게 없으면 req.body 가 undefined)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 헬스체크
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// 라우트
app.use("/artists", artistsRouter);
app.use("/albums", albumsRouter);
app.use("/songs", songsRouter);
app.use("/playlists", playlistsRouter);
app.use("/playlists", playlistItemsRouter); // /playlists/:id/items

app.use("/charts", chartsRouter);
app.use("/follows", followsRouter);
app.use("/play-history", playHistoryRouter);
app.use("/users", usersRouter);

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);

  // 외래키 제약 조건 오류 처리
  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({
      error: "Invalid reference: The artist does not exist",
      detail: "Make sure the artistId is valid",
    });
  }

  // 중복 키 오류 처리
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(400).json({
      error: "Duplicate entry: This record already exists",
    });
  }

  // 기타 에러
  res.status(500).json({
    error: "Server error",
    detail: String(err),
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT}`);
});
