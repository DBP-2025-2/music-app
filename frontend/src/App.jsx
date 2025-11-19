// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ArtistsPage from "./pages/ArtistsPage";
import SongsPage from "./pages/SongsPage";
import AlbumsPage from "./pages/AlbumsPage";
import PlaylistsPage from "./pages/PlaylistsPage";
import ChartsPage from "./pages/ChartsPage";
import FollowsPage from "./pages/FollowsPage";
import HistoryPage from "./pages/HistoryPage";
import UsersPage from "./pages/UsersPage";

/* ---------- 공통 레이아웃 ---------- */

function Layout({ children }) {
  return (
    <>
      <header className="app-header">
        <div className="app-title">
          <span>🎵</span>
          <span>Music App</span>
        </div>
        <nav className="app-nav">
          <NavLink
            to="/artists"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " nav-link--active" : "")
            }
          >
            Artists
          </NavLink>
          <NavLink
            to="/songs"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " nav-link--active" : "")
            }
          >
            Songs
          </NavLink>
          <NavLink
            to="/albums"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " nav-link--active" : "")
            }
          >
            Albums
          </NavLink>
          <NavLink
            to="/playlists"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " nav-link--active" : "")
            }
          >
            Playlists
          </NavLink>
          <NavLink
            to="/charts"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " nav-link--active" : "")
            }
          >
            Charts
          </NavLink>
          <NavLink
            to="/follows"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " nav-link--active" : "")
            }
          >
            Follows
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " nav-link--active" : "")
            }
          >
            History
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) =>
              "nav-link" + (isActive ? " nav-link--active" : "")
            }
          >
            Users
          </NavLink>
        </nav>
      </header>

      <main className="app-main">{children}</main>
    </>
  );
}

/* ---------- App Root ---------- */

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ArtistsPage />} />
          <Route path="/artists" element={<ArtistsPage />} />
          <Route path="/songs" element={<SongsPage />} />
          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/follows" element={<FollowsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/users" element={<UsersPage />} />
          {/* 404 fallback 원하면 추가 */}
          {/* <Route path="*" element={<ArtistsPage />} /> */}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
