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
    <div className="panel">
      <div
        className="row wrap"
        style={{ justifyContent: "space-between", marginBottom: 12 }}
      >
        <h2 style={{ margin: 0 }}>
          🎶 Songs <span className="badge">{view.length}</span>
        </h2>
        <div className="row wrap">
          <select
            value={filterArtist}
            onChange={(e) => setFilterArtist(e.target.value)}
          >
            <option value="">모든 아티스트</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="검색 (제목)"
          />
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="title-asc">제목 ↑</option>
            <option value="title-desc">제목 ↓</option>
          </select>
          <button className="btn ghost" onClick={loadAll}>
            🔄 새로고침
          </button>
        </div>
      </div>

      <form onSubmit={add} className="row" style={{ gap: 8, marginBottom: 12 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="노래 제목"
          style={{ flex: 2 }}
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
          ➕ 추가 {busy && <span className="spinner" />}
        </button>
      </form>

      {loading && <div className="empty">⏳ 불러오는 중…</div>}
      {error && (
        <div className="empty" style={{ color: "var(--danger)" }}>
          ❗ {error}
        </div>
      )}
      {!loading && !error && view.length === 0 && (
        <div className="empty">🙈 결과가 없어요</div>
      )}

      <div className="list">
        {view.map((s) => (
          <div key={s.id} className="item">
            {editId === s.id ? (
              <>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <select
                  value={editArtistId}
                  onChange={(e) => setEditArtistId(e.target.value)}
                >
                  <option value="">아티스트</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <button className="btn success" onClick={() => save(s.id)}>
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
                <button className="btn danger" onClick={() => remove(s.id)}>
                  🗑️ 삭제
                </button>
              </>
            ) : (
              <>
                <div style={{ gridColumn: "1 / span 2" }}>
                  <b>{s.title}</b>{" "}
                  <small>
                    by {artistNameById.get(s.artistId) || "Unknown"}
                  </small>
                  <br />
                  <small>#{s.id}</small>
                </div>
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
                <button className="btn danger" onClick={() => remove(s.id)}>
                  🗑️ 삭제
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
