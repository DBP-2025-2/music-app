// frontend/src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ArtistsPage from "./pages/ArtistsPage";
import SongsPage from "./pages/SongsPage";
import AlbumsPage from "./pages/AlbumsPage";
import PlaylistsPage from "./pages/PlaylistsPage";
import ChartsPage from "./pages/ChartsPage";
import FollowsPage from "./pages/FollowsPage";
import HistoryPage from "./pages/HistoryPage";
import UsersPage from "./pages/UsersPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChartsYearPage from "./pages/ChartsYearPage";
import UserPage from "./pages/UserPage";
import ArtistPage from "./pages/ArtistPage"; // 👈 [중요] 이 줄이 빠져 있었습니다!

/* ---------- 공통 레이아웃 ---------- */

function Layout({ children, isLoggedIn, onLogout }) {
  return (
    <>
      <header className="app-header">
        <div className="app-title">
          <span>🎵</span>
          <span>Music App</span>
        </div>
        <nav className="app-nav">
          <NavLink to="/artists" className={({ isActive }) => "nav-link" + (isActive ? " nav-link--active" : "")}>Artists</NavLink>
          <NavLink to="/songs" className={({ isActive }) => "nav-link" + (isActive ? " nav-link--active" : "")}>Songs</NavLink>
          <NavLink to="/albums" className={({ isActive }) => "nav-link" + (isActive ? " nav-link--active" : "")}>Albums</NavLink>
          <NavLink to="/playlists" className={({ isActive }) => "nav-link" + (isActive ? " nav-link--active" : "")}>Playlists</NavLink>
          <NavLink to="/charts" className={({ isActive }) => "nav-link" + (isActive ? " nav-link--active" : "")}>Charts</NavLink>
          <NavLink to="/follows" className={({ isActive }) => "nav-link" + (isActive ? " nav-link--active" : "")}>Follows</NavLink>
          <NavLink to="/history" className={({ isActive }) => "nav-link" + (isActive ? " nav-link--active" : "")}>History</NavLink>
          <NavLink to="/users" className={({ isActive }) => "nav-link" + (isActive ? " nav-link--active" : "")}>Users</NavLink>
          
          {isLoggedIn && (
            <button className="nav-link logout-btn" onClick={onLogout}>🚪 로그아웃</button>
          )}
        </nav>
      </header>

      <main className="app-main">{children}</main>
    </>
  );
}

/* ---------- App Root ---------- */

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsLoggedIn(false);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <BrowserRouter>
      {isLoggedIn ? (
        <Layout isLoggedIn={isLoggedIn} onLogout={handleLogout}>
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
            
            {/* 상세 페이지 라우트 */}
            <Route path="/charts/year/:year" element={<ChartsYearPage />} />
            <Route path="/user/:userId" element={<UserPage />} />
            <Route path="/artist/:artistId" element={<ArtistPage />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="/" element={<HomePage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<HomePage onLoginSuccess={handleLoginSuccess} />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}