import { useEffect, useMemo, useState } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function SongsPage() {
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [title, setTitle] = useState("");
  const [artistId, setArtistId] = useState("");
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtistId, setEditArtistId] = useState("");
  const [filterArtist, setFilterArtist] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("title-asc");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(null);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [songCharts, setSongCharts] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  // 플레이리스트 모달
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [targetSongId, setTargetSongId] = useState(null);
  const [myPlaylists, setMyPlaylists] = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState("");
  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [currentPageGroup, setCurrentPageGroup] = useState(1);

  const loadAll = async () => {
    try {
      setError("");
      setLoading(true);
      const [s, a] = await Promise.all([
        fetchJson(
          `${API}/songs${filterArtist ? `?artistId=${filterArtist}` : ""}`
        ),
        fetchJson(`${API}/artists`),
      ]);
      setSongs(s);
      setArtists(a);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    setCurrentPage(1);
    setCurrentPageGroup(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterArtist, q, sort]);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim() || !artistId) return;
    try {
      setBusy(true);
      await fetchJson(`${API}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, artistId: Number(artistId) }),
      });
      setTitle("");
      setArtistId("");
      await loadAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (id) => {
    if (!editTitle.trim() || !editArtistId) return;
    try {
      setBusy(true);
      await fetchJson(`${API}/songs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          artistId: Number(editArtistId),
        }),
      });
      setEditId(null);
      setEditTitle("");
      setEditArtistId("");
      await loadAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("삭제할까요?")) return;
    try {
      setBusy(true);
      await fetchJson(`${API}/songs/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePlay = async (song) => {
    try {
      setPlaying(song.id);
      await fetchJson(`${API}/play-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: song.id }),
      });
      alert(`🎵 '${song.title}' 재생 시작!`);
      setPlaying(null);
    } catch (e) {
      alert(e.message || "재생 실패");
      setPlaying(null);
    }
  };

  const loadRecommendations = async () => {
    try {
      setRecommendationsLoading(true);
      
      // 차트 기반 인기곡 바로 로드
      console.log(`🔥 인기곡을 가져옵니다...`);
      const popularSongs = await fetchJson(`${API}/songs/popular?limit=10`);
      
      if (popularSongs && popularSongs.length > 0) {
        console.log(`✅ 인기곡 ${popularSongs.length}개 획득`);
        console.log(
          `🎯 인기곡 데이터:`,
          popularSongs.map((r) => `${r.title} (${r.artistName})`).join(", ")
        );
        setRecommendations(popularSongs);
      } else {
        setRecommendations([]);
      }
    } catch (e) {
      console.error("❌ 인기곡 로드 에러:", e);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleOpenDetail = async (song) => {
    try {
      setSelectedSong(song);
      setDetailModalOpen(true);
      setChartsLoading(true);
      const charts = await fetchJson(`${API}/songs/${song.id}/charts`);
      setSongCharts(charts || []);
    } catch (e) {
      console.error(e);
      setSongCharts([]);
    } finally {
      setChartsLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedSong(null);
    setSongCharts([]);
  };

  // 플레이리스트 모달 열기
  const handleOpenPlaylistModal = async (songId) => {
    try {
      setTargetSongId(songId);
      setPlaylistModalOpen(true);
      setPlaylistError("");
      setPlaylistLoading(true);
      const data = await fetchJson(`${API}/playlists`);
      setMyPlaylists(data);
    } catch (e) {
      console.error(e);
      setPlaylistError(
        e.message || "플레이리스트 목록을 불러오는데 실패했습니다."
      );
    } finally {
      setPlaylistLoading(false);
    }
  };

  // 플레이리스트에 곡 추가
  const handleAddToPlaylist = async (playlistId) => {
    if (!targetSongId) return;
    try {
      await fetchJson(`${API}/playlists/${playlistId}/items`, {
        method: "POST",
        body: JSON.stringify({ songId: targetSongId }),
      });
      alert("플레이리스트에 곡이 추가되었습니다. 🎵");
      setPlaylistModalOpen(false);
      setTargetSongId(null);
    } catch (e) {
      console.error(e);
      alert(e.message || "곡 추가에 실패했습니다.");
    }
  };

  // 플레이리스트 모달 닫기
  const handleClosePlaylistModal = () => {
    setPlaylistModalOpen(false);
    setTargetSongId(null);
    setMyPlaylists([]);
    setPlaylistError("");
  };

  // 전체 필터/정렬된 데이터
  const allSongs = useMemo(() => {
    let data = songs;
    const t = q.trim().toLowerCase();
    if (t) data = data.filter((s) => s.title.toLowerCase().includes(t));
    const [k, dir] = sort.split("-");
    data = [...data].sort((a, b) => {
      const A = String(a[k]).toLowerCase();
      const B = String(b[k]).toLowerCase();
      if (A < B) return dir === "asc" ? -1 : 1;
      if (A > B) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [songs, q, sort]);

  // 현재 페이지의 곡들
  const view = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return allSongs.slice(start, end);
  }, [allSongs, currentPage, itemsPerPage]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(allSongs.length / itemsPerPage);
  const pageGroupSize = 5;
  const startPageOfGroup = (currentPageGroup - 1) * pageGroupSize + 1;
  const endPageOfGroup = Math.min(
    startPageOfGroup + pageGroupSize - 1,
    totalPages
  );
  const pageNumbers = Array.from(
    { length: Math.max(0, endPageOfGroup - startPageOfGroup + 1) },
    (_, i) => startPageOfGroup + i
  );

  return (
    <div className="content-page">
      <div className="content-container">
        <div className="page-header">
          <h1 className="page-title">
            🎶 노래 <span className="badge">{allSongs.length}</span>
          </h1>
          <button className="btn ghost" onClick={loadAll} title="새로고침">
            🔄 새로고침
          </button>
        </div>

        <div className="content-panel">
          {/* 인기곡 섹션 */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ margin: 0, marginBottom: 20 }}>
              🔥 인기곡 (차트 많이 오른 순)
            </h2>

            {recommendationsLoading ? (
              <p style={{ color: "#888" }}>로딩 중...</p>
            ) : recommendations.length === 0 ? (
              <p style={{ color: "#888" }}>인기곡을 불러올 수 없습니다.</p>
            ) : (
              <div
                style={{
                  overflowX: "auto",
                  display: "flex",
                  gap: 16,
                  paddingBottom: 12,
                  scrollBehavior: "smooth",
                }}
              >
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="item-card"
                    style={{
                      minWidth: 220,
                      flex: "0 0 220px",
                    }}
                  >
                    <div className="item-card-header">
                      <h3 className="item-card-title">{rec.title}</h3>
                    </div>
                    <div className="item-card-meta">
                      <span>👤 {rec.artistName || "Unknown"}</span>
                      {rec.chartCount && (
                        <span>📊 {rec.chartCount}회</span>
                      )}
                    </div>
                    <div className="item-card-actions">
                      <button
                        className="btn primary"
                        onClick={() => handlePlay(rec)}
                        disabled={playing === rec.id}
                      >
                        {playing === rec.id ? "▶️ 재생 중..." : "▶️ 재생"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 검색 & 필터 & 정렬 */}
          <div className="search-toolbar">
            <select
              value={filterArtist}
              onChange={(e) => setFilterArtist(e.target.value)}
            >
              <option value="">📻 모든 아티스트</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="🔍 노래 제목으로 검색..."
              style={{ flex: 1 }}
            />
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="title-asc">제목 (오름차순)</option>
              <option value="title-desc">제목 (내림차순)</option>
            </select>
          </div>

          {/* 추가 폼 */}
          <form onSubmit={add} className="add-form">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="노래 제목을 입력하세요"
              style={{ flex: 1.5 }}
            />
            <select
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
            >
              <option value="">아티스트 선택</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn primary" disabled={busy}>
              ➕ 추가
            </button>
          </form>

          {/* 로딩 상태 */}
          {loading && (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <div className="empty-state-text">노래를 불러오는 중...</div>
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="empty-state">
              <div className="empty-state-icon">❌</div>
              <div className="empty-state-text">{error}</div>
            </div>
          )}

          {/* 빈 상태 */}
          {!loading && !error && view.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🎵</div>
              <div className="empty-state-text">
                {q ? "검색 결과가 없어요" : "노래를 추가해보세요!"}
              </div>
            </div>
          )}

          {/* 노래 목록 */}
          {!loading && !error && view.length > 0 && (
            <>
              <div className="items-grid">
                {view.map((s) => (
                  <div key={s.id} className="item-card">
                    {editId === s.id ? (
                      <div className="edit-form">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="노래 제목"
                        />
                        <select
                          value={editArtistId}
                          onChange={(e) => setEditArtistId(e.target.value)}
                        >
                          <option value="">아티스트 선택</option>
                          {artists.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className="btn success"
                          onClick={() => save(s.id)}
                          disabled={busy}
                        >
                          ✅ 저장
                        </button>
                        <button
                          className="btn ghost"
                          onClick={() => setEditId(null)}
                          disabled={busy}
                        >
                          ✖️ 취소
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="item-card-header">
                          <h3 className="item-card-title">{s.title}</h3>
                        </div>
                        <div className="item-card-meta">
                          <span>🆔 #{s.id}</span>
                          <span>
                            👤 {s.artistName || "Unknown"}
                          </span>
                        </div>
                        <div className="item-card-actions">
                          <button
                            className="btn primary"
                            onClick={() => handlePlay(s)}
                            disabled={playing === s.id}
                          >
                            {playing === s.id ? "▶️ 재생 중..." : "▶️ 재생"}
                          </button>
                          <button
                            className="btn ghost"
                            onClick={() => handleOpenDetail(s)}
                          >
                            ℹ️ 상세
                          </button>
                          <button
                            className="btn ghost"
                            onClick={() => {
                              setEditId(s.id);
                              setEditTitle(s.title);
                              setEditArtistId(String(s.artistId));
                            }}
                          >
                            ✏️ 수정
                          </button>
                          <button
                            className="btn ghost"
                            onClick={() => handleOpenPlaylistModal(s.id)}
                            disabled={busy}
                          >
                            📋 플레이리스트
                          </button>
                          <button
                            className="btn danger"
                            onClick={() => remove(s.id)}
                            disabled={busy}
                          >
                            🗑️ 삭제
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div
                  style={{
                    marginTop: 32,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {/* 이전 그룹 버튼 */}
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setCurrentPageGroup(currentPageGroup - 1);
                      setCurrentPage((currentPageGroup - 2) * 5 + 1);
                    }}
                    disabled={currentPageGroup === 1}
                    style={{ padding: "8px 12px" }}
                  >
                    ◀ 이전
                  </button>

                  {/* 페이지 번튼들 */}
                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      className={
                        currentPage === page ? "btn primary" : "btn secondary"
                      }
                      onClick={() => setCurrentPage(page)}
                      style={{
                        padding: "8px 12px",
                        minWidth: "36px",
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  {/* 다음 그룹 버튼 */}
                  <button
                    className="btn secondary"
                    onClick={() => {
                      setCurrentPageGroup(currentPageGroup + 1);
                      setCurrentPage(currentPageGroup * 5 + 1);
                    }}
                    disabled={endPageOfGroup === totalPages}
                    style={{ padding: "8px 12px" }}
                  >
                    다음 ▶
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 상세 정보 모달 */}
      {detailModalOpen && selectedSong && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={handleCloseDetail}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              maxWidth: 600,
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div
              style={{
                padding: 20,
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: 0 }}>{selectedSong.title}</h2>
              <button
                className="btn ghost"
                onClick={handleCloseDetail}
                style={{ fontSize: 20, padding: 0, width: 32, height: 32 }}
              >
                ✕
              </button>
            </div>

            {/* 메타정보 */}
            <div style={{ padding: 20, borderBottom: "1px solid #eee" }}>
              <p>
                <strong>ID:</strong> {selectedSong.id}
              </p>
              <p>
                <strong>아티스트:</strong>{" "}
                {selectedSong.artistName || "Unknown"}
              </p>
            </div>

            {/* 차트 기록 */}
            <div style={{ padding: 20 }}>
              <h3>📊 차트 기록</h3>
              {chartsLoading ? (
                <p style={{ color: "#888" }}>로딩 중...</p>
              ) : songCharts.length === 0 ? (
                <p style={{ color: "#888" }}>차트 기록이 없습니다.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #ddd" }}>
                        <th style={{ padding: 8, textAlign: "left" }}>연도</th>
                        <th style={{ padding: 8, textAlign: "left" }}>주차</th>
                        <th style={{ padding: 8, textAlign: "left" }}>순위</th>
                      </tr>
                    </thead>
                    <tbody>
                      {songCharts.map((chart, idx) => (
                        <tr
                          key={idx}
                          style={{ borderBottom: "1px solid #eee" }}
                        >
                          <td style={{ padding: 8 }}>{chart.year}</td>
                          <td style={{ padding: 8 }}>{chart.week}</td>
                          <td style={{ padding: 8 }}>#{chart.chartRank}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 플레이리스트 선택 모달 */}
      {playlistModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={handleClosePlaylistModal}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 24,
              maxWidth: 400,
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>
              📋 플레이리스트 선택
            </h2>

            {playlistError && (
              <p style={{ color: "#d32f2f", marginBottom: 12 }}>
                {playlistError}
              </p>
            )}

            {playlistLoading ? (
              <p style={{ color: "#888" }}>로딩 중...</p>
            ) : myPlaylists.length === 0 ? (
              <p style={{ color: "#888" }}>플레이리스트가 없습니다.</p>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  border: "1px solid #eee",
                  borderRadius: 4,
                }}
              >
                {myPlaylists.map((pl, idx) => (
                  <li
                    key={pl.id}
                    style={{
                      borderBottom:
                        idx < myPlaylists.length - 1
                          ? "1px solid #eee"
                          : "none",
                      padding: 12,
                      cursor: "pointer",
                      background: "#fff",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f5f5f5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#fff")
                    }
                    onClick={() => handleAddToPlaylist(pl.id)}
                  >
                    <strong>{pl.name}</strong>
                    {pl.note && (
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "0.9em",
                          color: "#666",
                        }}
                      >
                        {pl.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
