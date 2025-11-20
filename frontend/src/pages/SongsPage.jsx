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
  const [error, setError] = useState("");

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
  }, [filterArtist]);

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
    </div>
  );
}
