import { useEffect, useMemo, useState } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function AlbumsPage() {
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);

  const [title, setTitle] = useState("");
  const [artistId, setArtistId] = useState("");
  const [year, setYear] = useState("");

  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtistId, setEditArtistId] = useState("");
  const [editYear, setEditYear] = useState("");

  const [sort, setSort] = useState("year-desc"); // 최신 우선
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const artistNameById = useMemo(() => {
    const m = new Map();
    artists.forEach((a) => m.set(a.id, a.name));
    return m;
  }, [artists]);

  const loadAll = async () => {
    setLoading(true);
    const [a, s] = await Promise.all([
      fetchJson(`${API}/artists`),
      fetchJson(`${API}/albums`),
    ]);
    setArtists(a);
    setAlbums(s);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const sorted = useMemo(() => {
    const [k, dir] = sort.split("-"); // year-desc / year-asc / title-asc
    return [...albums].sort((A, B) => {
      const a = A[k] ?? "";
      const b = B[k] ?? "";
      if (a < b) return dir === "asc" ? -1 : 1;
      if (a > b) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [albums, sort]);

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim() || !artistId) return;
    setBusy(true);
    await fetchJson(`${API}/albums`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        artistId: Number(artistId),
        year: year ? Number(year) : null,
      }),
    });
    setTitle("");
    setArtistId("");
    setYear("");
    await loadAll();
    setBusy(false);
  };

  const save = async (id) => {
    if (!editTitle.trim() || !editArtistId) return;
    setBusy(true);
    await fetchJson(`${API}/albums/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        artistId: Number(editArtistId),
        year: editYear === "" ? null : Number(editYear),
      }),
    });
    setEditId(null);
    setEditTitle("");
    setEditArtistId("");
    setEditYear("");
    await loadAll();
    setBusy(false);
  };

  const remove = async (id) => {
    if (!confirm("삭제할까요?")) return;
    setBusy(true);
    await fetchJson(`${API}/albums/${id}`, { method: "DELETE" });
    await loadAll();
    setBusy(false);
  };

  return (
    <div className="panel">
      <div
        className="row wrap"
        style={{ justifyContent: "space-between", marginBottom: 12 }}
      >
        <h2 style={{ margin: 0 }}>
          💿 Albums <span className="badge">{albums.length}</span>
        </h2>
        <div className="row">
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="year-desc">연도 최신순</option>
            <option value="year-asc">연도 오래된순</option>
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
          placeholder="앨범 제목"
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
        <input
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="연도(선택)"
          inputMode="numeric"
          style={{ width: 120 }}
        />
        <button
          className="btn primary"
          disabled={!title.trim() || !artistId || busy}
        >
          ➕ 추가 {busy && <span className="spinner" />}
        </button>
      </form>

      {loading && <div className="empty">⏳ 불러오는 중…</div>}

      <div className="list">
        {sorted.map((a) => (
          <div
            key={a.id}
            className="item"
            style={{ gridTemplateColumns: "1fr auto auto auto auto" }}
          >
            {editId === a.id ? (
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
                  {artists.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
                <input
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  placeholder="연도"
                  inputMode="numeric"
                />
                <button className="btn success" onClick={() => save(a.id)}>
                  💾 저장
                </button>
                <button
                  className="btn muted"
                  onClick={() => {
                    setEditId(null);
                    setEditTitle("");
                    setEditArtistId("");
                    setEditYear("");
                  }}
                >
                  ↩️ 취소
                </button>
              </>
            ) : (
              <>
                <div>
                  <b>{a.title}</b> <small>({a.year ?? "—"})</small>
                  <br />
                  <small>
                    by{" "}
                    {artistNameById.get(a.artistId) || `artistId:${a.artistId}`}{" "}
                    · #{a.id}
                  </small>
                </div>
                <button
                  className="btn ghost"
                  onClick={() => {
                    setEditId(a.id);
                    setEditTitle(a.title);
                    setEditArtistId(String(a.artistId));
                    setEditYear(a.year ?? "");
                  }}
                >
                  ✏️ 수정
                </button>
                <button className="btn danger" onClick={() => remove(a.id)}>
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
