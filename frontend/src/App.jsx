// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { API } from "./lib/api";
import { fetchJson } from "./lib/http";

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

/* ---------- 기존 Pages: Artists / Songs / Albums / Playlists ---------- */
/* (이 부분은 우리가 앞에서 만든 그대로 — 내용 동일, 생략 안 함) */

function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson(`${API}/artists`);
      setArtists(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const newArtist = await fetchJson(`${API}/artists`, {
        method: "POST",
        body: JSON.stringify({ name: trimmed }),
      });
      setArtists((prev) => [newArtist, ...prev]);
      setName("");
    } catch (err) {
      alert(`[Artists] ${err.message}`);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("정말 삭제할까요?")) return;
    try {
      await fetchJson(`${API}/artists/${id}`, { method: "DELETE" });
      setArtists((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(`[Artists] 삭제 실패: ${err.message}`);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title">
          <span>👤</span>
          <span>
            Artists{" "}
            <span className="card-badge">{artists.length.toString()}</span>
          </span>
        </div>
      </div>

      <div className="card-toolbar">
        <input
          className="field-input"
          placeholder="아티스트 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleAdd}>
          ➕ 추가
        </button>
        <button className="btn btn-secondary" onClick={load}>
          🔄 새로고침
        </button>
      </div>

      {loading && <p className="text-muted">불러오는 중...</p>}
      {error && (
        <p className="text-error">
          ⚠️ Error: <span>{error}</span>
        </p>
      )}

      <ul className="list">
        {artists.map((a) => (
          <li key={a.id} className="list-item">
            <span>
              <span className="text-muted">#{a.id} </span>
              <strong>{a.name}</strong>
            </span>
            <button
              className="btn btn-danger"
              onClick={() => handleDelete(a.id)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SongsPage() {
  const [songs, setSongs] = useState([]);
  const [title, setTitle] = useState("");
  const [artistId, setArtistId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson(`${API}/songs`);
      setSongs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    const t = title.trim();
    const aId = Number(artistId);
    if (!t || !aId) {
      alert("곡 제목과 artistId(숫자)를 입력해줘!");
      return;
    }
    try {
      const newSong = await fetchJson(`${API}/songs`, {
        method: "POST",
        body: JSON.stringify({ title: t, artistId: aId }),
      });
      setSongs((prev) => [newSong, ...prev]);
      setTitle("");
      setArtistId("");
    } catch (err) {
      alert(`[Songs] ${err.message}`);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("정말 삭제할까요?")) return;
    try {
      await fetchJson(`${API}/songs/${id}`, { method: "DELETE" });
      setSongs((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(`[Songs] 삭제 실패: ${err.message}`);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title">
          <span>🎧</span>
          <span>
            Songs <span className="card-badge">{songs.length.toString()}</span>
          </span>
        </div>
      </div>

      <div className="card-toolbar">
        <input
          className="field-input"
          placeholder="곡 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="field-input"
          style={{ maxWidth: 120 }}
          placeholder="artistId"
          value={artistId}
          onChange={(e) => setArtistId(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleAdd}>
          ➕ 추가
        </button>
        <button className="btn btn-secondary" onClick={load}>
          🔄 새로고침
        </button>
      </div>

      {loading && <p className="text-muted">불러오는 중...</p>}
      {error && (
        <p className="text-error">
          ⚠️ Error: <span>{error}</span>
        </p>
      )}

      <ul className="list">
        {songs.map((s) => (
          <li key={s.id} className="list-item">
            <span>
              <span className="text-muted">#{s.id} </span>
              <strong>{s.title}</strong>
              {s.artistId && (
                <span className="text-muted"> (artistId: {s.artistId})</span>
              )}
            </span>
            <button
              className="btn btn-danger"
              onClick={() => handleDelete(s.id)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AlbumsPage() {
  const [albums, setAlbums] = useState([]);
  const [title, setTitle] = useState("");
  const [artistId, setArtistId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson(`${API}/albums`);
      setAlbums(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    const t = title.trim();
    const aId = Number(artistId);
    if (!t || !aId) {
      alert("앨범 제목과 artistId(숫자)를 입력해줘!");
      return;
    }
    try {
      const newAlbum = await fetchJson(`${API}/albums`, {
        method: "POST",
        body: JSON.stringify({ title: t, artistId: aId }),
      });
      setAlbums((prev) => [newAlbum, ...prev]);
      setTitle("");
      setArtistId("");
    } catch (err) {
      alert(`[Albums] ${err.message}`);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("정말 삭제할까요?")) return;
    try {
      await fetchJson(`${API}/albums/${id}`, { method: "DELETE" });
      setAlbums((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(`[Albums] 삭제 실패: ${err.message}`);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title">
          <span>💿</span>
          <span>
            Albums{" "}
            <span className="card-badge">{albums.length.toString()}</span>
          </span>
        </div>
      </div>

      <div className="card-toolbar">
        <input
          className="field-input"
          placeholder="앨범 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="field-input"
          style={{ maxWidth: 120 }}
          placeholder="artistId"
          value={artistId}
          onChange={(e) => setArtistId(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleAdd}>
          ➕ 추가
        </button>
        <button className="btn btn-secondary" onClick={load}>
          🔄 새로고침
        </button>
      </div>

      {loading && <p className="text-muted">불러오는 중...</p>}
      {error && (
        <p className="text-error">
          ⚠️ Error: <span>{error}</span>
        </p>
      )}

      <ul className="list">
        {albums.map((a) => (
          <li key={a.id} className="list-item">
            <span>
              <span className="text-muted">#{a.id} </span>
              <strong>{a.title}</strong>
              {a.artistId && (
                <span className="text-muted"> (artistId: {a.artistId})</span>
              )}
              {a.year && <span className="text-muted"> [{a.year}]</span>}
            </span>
            <button
              className="btn btn-danger"
              onClick={() => handleDelete(a.id)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlaylistsPage() {
  const [playlists, setPlaylists] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson(`${API}/playlists`);
      setPlaylists(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const newPl = await fetchJson(`${API}/playlists`, {
        method: "POST",
        body: JSON.stringify({ name: trimmed }),
      });
      setPlaylists((prev) => [newPl, ...prev]);
      setName("");
    } catch (err) {
      alert(`[Playlists] ${err.message}`);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("정말 삭제할까요?")) return;
    try {
      await fetchJson(`${API}/playlists/${id}`, { method: "DELETE" });
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(`[Playlists] 삭제 실패: ${err.message}`);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title">
          <span>📂</span>
          <span>
            Playlists{" "}
            <span className="card-badge">{playlists.length.toString()}</span>
          </span>
        </div>
      </div>

      <div className="card-toolbar">
        <input
          className="field-input"
          placeholder="플레이리스트 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleAdd}>
          ➕ 추가
        </button>
        <button className="btn btn-secondary" onClick={load}>
          🔄 새로고침
        </button>
      </div>

      {loading && <p className="text-muted">불러오는 중...</p>}
      {error && (
        <p className="text-error">
          ⚠️ Error: <span>{error}</span>
        </p>
      )}

      <ul className="list">
        {playlists.map((p) => (
          <li key={p.id} className="list-item">
            <span>
              <span className="text-muted">#{p.id} </span>
              <strong>{p.name}</strong>
            </span>
            <button
              className="btn btn-danger"
              onClick={() => handleDelete(p.id)}
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- 새 페이지들: Charts / Follows / History / Users (READ ONLY) ---------- */

function ChartsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson(`${API}/charts`);
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title">
          <span>📊</span>
          <span>
            Charts <span className="card-badge">{rows.length.toString()}</span>
          </span>
        </div>
      </div>

      {loading && <p className="text-muted">불러오는 중...</p>}
      {error && (
        <p className="text-error">
          ⚠️ Error: <span>{error}</span>
        </p>
      )}

      <ul className="list">
        {rows.map((c) => (
          <li key={c.id} className="list-item">
            <span>
              <span className="text-muted">
                {c.chartType} / {c.year}년 {c.week}주{" "}
              </span>
              <strong>#{c.rank}</strong>
              <span className="text-muted"> (songId: {c.songId})</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FollowsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson(`${API}/follows`);
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title">
          <span>👥</span>
          <span>
            Follows <span className="card-badge">{rows.length.toString()}</span>
          </span>
        </div>
      </div>

      {loading && <p className="text-muted">불러오는 중...</p>}
      {error && (
        <p className="text-error">
          ⚠️ Error: <span>{error}</span>
        </p>
      )}

      <ul className="list">
        {rows.map((f, idx) => (
          <li key={idx} className="list-item">
            <span>
              <strong>{f.followerId}</strong>
              <span className="text-muted">
                {" "}
                → ({f.targetType}) {f.followingId}
              </span>
            </span>
            <span className="text-muted">
              {f.createdAt && f.createdAt.substring(0, 10)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HistoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson(`${API}/play-history`);
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title">
          <span>🕒</span>
          <span>
            Play History{" "}
            <span className="card-badge">{rows.length.toString()}</span>
          </span>
        </div>
      </div>

      {loading && <p className="text-muted">불러오는 중...</p>}
      {error && (
        <p className="text-error">
          ⚠️ Error: <span>{error}</span>
        </p>
      )}

      <ul className="list">
        {rows.map((h) => (
          <li key={h.id} className="list-item">
            <span>
              <strong>user {h.userId}</strong>
              <span className="text-muted"> → song {h.songId}</span>
            </span>
            <span className="text-muted">
              {h.playedAt && h.playedAt.replace("T", " ").substring(0, 19)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UsersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson(`${API}/users`);
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title">
          <span>🙋‍♀️</span>
          <span>
            Users <span className="card-badge">{rows.length.toString()}</span>
          </span>
        </div>
      </div>

      {loading && <p className="text-muted">불러오는 중...</p>}
      {error && (
        <p className="text-error">
          ⚠️ Error: <span>{error}</span>
        </p>
      )}

      <ul className="list">
        {rows.map((u) => (
          <li key={u.id} className="list-item">
            <span>
              <span className="text-muted">#{u.id} </span>
              <strong>{u.nickname || u.email}</strong>
              {u.nickname && <span className="text-muted"> ({u.email})</span>}
            </span>
            <span className="text-muted">
              가입: {u.createdAt && u.createdAt.substring(0, 10)}
            </span>
          </li>
        ))}
      </ul>
    </section>
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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
