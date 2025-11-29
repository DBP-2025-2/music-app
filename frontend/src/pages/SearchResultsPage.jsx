// frontend/src/pages/SearchPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";
import HeartIcon from "../components/HeartIcon";
import "../styles/search.css";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function SearchPage() {
  const qs = useQuery();
  const navigate = useNavigate();

  const initialQ = qs.get("q") || "";
  const [keyword, setKeyword] = useState(initialQ);

  const [activeTab, setActiveTab] = useState("songs"); // songs | artists | albums | all

  const [songResults, setSongResults] = useState([]);
  const [artistResults, setArtistResults] = useState([]);
  const [albumResults, setAlbumResults] = useState([]);
  const [playlistResults, setPlaylistResults] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 팔로우 정보
  const [followedArtistIds, setFollowedArtistIds] = useState(new Set());

  // 플리 모달
  const [playlistPickerOpen, setPlaylistPickerOpen] = useState(false);
  const [playlistPickerLoading, setPlaylistPickerLoading] = useState(false);
  const [playlistPickerError, setPlaylistPickerError] = useState("");
  const [myPlaylists, setMyPlaylists] = useState([]);
  const [targetSongId, setTargetSongId] = useState(null);

  // URL q 가 바뀔 때마다 검색
  useEffect(() => {
    const q = qs.get("q") || "";
    setKeyword(q);
    if (!q.trim()) {
      setSongResults([]);
      setArtistResults([]);
      setAlbumResults([]);
      setPlaylistResults([]);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError("");

        // 🔹 곡 / 아티스트 / 앨범 각각 호출
        const [songsData, artistsData, albumsData] = await Promise.all([
          fetchJson(`${API}/songs/search?q=${encodeURIComponent(q)}`),
          fetchJson(`${API}/artists/search?q=${encodeURIComponent(q)}`),
          fetchJson(`${API}/albums/search?q=${encodeURIComponent(q)}`),
        ]);

        const songsRaw =
          songsData.songs || songsData.songResults || songsData || [];
        const artistsRaw = artistsData.artists || artistsData || [];
        const albumsRaw = albumsData.albums || albumsData || [];
        const playlistsRaw = []; // 지금은 안 씀

const normSongs = songsRaw.map((s, idx) => ({
  id: s.id ?? s.song_id ?? idx,
  title: s.title ?? s.song_title ?? "",
  artistName: s.artistName ?? s.artist_name ?? "",
  albumTitle: s.albumTitle ?? s.album_title ?? "",

  // 🔥 서버에서 온 값을 그대로 boolean 으로
  userLiked: !!(s.user_liked ?? s.userLiked),
  totalLikes: s.total_likes ?? s.totalLikes ?? 0,
}));

        const normArtists = artistsRaw.map((a, idx) => ({
          id: a.artist_id ?? a.id ?? idx,
          name: a.name ?? "",
          followCount: a.followCount ?? a.follow_count ?? 0,
        }));

        const normAlbums = albumsRaw.map((al, idx) => ({
          id: al.album_id ?? al.id ?? idx,
          title: al.title ?? "",
          artistName:
            al.artist_name ??
            al.artistName ??
            al.artist_main_name ??
            "아티스트 정보 없음",
          year:
            al.year ??
            al.release_year ??
            (al.created_at ? new Date(al.created_at).getFullYear() : null),
        }));

        setSongResults(normSongs);
        setArtistResults(normArtists);
        setAlbumResults(normAlbums);
        setPlaylistResults(playlistsRaw);
      } catch (e) {
        console.error(e);
        setError(e.message || "검색 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs.toString()]);


  // 내 팔로우 아티스트 목록
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchJson(`${API}/follows/list`);
        const follows = res?.follows ?? [];
        const ids = follows
          .filter((f) => f.target_type === "artist")
          .map(
            (f) =>
              f.following_id ??
              f.followingId ??
              f.artist_id ??
              f.target_id
          )
          .filter((v) => v != null);
        setFollowedArtistIds(new Set(ids));
      } catch (e) {
        console.warn("팔로우 목록 불러오기 실패(검색페이지):", e);
      }
    })();
  }, []);

  // 검색 submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  // ─────────────────────────────
  // 곡: 재생(= 재생기록에 한 곡 추가)
  // ─────────────────────────────
