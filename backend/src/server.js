// backend/src/server.js
import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import artistsRouter from "./routes/artists.js";
import albumsRouter from "./routes/albums.js";
import songsRouter from "./routes/songs.js";
import playlistsRouter from "./routes/playlists.js";
import playlistItemsRouter from "./routes/playlistItems.js";
import chartsRouter from "./routes/charts.js";
import followsRouter from "./routes/follows.js";
import playHistoryRouter from "./routes/playHistory.js";
import usersRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";
import likesRoutes from "./routes/likes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🔧 공통 미들웨어
app.use(morgan("dev"));
app.use(cors());
// EJS 설정
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(express.static(path.join(__dirname, "../../frontend/public")));
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
app.use("/auth", authRouter); // 인증 라우트
app.use("/likes", likesRoutes);

// 페이지 라우트 (EJS)
app.get("/register", (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    console.error("페이지 렌더링 오류:/register", error);
    res.status(500).send("페이지를 불러오는 데 실패했습니다.");
  }
});

app.get("/login", (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.error("페이지 렌더링 오류:/login", error);
    res.status(500).send("페이지를 불러오는 데 실패했습니다.");
  }
});

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
