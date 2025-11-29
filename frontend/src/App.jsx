// frontend/src/App.jsx
import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useNavigate,
} from "react-router-dom";

import MainPage from "./pages/MainPage";
import HomePage from "./pages/HomePage";
import SearchResultsPage from "./pages/SearchResultsPage"; // 상단 import 추가
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

import AlbumDetailPage from "./pages/AlbumDetailPage";
import UserPage from "./pages/UserPage";
import ArtistPage from "./pages/ArtistPage";
import LikesPage from "./pages/LikesPage";





/* ---------- 공통 레이아웃 ---------- */

function Layout({ children, isLoggedIn, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState("");   // 🔹 추가
  
  const navigate = useNavigate();

    // 🔍 검색 실행 함수
  function handleSearchSubmit(e) {
    if (e) e.preventDefault();

    const q = searchKeyword.trim();
    if (!q) return;

    navigate(`/search?q=${encodeURIComponent(q)}&tab=all`);
  }

  // 차트 연도 (사이드바용)
  const chartYears = [];
  for (let y = 2010; y <= 2023; y++) chartYears.push(y);

  return (
    <>
      {/* 상단 남색 헤더 */}
      <header className="app-header">
        <div className="app-header-left">
          {/* 햄버거 버튼 */}
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

          {/* 로고 */}
          <Link to="/" className="app-title">
            <img src="/logo.png" alt="MusicHub Logo" className="main-logo" />
          </Link>
        </div>

        <nav className="app-nav">
          {isLoggedIn && (
            <button className="nav-link logout-btn" onClick={onLogout}>
              로그아웃
            </button>
          )}
        </nav>
      </header>

      {/* 🔽 흰색 서브헤더 (멜론 스타일 검색 + 상단 탭) */}
      {isLoggedIn && (
        <div className="app-subheader">
          <div className="app-subheader-inner">
            {/* 검색박스 */}
<form className="app-search-wrap" onSubmit={handleSearchSubmit}>
  <div className="app-search-bar">
    <input
      className="app-search-input"
      placeholder="아티스트, 곡, 앨범을 검색해 보세요"
      value={searchKeyword}
      onChange={(e) => setSearchKeyword(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleSearchSubmit(e);
        }
      }}
    />
    <button type="submit" className="app-search-btn">
      검색
    </button>
  </div>
</form>


            {/* 상단 탭 메뉴 */}
            <nav className="app-subnav">
              <NavLink
                to="/artists"
                className={({ isActive }) =>
                  "app-subnav-link" +
                  (isActive ? " app-subnav-link--active" : "")
                }
              >
                아티스트
              </NavLink>
              <NavLink
                to="/songs"
                className={({ isActive }) =>
                  "app-subnav-link" +
                  (isActive ? " app-subnav-link--active" : "")
                }
              >
                노래
              </NavLink>
              <NavLink
                to="/albums"
                className={({ isActive }) =>
                  "app-subnav-link" +
                  (isActive ? " app-subnav-link--active" : "")
                }
              >
                앨범
              </NavLink>
              <NavLink
                to="/playlists"
                className={({ isActive }) =>
                  "app-subnav-link" +
                  (isActive ? " app-subnav-link--active" : "")
                }
              >
                플레이리스트
              </NavLink>
              <NavLink
                to="/charts"
                className={({ isActive }) =>
                  "app-subnav-link" +
                  (isActive ? " app-subnav-link--active" : "")
                }
              >
                차트
              </NavLink>
            </nav>
          </div>
        </div>
      )}

      {/* 왼쪽 사이드 메뉴 */}
      <aside
        className={"app-sidebar" + (menuOpen ? " app-sidebar--open" : "")}
      >
        <button
          type="button"
          className="sidebar-close"
          onClick={() => setMenuOpen(false)}
        >
          ✕
        </button>

        {/* 라이브러리 */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">라이브러리</div>
          <NavLink
            to="/artists"
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " sidebar-link--active" : "")
            }
            onClick={() => setMenuOpen(false)}
          >
            아티스트
          </NavLink>
          <NavLink
            to="/songs"
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " sidebar-link--active" : "")
            }
            onClick={() => setMenuOpen(false)}
          >
            곡(노래)
          </NavLink>
          <NavLink
            to="/albums"
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " sidebar-link--active" : "")
            }
            onClick={() => setMenuOpen(false)}
          >
            앨범
          </NavLink>
          <NavLink
            to="/playlists"
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " sidebar-link--active" : "")
            }
            onClick={() => setMenuOpen(false)}
          >
            플레이리스트
          </NavLink>
        </div>

        {/* 차트 */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">차트</div>
          <NavLink
            to="/charts"
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " sidebar-link--active" : "")
            }
            onClick={() => setMenuOpen(false)}
          >
            주간 차트
          </NavLink>

          <div className="sidebar-subtitle">년도별 인기곡 TOP 20</div>
          <div className="sidebar-year-list">
            {chartYears.map((year) => (
              <NavLink
                key={year}
                to={`/charts/year/${year}`} // ⚡ 연도별 차트도 ChartsPage가 처리
                className={({ isActive }) =>
                  "sidebar-year-pill" +
                  (isActive ? " sidebar-year-pill--active" : "")
                }
                onClick={() => setMenuOpen(false)}
              >
                {year}
              </NavLink>
            ))}
          </div>
        </div>

        {/* 소셜 & 활동 */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">소셜 & 활동</div>
          <NavLink
            to="/follows"
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " sidebar-link--active" : "")
            }
            onClick={() => setMenuOpen(false)}
          >
            팔로우
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " sidebar-link--active" : "")
            }
            onClick={() => setMenuOpen(false)}
          >
            재생 히스토리
          </NavLink>
        </div>

        {/* 내 계정 */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">내 계정</div>
          <NavLink
            to="/users"
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " sidebar-link--active" : "")
            }
            onClick={() => setMenuOpen(false)}
          >
            개인정보 변경
          </NavLink>
          <NavLink
            to="/likes"
            className={({ isActive }) =>
              "sidebar-link" + (isActive ? " sidebar-link--active" : "")
            }
            onClick={() => setMenuOpen(false)}
          >
            내 좋아요 목록
          </NavLink>
        </div>
      </aside>

      {menuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
        />
      )}

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
            {/* 메인 대시보드 */}
            <Route path="/" element={<MainPage />} />

            {/* 라이브러리 */}
            <Route path="/artists" element={<ArtistsPage />} />
            <Route path="/songs" element={<SongsPage />} />
            <Route path="/albums" element={<AlbumsPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />

            {/* 차트 – 주간 & 연도별 TOP 20 (같은 컴포넌트 사용) */}
            <Route path="/charts" element={<ChartsPage />} />
            <Route path="/charts/year/:year" element={<ChartsPage />} />

            {/* 소셜 & 활동 */}
            <Route path="/follows" element={<FollowsPage />} />
            <Route path="/history" element={<HistoryPage />} />

            {/* 내 계정 / 좋아요 */}
            <Route path="/users" element={<UsersPage />} />           

            {/* 상세 페이지들 */}
            <Route path="/user/:userId" element={<UserPage />} />
            <Route path="/artist/:artistId" element={<ArtistPage />} />
            <Route path="/album/:id" element={<AlbumDetailPage />} />
            <Route path="/likes" element={<LikesPage />} />

            {/* 🔍 검색 결과 */}
            <Route path="/search" element={<SearchResultsPage />} />

            {/* 잘못된 URL → 메인으로 */}
            <Route path="*" element={<MainPage />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          {/* 로그인 전 랜딩 페이지 */}
          <Route
            path="/"
            element={<HomePage onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="*"
            element={<HomePage onLoginSuccess={handleLoginSuccess} />}
          />
        </Routes>
      )}
    </BrowserRouter>
  );
}
