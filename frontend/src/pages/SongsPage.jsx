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
  const [playing, setPlaying] = useState(null); // 재생 중인 노래 ID
  const [error, setError] = useState("");

  // 추천곡
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  // 상세 정보 모달
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [songCharts, setSongCharts] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(false);

  const artistNameById = useMemo(() => {
    const m = new Map();
    artists.forEach((a) => m.set(a.id, a.name));
    return m;
  }, [artists]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterArtist]);

  useEffect(() => {
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs]);

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

  // 재생 함수
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

  // 추천곡 로드
  // 로직: 노래 목록 중 첫 번째 곡을 기준으로 추천곡을 가져옴
  // 첫 곡이 차트 기록이 없으면 다음 곡을 시도 (최대 5개 곡까지)
  // 선택된 곡이 올랐던 차트 기간(연도, 주차)에 같이 올랐던 다른 곡들을 추천
  const loadRecommendations = async () => {
    if (songs.length === 0) return;
    try {
      setRecommendationsLoading(true);

      let recs = [];

      // 차트 기록이 있는 첫 곡 찾기
      for (let i = 0; i < Math.min(songs.length, 5); i++) {
        const songId = songs[i].id;
        const songTitle = songs[i].title;

        console.log(`🎵 [${i + 1}] 시도: ID=${songId}, 제목="${songTitle}"`);

        const recsForThisSong = await fetchJson(
          `${API}/songs/${songId}/recommendations`
        );

        if (recsForThisSong && recsForThisSong.length > 0) {
          console.log(
            `✅ 성공! ${songTitle}을(를) 기준으로 ${recsForThisSong.length}개의 추천곡 획득`
          );
          console.log(
            `📊 추천곡 기준: 이 곡이 올랐던 차트 기간과 같은 기간에 올랐던 다른 곡들`
          );
          recs = recsForThisSong;
          break;
        } else {
          console.log(`❌ 차트 기록 없음: ${songTitle}`);
        }
      }

      if (recs.length > 0) {
        console.log(
          `🎯 최종 추천곡 데이터:`,
          recs.map((r) => `${r.title} (${r.artistName})`).join(", ")
        );
      }

      setRecommendations(recs || []);
    } catch (e) {
      console.error("❌ 추천곡 로드 에러:", e);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // 상세 정보 모달 열기
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

  // 검색/정렬 적용
  const view = useMemo(() => {
    let data = songs;
    const t = q.trim().toLowerCase();
    if (t) data = data.filter((s) => s.title.toLowerCase().includes(t));
    const [k, dir] = sort.split("-"); // title-asc | title-desc
    data = [...data].sort((a, b) => {
      const A = String(a[k]).toLowerCase();
      const B = String(b[k]).toLowerCase();
      if (A < B) return dir === "asc" ? -1 : 1;
      if (A > B) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [songs, q, sort]);

  return (
    <div className="content-page">
      <div className="content-container">
        <div className="page-header">
          <h1 className="page-title">
            🎶 노래 <span className="badge">{view.length}</span>
          </h1>
          <button className="btn ghost" onClick={loadAll} title="새로고침">
            🔄 새로고침
          </button>
        </div>

        <div className="content-panel">
          {/* 추천곡 섹션 */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ margin: 0, marginBottom: 20 }}>💡 추천곡</h2>

            {recommendationsLoading ? (
              <p style={{ color: "#888" }}>로딩 중...</p>
            ) : recommendations.length === 0 ? (
              <p style={{ color: "#888" }}>추천할 곡이 없습니다.</p>
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
              style={{ flex: 1 }}
            >
              <option value="">아티스트 선택</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <button
              className="btn primary"
              disabled={!title.trim() || !artistId || busy}
            >
              {busy ? (
                <>
                  <span className="loading-spinner"></span> 추가 중...
                </>
              ) : (
                <>➕ 추가</>
              )}
            </button>
          </form>

          {/* 에러 메시지 */}
          {error && (
            <div className="error-message">
              <span>❗</span>
              <span>{error}</span>
            </div>
          )}

          {/* 로딩 상태 */}
          {loading && (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <div className="empty-state-text">노래를 불러오는 중...</div>
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
                        💾 저장
                      </button>
                      <button
                        className="btn muted"
                        onClick={() => {
                          setEditId(null);
                          setEditTitle("");
                          setEditArtistId("");
                        }}
                      >
                        ↩️ 취소
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
                          👤 {artistNameById.get(s.artistId) || "Unknown"}
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
              <h2 style={{ margin: 0 }}>🎵 {selectedSong.title}</h2>
              <button
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                }}
                onClick={handleCloseDetail}
              >
                ✕
              </button>
            </div>

            {/* 내용 */}
            <div style={{ padding: 20 }}>
              {/* 기본 정보 */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginTop: 0, marginBottom: 12 }}>기본 정보</h3>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <div>
                    <strong>곡 ID:</strong> {selectedSong.id}
                  </div>
                  <div>
                    <strong>아티스트:</strong>{" "}
                    {artistNameById.get(selectedSong.artistId) || "Unknown"}
                  </div>
                </div>
              </div>

              {/* 차트 기록 */}
              <div>
                <h3 style={{ marginTop: 0, marginBottom: 12 }}>📊 차트 기록</h3>
                {chartsLoading ? (
                  <p style={{ color: "#888" }}>로딩 중...</p>
                ) : songCharts.length === 0 ? (
                  <p style={{ color: "#888" }}>차트 기록이 없습니다.</p>
                ) : (
                  <div
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                      }}
                    >
                      <thead>
                        <tr style={{ background: "#f5f5f5" }}>
                          <th
                            style={{
                              padding: 12,
                              textAlign: "left",
                              borderBottom: "1px solid #ddd",
                              fontWeight: 600,
                            }}
                          >
                            연도
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: "left",
                              borderBottom: "1px solid #ddd",
                              fontWeight: 600,
                            }}
                          >
                            주차
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: "left",
                              borderBottom: "1px solid #ddd",
                              fontWeight: 600,
                            }}
                          >
                            순위
                          </th>
                          <th
                            style={{
                              padding: 12,
                              textAlign: "left",
                              borderBottom: "1px solid #ddd",
                              fontWeight: 600,
                            }}
                          >
                            기간
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {songCharts.map((chart, idx) => (
                          <tr
                            key={idx}
                            style={{
                              borderBottom:
                                idx < songCharts.length - 1
                                  ? "1px solid #eee"
                                  : "none",
                            }}
                          >
                            <td style={{ padding: 12 }}>{chart.year}</td>
                            <td style={{ padding: 12 }}>{chart.week}주차</td>
                            <td style={{ padding: 12 }}>
                              <strong>#{chart.rank}</strong>
                            </td>
                            <td
                              style={{
                                padding: 12,
                                fontSize: "0.9em",
                                color: "#666",
                              }}
                            >
                              {chart.weekStartDate
                                ? new Date(
                                    chart.weekStartDate
                                  ).toLocaleDateString()
                                : "-"}{" "}
                              ~{" "}
                              {chart.weekEndDate
                                ? new Date(
                                    chart.weekEndDate
                                  ).toLocaleDateString()
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
