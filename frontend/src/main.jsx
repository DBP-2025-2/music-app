import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// 전역 스타일
import "./styles/global.css";
import "./styles/artists-songs.css";
import "./styles/charts.css";
import "./styles/search.css";

import "./styles/playlists.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
