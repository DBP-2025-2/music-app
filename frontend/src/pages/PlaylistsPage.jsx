import { useEffect, useMemo, useState } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState([]);
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const [items, setItems] = useState([]);
  const [songToAdd, setSongToAdd] = useState("");
  const [busy, setBusy] = useState(false);

  const songsById = useMemo(() => {
    const m = new Map();
    songs.forEach((s) => m.set(s.id, s));
    return m;
  }, [songs]);

  const artistNameById = useMemo(() => {
    const m = new Map();
    artists.forEach((a) => m.set(a.id, a.name));
    return m;
  }, [artists]);

  const selected = useMemo(
    () => playlists.find((p) => p.id === selectedId) || null,
    [playlists, selectedId]
  );

  const load = async () => {
    const [pl, s, a] = await Promise.all([
      fetchJson(`${API}/playlists`),
      fetchJson(`${API}/songs`),
      fetchJson(`${API}/artists`),
    ]);
    setPlaylists(pl);
    setSongs(s);
    setArtists(a);
    if (selectedId) await loadItems(selectedId);
  };

  const loadItems = async (pid) => {
    const data = await fetchJson(`${API}/playlists/${pid}/items`);
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (selectedId) loadItems(selectedId);
  }, [selectedId]);

  const addPlaylist = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await fetchJson(`${API}/playlists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setNewName("");
    await load();
  };

  const saveEdit = async (id) => {
    if (!editName.trim()) return;
    await fetchJson(`${API}/playlists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName }),
    });
    setEditId(null);
    setEditName("");
    await load();
  };

  const removePlaylist = async (id) => {
    if (!confirm("플레이리스트를 삭제할까요? 담긴 곡도 함께 지워집니다."))
      return;
    await fetchJson(`${API}/playlists/${id}`, { method: "DELETE" });
    if (selectedId === id) {
      setSelectedId(null);
      setItems([]);
    }
    await load();
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!selectedId || !songToAdd) return;
    const result = await fetchJson(`${API}/playlists/${selectedId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songId: Number(songToAdd) }),
    }).catch((e) => ({ error: e.message }));
    if (result?.error) {
      alert(result.error);
      return;
    }
    setSongToAdd("");
    await loadItems(selectedId);
  };

  const removeItem = async (itemId) => {
    await fetchJson(`${API}/playlists/${selectedId}/items/${itemId}`, {
      method: "DELETE",
    });
    await loadItems(selectedId);
  };

  // 🚿 전체 비우기(프론트에서 순차 삭제)
  const clearAll = async () => {
    if (!selectedId) return;
    if (!confirm("이 플레이리스트에 담긴 모든 곡을 비울까요?")) return;
    setBusy(true);
    for (const it of items) {
      await fetchJson(`${API}/playlists/${selectedId}/items/${it.id}`, {
        method: "DELETE",
      });
    }
    await loadItems(selectedId);
    setBusy(false);
  };

  return (
    <div className="panel">
      <div
        className="row wrap"
        style={{ justifyContent: "space-between", marginBottom: 12 }}
      >
        <h2 style={{ margin: 0 }}>
          🧺 Playlists <span className="badge">{playlists.length}</span>
        </h2>
        <form onSubmit={addPlaylist} className="row" style={{ gap: 8 }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="플레이리스트 이름"
          />
          <button className="btn primary" disabled={!newName.trim()}>
            ➕ 추가
          </button>
        </form>
      </div>

      <div className="row wrap" style={{ gap: 16 }}>
        {/* 왼쪽: 리스트 */}
        <div className="panel" style={{ flex: "1 1 320px" }}>
          <h3 style={{ marginTop: 0 }}>📂 목록</h3>
          <div className="list">
            {playlists.map((p) => (
              <div
                key={p.id}
                className="item"
                style={{ gridTemplateColumns: "1fr auto auto auto" }}
              >
                {editId === p.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <button
                      className="btn success"
                      onClick={() => saveEdit(p.id)}
                    >
                      💾 저장
                    </button>
                    <button
                      className="btn muted"
                      onClick={() => {
                        setEditId(null);
                        setEditName("");
                      }}
                    >
                      ↩️ 취소
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <b>{p.name}</b> <small>#{p.id}</small>
                    </div>
                    <button
                      className="btn ghost"
                      onClick={() => setSelectedId(p.id)}
                    >
                      {selectedId === p.id ? "✅ 선택됨" : "📂 선택"}
                    </button>
                    <button
                      className="btn ghost"
                      onClick={() => {
                        setEditId(p.id);
                        setEditName(p.name);
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => removePlaylist(p.id)}
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            ))}
            {playlists.length === 0 && (
              <div className="empty">첫 플레이리스트를 만들어보세요!</div>
            )}
          </div>
        </div>

        {/* 오른쪽: 아이템 */}
        <div className="panel" style={{ flex: "2 1 420px" }}>
          <h3 style={{ marginTop: 0 }}>
            🎧{" "}
            {selected ? (
              <>
                <b>{selected.name}</b>{" "}
                <span className="badge">{items.length}</span>
              </>
            ) : (
              "선택된 플레이리스트가 없어요"
            )}
          </h3>

          <form
            onSubmit={addItem}
            className="row"
            style={{ gap: 8, marginBottom: 12 }}
          >
            <select
              value={songToAdd}
              onChange={(e) => setSongToAdd(e.target.value)}
              disabled={!selectedId}
              style={{ flex: 1 }}
            >
              <option value="">
                {selectedId ? "담을 곡 선택" : "왼쪽에서 선택하세요"}
              </option>
              {songs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} /{" "}
                  {artistNameById.get(s.artistId) || `artistId:${s.artistId}`}
                </option>
              ))}
            </select>
            <button
              className="btn primary"
              disabled={!selectedId || !songToAdd}
            >
              ➕ 담기
            </button>
            <button
              type="button"
              className="btn warning"
              onClick={clearAll}
              disabled={!selectedId || items.length === 0 || busy}
            >
              🧹 전부 비우기 {busy && <span className="spinner" />}
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={load}
              title="새로고침"
            >
              🔄
            </button>
          </form>

          {!selectedId ? (
            <div className="empty">왼쪽에서 플레이리스트를 선택하세요.</div>
          ) : items.length === 0 ? (
            <div className="empty">
              아직 곡이 없습니다. 위에서 골라 담아보세요!
            </div>
          ) : (
            <div className="list">
              {items.map((it) => {
                const song = songsById.get(it.songId);
                return (
                  <div
                    key={it.id}
                    className="item"
                    style={{ gridTemplateColumns: "1fr auto" }}
                  >
                    <div>
                      <b>{song ? song.title : `songId:${it.songId}`}</b>
                      <br />
                      <small>
                        {song &&
                          (artistNameById.get(song.artistId) ||
                            `artistId:${song.artistId}`)}{" "}
                        · #{it.id}
                      </small>
                    </div>
                    <button
                      className="btn danger"
                      onClick={() => removeItem(it.id)}
                    >
                      🗑️ 빼기
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
