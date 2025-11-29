// frontend/src/pages/MainPage.jsx
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { fetchJson } from "../lib/http";
import { API } from "../lib/api";
import "../styles/mainpage.css";

export default function MainPage() {
  const [latestAlbums, setLatestAlbums] = useState([]);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [popularArtists, setPopularArtists] = useState([]);
  const [recentPlaylists, setRecentPlaylists] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        /* -------------------- 1) 가장 최신 차트 주차 -------------------- */
        const periods = await fetchJson("/charts/periods");
        let weekly = [];
        if (Array.isArray(periods) && periods.length > 0) {
          const { year, week } = periods[0]; // 가장 최신 주차
          weekly = await fetchJson(
            `/charts/weekly?year=${year}&week=${week}&type=weekly`
          );
        }

        /* ---------------- 2) 앨범 / 아티스트 / 플리 / 히스토리 ---------------- */
        const [albumsRes, artistsRes, playlistsRes, historyRes] =
          await Promise.all([
            fetchJson(`${API}/albums`),
            fetchJson(`${API}/artists`),
            fetchJson("/playlists"),
            // play-history GET 없으면 에러 무시
            fetchJson(`${API}/play-history/list`).catch(() => ({
              history: [],
            })),
          ]);

        console.log("albumsRes[0] =", albumsRes[0]);
        console.log("playlistsRes[0] =", playlistsRes[0]);
        /* -------------------- 곡 차트 (Top 13) -------------------- */
        const trending = (weekly || []).slice(0, 13).map((row, index) => ({
          id: row.song_id ?? row.id ?? index,
          title: row.song_title ?? row.title ?? "",
          artist: row.artist_name ?? "",
        }));
        setTrendingSongs(trending);

        /* -------------------- 최신 음악 (앨범) -------------------- */
        // ERD 기준: albums (album_id, title, artist_main_id, created_at)
        // -> getAlbums() 가 album_id / title / created_at 만 주더라도 동작하도록 함
        const albums = Array.isArray(albumsRes) ? albumsRes : [];

        const albumsSorted = [...albums].sort((a, b) => {
          const da = new Date(a.created_at || a.createdAt || 0).getTime();
          const db = new Date(b.created_at || b.createdAt || 0).getTime();
          return db - da;
        });

        setLatestAlbums(
          albumsSorted.slice(0, 7).map((a, idx) => ({
            id: a.album_id ?? a.id ?? idx,
            title: a.title ?? "",
            // 🔽 아티스트 이름이 있으면 사용, 없으면 아예 표시 안 함
            artist:
              a.artist_main_name ??
              a.artistName ??
              a.artist_name ??
              "",
          }))
        );

        /* -------------------- 인기 아티스트 (Top 12) -------------------- */
        // ERD 기준: artists (artist_id, name, ...)
        const artists = Array.isArray(artistsRes) ? artistsRes : [];
        const artistsSorted = [...artists].sort(
          (a, b) => (b.followCount || 0) - (a.followCount || 0)
        );

        setPopularArtists(
          artistsSorted.slice(0, 12).map((ar, idx) => ({
            id: ar.artist_id ?? ar.id ?? idx,
            name: ar.name ?? "",
          }))
        );

        /* -------------------- 내 플레이리스트 일부 -------------------- */
        // ERD 기준: playlists (playlist_id, user_id, name, is_public, created_at, updated_at)
        // song 개수는 보통 getPlaylists() 에서 COUNT(*) 로 alias 를 달아줄 것이라 가정.
        const playlists = Array.isArray(playlistsRes) ? playlistsRes : [];

        setRecentPlaylists(
          playlists.slice(0, 3).map((pl, idx) => {
            const songCount =
              pl.song_count ?? // MySQL alias 형태
              pl.songCount ??
              pl.total_songs ??
              pl.totalSongs ??
              pl.track_count ??
              pl.trackCount ??
              pl.count ??
              0;

            return {
              id: pl.playlist_id ?? pl.id ?? idx,
              name: pl.name ?? "",
              count: songCount,
            };
          })
        );

        /* -------------------- 최근 재생 기록 -------------------- */
        // ERD 기준: play_history (history_id, user_id, song_id, played_at)
        const history = Array.isArray(historyRes?.history)
          ? historyRes.history
          : [];

        if (history.length > 0) {
          setRecentHistory(
            history.slice(0, 3).map((h, idx) => ({
              id: h.song_id ?? idx,
              title: h.song_title ?? h.title ?? "",
              artist: h.artist_name ?? "",
            }))
          );
        } else {
          // 재생 기록이 없으면 차트 상위 3곡 재사용
          setRecentHistory(
            trending.slice(0, 3).map((s, idx) => ({
              id: s.id ?? idx,
              title: s.title,
              artist: s.artist,
            }))
          );
        }
      } catch (e) {
        console.error(e);
        setError(e.message || "메인 데이터를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ============================ 렌더링 ============================ */

  return (
    <div className="content-page main-page clean-main">
      <div className="content-container main-container">
        {/* 로딩 / 에러 */}
        {error && (
          <div className="error-message" style={{ marginBottom: 16 }}>
            <span>❗</span>
            <span>{error}</span>
          </div>
        )}
        {loading && (
          <div className="empty-state" style={{ marginBottom: 16 }}>
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-text">
              메인 화면 데이터를 불러오는 중입니다...
            </div>
          </div>
        )}

        {/* 1. 최신 음악 */}
        <section className="card main-section">
          <div className="main-section-header">
            <h2>최신 음악</h2>
            <NavLink to="/albums" className="main-link-button">
              앨범 전체 보기
            </NavLink>
          </div>

          <div className="album-row">
            
            {latestAlbums.map((album) => (
              
              <div key={album.id} className="album-card">
                
        <div
          className="album-cover"
  style={{
    width: "150px",
    height: "140px",
    backgroundColor: "#ddd",
    borderRadius: "12px",
    overflow: "hidden",
    position: "relative",
  }}
>
  <span
    style={{
      fontSize: "5rem",
      position: "absolute",
      bottom: "23px",    // 🔽 숫자로 높이 조절
      left: "50%",
      transform: "translateX(-50%)",
      opacity: 0.8,
    }}
  >
    💿
    </span>
        </div>
                <div className="album-meta">
                  
                  <div className="album-title">{album.title}</div>
                  {/* 🔽 artist 값이 있을 때만 한 줄 추가 */}
                  {album.artist && (
                    <div className="album-artist">{album.artist}</div>
                  )}
                </div>
              </div>
            ))}
            {latestAlbums.length === 0 && !loading && (
              <div className="main-empty-text">표시할 앨범이 없습니다.</div>
            )}
          </div>
        </section>

        {/* 2. 곡 차트 + 오른쪽 패널 */}
        <div className="main-grid-2">
          {/* 곡 차트 */}
          <section className="card main-section">
            <div className="main-section-header">
              <h2>곡 차트</h2>
              <NavLink to="/charts" className="main-link-button">
                차트 전체 보기
              </NavLink>
            </div>

            <table className="data-table chart-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>순위</th>
                  <th>곡명</th>
                  <th>아티스트</th>
                </tr>
              </thead>
              <tbody>
                {trendingSongs.map((song, idx) => (
                  <tr key={song.id}>
                    <td>{idx + 1}</td>
                    <td>{song.title}</td>
                    <td>{song.artist}</td>
                  </tr>
                ))}
                {trendingSongs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center" }}>
                      차트 데이터를 불러오지 못했습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* 오른쪽: 내 활동 */}
          <aside className="main-side">
            <section className="card main-section main-side-card">
              <h3 className="main-side-title">나의 뮤직 활동</h3>
              <p className="main-side-text">
                최근 재생한 곡과 내가 만든 플레이리스트를 한 번에 확인해
                보세요.
              </p>

              {/* 최근 재생한 곡 */}
              <div className="main-side-block">
                <h4>최근 재생한 곡</h4>
                <ul className="main-simple-list">
                  {recentHistory.map((song) => (
                    <li key={song.id}>
                      <span className="main-simple-title">{song.title}</span>
                      <span className="main-simple-sub">{song.artist}</span>
                    </li>
                  ))}
                  {recentHistory.length === 0 && !loading && (
                    <li className="main-simple-sub">재생 기록이 없습니다.</li>
                  )}
                </ul>
              </div>

              {/* 내 플레이리스트 */}
              <div className="main-side-block">
                <h4>내 플레이리스트</h4>
                <ul className="main-simple-list">
                  {recentPlaylists.map((pl) => (
                    <li key={pl.id}>
                      <span className="main-simple-title">{pl.name}</span>
                      <span className="main-simple-sub">
                        {pl.count > 0 ? `곡 ${pl.count}곡` : "곡 수 정보 없음"}
                      </span>
                    </li>
                  ))}
                  {recentPlaylists.length === 0 && !loading && (
                    <li className="main-simple-sub">
                      아직 생성한 플레이리스트가 없습니다.
                    </li>
                  )}
                </ul>
              </div>

              <div className="main-side-links">
                <NavLink to="/history" className="side-link">
                  재생 히스토리 보기
                </NavLink>
                <NavLink to="/likes" className="side-link">
                  내 좋아요 목록
                </NavLink>
              </div>
            </section>
          </aside>
        </div>

        {/* 3. 라이브러리 & 기능 */}
        <section className="card main-section">
          <div className="main-section-header">
            <h2>라이브러리 & 기능</h2>
          </div>

          <div className="shortcut-grid">
            <NavLink to="/artists" className="shortcut-card">
              <span className="shortcut-label">아티스트</span>
              <span className="shortcut-desc">내가 좋아하는 가수들 관리</span>
            </NavLink>
            <NavLink to="/songs" className="shortcut-card">
              <span className="shortcut-label">노래</span>
              <span className="shortcut-desc">모든 곡 목록 보기</span>
            </NavLink>
            <NavLink to="/albums" className="shortcut-card">
              <span className="shortcut-label">앨범</span>
              <span className="shortcut-desc">앨범별로 정리해서 듣기</span>
            </NavLink>
            <NavLink to="/playlists" className="shortcut-card">
              <span className="shortcut-label">플레이리스트</span>
              <span className="shortcut-desc">내 플레이리스트 관리</span>
            </NavLink>
            <NavLink to="/charts" className="shortcut-card">
              <span className="shortcut-label">차트</span>
              <span className="shortcut-desc">주간 / 연도별 인기곡</span>
            </NavLink>
            <NavLink to="/follows" className="shortcut-card">
              <span className="shortcut-label">팔로우</span>
              <span className="shortcut-desc">아티스트 / 유저 팔로우</span>
            </NavLink>
            <NavLink to="/history" className="shortcut-card">
              <span className="shortcut-label">히스토리</span>
              <span className="shortcut-desc">최근 재생 기록</span>
            </NavLink>
            <NavLink to="/users" className="shortcut-card">
              <span className="shortcut-label">내 정보</span>
              <span className="shortcut-desc">개인정보 / 계정 관리</span>
            </NavLink>
          </div>
        </section>

{/* 4. 인기 아티스트 */}
<section className="card main-section">
  <div className="main-section-header">
    <h2>인기 아티스트</h2>
    <NavLink to="/artists" className="main-link-button">
      아티스트 전체 보기
    </NavLink>
  </div>

  <div className="artist-row">
    {popularArtists.map((artist) => {
      // 괄호(...) 제거한 이름
      const displayName =
        (artist.name || "").replace(/\(.*?\)/g, "").trim() || artist.name || "?";

      return (
        <div key={artist.id} className="artist-card">
          <div className="artist-avatar">
            {/* 🔽 원 안에 전체 이름(괄호 제외) 출력 */}
            <span className="artist-avatar-text">{displayName}</span>
          </div>
          <div className="artist-name">{artist.name}</div>
          <div className="artist-label">아티스트</div>
        </div>
      );
    })}
    {popularArtists.length === 0 && !loading && (
      <div className="main-empty-text">
        인기 아티스트 데이터를 불러오지 못했습니다.
      </div>
    )}
  </div>
</section>

      </div>
    </div>
  );
}