const handlePlaySong = async (song) => {
  try {
    await fetchJson(`${API}/play-history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ song_id: song.id }),   // 히스토리 기록
    });

    // 🔥 페이지 이동 없이 알림만
    alert(`🎵 '${song.title}' 재생 시작!`);
  } catch (e) {
    alert(e.message || "재생 실패");
  }
};

  // 좋아요 토글
  const handleLikeToggle = async (songId) => {
    try {
      const result = await fetchJson("/likes/toggle", {
        method: "POST",
        body: JSON.stringify({ songId }),
      });

      setSongResults((prev) =>
        prev.map((s) => {
          if (s.id !== songId) return s;
          const likedNow = result.liked ? 1 : 0;
          const diff = result.liked ? 1 : -1;
          return {
            ...s,
            userLiked: likedNow,
            totalLikes: (s.totalLikes ?? 0) + diff,
          };
        })
      );
    } catch (e) {
      console.error(e);
      alert(e.message || "좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  // 플리 추가 모달 열기
  const handleAddToPlaylist = async (songId) => {
    try {
      setTargetSongId(songId);
      setPlaylistPickerOpen(true);
      setPlaylistPickerError("");
      setPlaylistPickerLoading(true);

      const data = await fetchJson("/playlists");
      setMyPlaylists(data);
    } catch (e) {
      console.error(e);
      setPlaylistPickerError(
        e.message || "플레이리스트 목록을 불러오는데 실패했습니다."
      );
    } finally {
      setPlaylistPickerLoading(false);
    }
  };

  const handleSelectPlaylistForSong = async (playlistId) => {
    if (!targetSongId) return;

    try {
      await fetchJson(`/playlists/${playlistId}/items`, {
        method: "POST",
        body: JSON.stringify({ songId: targetSongId }),
      });
      alert("플레이리스트에 곡이 추가되었습니다. 🎵");
      setPlaylistPickerOpen(false);
      setTargetSongId(null);
    } catch (e) {
      console.error(e);
      alert(e.message || "플레이리스트에 곡을 추가하는 데 실패했습니다.");
    }
  };

  // 아티스트 팔로우 토글 (ArtistsPage 와 동일 로직)
  const toggleFollowArtist = async (artist) => {
    const isFollowed = followedArtistIds.has(artist.id);
    try {
      if (isFollowed) {
        await fetchJson(`${API}/follows`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            following_id: artist.id,
            target_type: "artist",
          }),
        });
      } else {
        await fetchJson(`${API}/follows`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_input: artist.name,
            target_type: "artist",
          }),
        });
      }

      setFollowedArtistIds((prev) => {
        const next = new Set(prev);
        if (isFollowed) next.delete(artist.id);
        else next.add(artist.id);
        return next;
      });
    } catch (e) {
      console.error(e);
      alert(e.message || "팔로우 처리 중 오류가 발생했습니다.");
    }
  };

  const totalCount = useMemo(
    () =>
      songResults.length +
      artistResults.length +
      albumResults.length +
      playlistResults.length,
    [songResults, artistResults, albumResults, playlistResults]
  );

  return (
    <div className="content-page search-page">
      <div className="content-container">
        {/* 상단 검색바 + 탭 */}
        <div className="search-header">
          

          <div className="search-tabs">
              <button
              className={
                "search-tab" + (activeTab === "all" ? " active" : "")
              }
              onClick={() => setActiveTab("all")}
            >
              전체 ({totalCount})
            </button>
            <button
              className={
                "search-tab" + (activeTab === "songs" ? " active" : "")
              }
              onClick={() => setActiveTab("songs")}
            >
              곡 ({songResults.length})
            </button>
            <button
              className={
                "search-tab" + (activeTab === "artists" ? " active" : "")
              }
              onClick={() => setActiveTab("artists")}
            >
              아티스트 ({artistResults.length})
            </button>
            <button
              className={
                "search-tab" + (activeTab === "albums" ? " active" : "")
              }
              onClick={() => setActiveTab("albums")}
            >
              앨범 ({albumResults.length})
            </button>
          </div>
        </div>

        {/* 상태 표시 */}
        {error && (
          <div className="error-message" style={{ marginTop: 16 }}>
            <span>❗</span>
            <span>{error}</span>
          </div>
        )}
        {loading && (
          <div className="empty-state" style={{ marginTop: 16 }}>
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-text">검색 중입니다...</div>
          </div>
        )}

        {!loading && !error && !keyword.trim() && (
          <div className="empty-state" style={{ marginTop: 24 }}>
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-text">
              검색어를 입력하고 결과를 확인해 보세요.
            </div>
          </div>
        )}

        {!loading && !error && keyword.trim() && totalCount === 0 && (
          <div className="empty-state" style={{ marginTop: 24 }}>
            <div className="empty-state-icon">😢</div>
            <div className="empty-state-text">검색 결과가 없습니다.</div>
          </div>
        )}

        {/* ===== 곡 탭 / 전체 탭에서 노래 리스트  ===== */}
        {(activeTab === "songs" || activeTab === "all") &&
          songResults.length > 0 && (
            <section className="search-section">
              <h2 className="search-section-title">곡</h2>
              <table className="data-table search-song-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>곡명</th>
                    <th>아티스트</th>
                    <th>앨범</th>
                    <th style={{ width: 140 }}>재생/좋아요/플리</th>
                  </tr>
                </thead>
                <tbody>
                  {songResults.map((s, idx) => (
                    <tr key={s.id} className="search-song-row">
                      <td className="search-song-rank">{idx + 1}</td>
                      <td className="search-song-title">{s.title}</td>
                      <td className="search-song-artist">{s.artistName}</td>
                      <td className="search-song-album">{s.albumTitle}</td>
                      <td>
                        <div className="search-song-actions">
                          <button
                            className="btn primary"
                            onClick={() => handlePlaySong(s)}
                            title="재생"
                            style={{
                            padding: "6px 10px",
                            fontSize: "10px",
                            }}
                          >
                             ▶️ 
                          </button>

                          <button
                            className={
                              "like-button" +
                              (s.userLiked ? " like-button--active" : "")
                            }
                            onClick={() => handleLikeToggle(s.id)}
                            title="좋아요"
                          >
                            <HeartIcon filled={s.userLiked} size={16} />
                            <span className="like-count">
                              {s.totalLikes ?? 0}
                            </span>
                          </button>

                          <button
                            className="playlist-button"
                            onClick={() => handleAddToPlaylist(s.id)}
                            title="플레이리스트에 추가"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

        {/* ===== 아티스트 탭 / 전체 탭 ===== */}
        {(activeTab === "artists" || activeTab === "all") &&
          artistResults.length > 0 && (
            <section className="search-section">
              <h2 className="search-section-title">아티스트</h2>
              <ul className="search-artist-list">
                {artistResults.map((a) => {
                  const isFollowed = followedArtistIds.has(a.id);
                  return (
                    <li key={a.id} className="search-artist-row">
                      <div className="artist-thumb search-artist-thumb">
                        <div className="artist-thumb-inner">
                          <span className="artist-thumb-name">{a.name}</span>
                        </div>
                      </div>
                      <div className="search-artist-main">
                        <div className="artist-name-line">
                          <span className="artist-name">{a.name}</span>
                          <span className="artist-id">#{a.id}</span>
                        </div>
                        <div className="artist-meta">
                          팔로워{" "}
                          <strong>
                             {typeof a.followCount === "number" ? a.followCount : 0}
                          </strong>
                          명
                        </div>
                      </div>
                      <div className="search-artist-actions">
                        <button
                          className={
                            "artist-follow-btn" +
                            (isFollowed ? " artist-follow-btn--active" : "")
                          }
                          onClick={() => toggleFollowArtist(a)}
                        >
                          {isFollowed ? "팔로잉" : "팔로우"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

        {/* ===== 앨범 탭 / 전체 탭 ===== */}
        {(activeTab === "albums" || activeTab === "all") &&
          albumResults.length > 0 && (
            <section className="search-section">
              <h2 className="search-section-title">앨범</h2>
<ul className="search-album-list">
  {albumResults.map((al) => (
    <li key={al.id} className="search-album-row">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* 💿 썸네일 박스 (첫 번째 디자인) */}
        <div
          style={{
            width: "80px",
            height: "80px",
            backgroundColor: "#ddd",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            flexShrink: 0,
          }}
        >
          💿
        </div>

        {/* 앨범 제목 + 아티스트 · 연도 */}
        <div>
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "1.05rem",
              fontWeight: 600,
            }}
          >
            {al.title}
          </h3>
          <p
            style={{
              margin: 0,
              color: "#666",
              fontSize: "0.95rem",
            }}
          >
            {al.artistName}
            {al.year && <> · {al.year}</>}
          </p>
        </div>
      </div>
    </li>
  ))}
</ul>

            </section>
          )}
      </div>

      {/* ─────────────────────────────
          플리 선택 모달 (ArtistsPage와 동일 스타일)
      ───────────────────────────── */}
      {playlistPickerOpen && (
        <div className="playlist-modal-backdrop">
          <div className="playlist-modal">
            <h3 className="playlist-modal-title">플레이리스트에 추가</h3>

            {playlistPickerLoading && (
              <p className="text-muted">플레이리스트 불러오는 중...</p>
            )}

            {playlistPickerError && (
              <p className="text-error">⚠ {playlistPickerError}</p>
            )}

            {!playlistPickerLoading && myPlaylists.length === 0 && (
              <p className="text-muted">
                아직 생성된 플레이리스트가 없습니다. <br />
                먼저 플레이리스트를 만들어 주세요.
              </p>
            )}

            {!playlistPickerLoading && myPlaylists.length > 0 && (
              <ul className="playlist-modal-list">
                {myPlaylists.map((pl) => {
                  const isPublic = pl.isPublic ?? pl.is_public ?? true;
                  return (
                    <li key={pl.id} className="playlist-modal-item">
                      <button
                        type="button"
                        onClick={() => handleSelectPlaylistForSong(pl.id)}
                      >
                        <span className="playlist-modal-name">
                          #{pl.id} {pl.name}
                        </span>
                        <span
                          className={
                            "playlist-modal-badge " +
                            (isPublic
                              ? "playlist-modal-badge--public"
                              : "playlist-modal-badge--private")
                          }
                        >
                          {isPublic ? "공개" : "비공개"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              className="playlist-modal-close"
              onClick={() => {
                setPlaylistPickerOpen(false);
                setTargetSongId(null);
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
