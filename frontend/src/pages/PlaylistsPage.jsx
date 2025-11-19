// frontend/src/pages/PlaylistsPage.jsx
import { useEffect, useState } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function PlaylistsPage() {
  // 왼쪽: 플레이리스트 목록
  const [playlists, setPlaylists] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 오른쪽: 선택된 플레이리스트 + 곡 목록
  const [selectedId, setSelectedId] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // 검색: 곡 제목 검색
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // ─────────────────────────────
  // 플레이리스트 목록 불러오기
  // ─────────────────────────────
  async function loadPlaylists() {
    try {
      setError("");
      setLoading(true);
      const data = await fetchJson(`${API}/playlists`);
      setPlaylists(data);
    } catch (e) {
      console.error(e);
      setError("플레이리스트를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlaylists();
  }, []);

  // ─────────────────────────────
  // 특정 플레이리스트의 곡 목록 불러오기
  // ─────────────────────────────
  async function loadItems(playlistId) {
    try {
      setError("");
      setLoadingItems(true);
      const data = await fetchJson(`${API}/playlists/${playlistId}/items`);
      setItems(data);
    } catch (e) {
      console.error(e);
      setError("플레이리스트 내 곡 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoadingItems(false);
    }
  }

  // ─────────────────────────────
  // 플레이리스트 생성
  // ─────────────────────────────
  async function handleAddPlaylist() {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      setError("");
      const newPl = await fetchJson(`${API}/playlists`, {
        method: "POST",
        body: JSON.stringify({ name: trimmed }),
      });
      setPlaylists((prev) => [newPl, ...prev]);
      setName("");
    } catch (e) {
      console.error(e);
      alert(`[Playlists] ${e.message}`);
    }
  }

  // ─────────────────────────────
  // 플레이리스트 삭제
  // ─────────────────────────────
  async function handleDeletePlaylist(id) {
    if (!window.confirm("정말 삭제할까요?")) return;

    try {
      setError("");
      await fetchJson(`${API}/playlists/${id}`, { method: "DELETE" });
      setPlaylists((prev) => prev.filter((p) => p.id !== id));

      // 방금 보고 있던 플레이리스트 삭제되면 오른쪽 초기화
      if (selectedId === id) {
        setSelectedId(null);
        setItems([]);
        setSearchResults([]);
        setQuery("");
      }
    } catch (e) {
      console.error(e);
      alert(`[Playlists] 삭제 실패: ${e.message}`);
    }
  }

  // ─────────────────────────────
  // 플레이리스트 선택
  // ─────────────────────────────
  async function handleSelectPlaylist(id) {
    setSelectedId(id);
    setItems([]);
    setSearchResults([]);
    setQuery("");
    await loadItems(id);
  }

  // ─────────────────────────────
  // 곡 검색 (제목 일부로 검색)
  // ─────────────────────────────
  async function handleSearch() {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    try {
      setError("");
      setSearching(true);
      const data = await fetchJson(
        `${API}/songs?q=${encodeURIComponent(q)}`
      );
      setSearchResults(data);
    } catch (e) {
      console.error(e);
      setError("곡 검색에 실패했습니다.");
    } finally {
      setSearching(false);
    }
  }

  // Enter 키로도 검색할 수 있게
  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  }

  // ─────────────────────────────
  // 검색 결과에서 곡 선택 → 플레이리스트에 추가
  // ─────────────────────────────
  async function handleAddItemBySong(songId) {
    if (!selectedId) {
      alert("먼저 왼쪽에서 플레이리스트를 선택하세요.");
      return;
    }

    try {
      setError("");
      await fetchJson(`${API}/playlists/${selectedId}/items`, {
        method: "POST",
        body: JSON.stringify({ songId }),
      });

      // 추가 후 목록 새로고침
      await loadItems(selectedId);
    } catch (e) {
      console.error(e);
      alert(e.message || "곡 추가에 실패했습니다.");
    }
  }

  // ─────────────────────────────
  // 플레이리스트 내 곡 삭제
  // ─────────────────────────────
  async function handleRemoveItem(itemId) {
    if (!selectedId) return;

    try {
      setError("");
      await fetchJson(
        `${API}/playlists/${selectedId}/items/${itemId}`,
        { method: "DELETE" }
      );
      await loadItems(selectedId);
    } catch (e) {
      console.error(e);
      alert("곡 삭제에 실패했습니다.");
    }
  }

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

      {/* 상단: 새 플레이리스트 생성 + 새로고침 */}
      <div className="card-toolbar">
        <input
          className="field-input"
          placeholder="플레이리스트 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleAddPlaylist}>
          ➕ 추가
        </button>
        <button className="btn btn-secondary" onClick={loadPlaylists}>
          🔄 새로고침
        </button>
      </div>

      {loading && <p className="text-muted">플레이리스트 불러오는 중...</p>}
      {error && (
        <p className="text-error">
          ⚠️ Error: <span>{error}</span>
        </p>
      )}

      {/* 본문: 좌우 2컬럼 레이아웃 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          gap: 24,
          marginTop: 16,
        }}
      >
        {/* ───────── 왼쪽: 플레이리스트 목록 ───────── */}
        <div>
          <h3 style={{ marginBottom: 8 }}>플레이리스트 목록</h3>
          <ul className="list">
            {playlists.map((p) => (
              <li
                key={p.id}
                className="list-item"
                style={{
                  cursor: "pointer",
                  border:
                    p.id === selectedId
                      ? "2px solid #6366f1"
                      : "1px solid #ddd",
                  borderRadius: 8,
                }}
                onClick={() => handleSelectPlaylist(p.id)}
              >
                <span>
                  <span className="text-muted">#{p.id} </span>
                  <strong>{p.name}</strong>
                </span>
                <button
                  className="btn btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePlaylist(p.id);
                  }}
                >
                  삭제
                </button>
              </li>
            ))}
            {playlists.length === 0 && (
              <li className="list-item">
                <span className="text-muted">
                  아직 플레이리스트가 없습니다.
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* ───────── 오른쪽: 선택된 플레이리스트 상세 ───────── */}
        <div>
          <h3 style={{ marginBottom: 8 }}>
            선택된 플레이리스트{" "}
            {selectedId ? `#${selectedId}` : "(선택 안 됨)"}
          </h3>

          {!selectedId && (
            <p className="text-muted">
              왼쪽 목록에서 플레이리스트 하나를 선택해보세요.
            </p>
          )}

          {selectedId && (
            <>
              {/* 검색 영역 */}
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 8,
                  background: "#f9fafb",
                }}
              >
                <div style={{ marginBottom: 8, fontWeight: 500 }}>
                  🎵 곡 검색해서 플레이리스트에 추가
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="field-input"
                    placeholder="곡 제목 일부를 입력하세요"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={handleSearch}
                  >
                    {searching ? "검색 중..." : "🔍 검색"}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div style={{ marginTop: 8, maxHeight: 180, overflowY: "auto" }}>
                    <ul className="list">
                      {searchResults.map((song) => (
                        <li
                          key={song.id}
                          className="list-item"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleAddItemBySong(song.id)}
                        >
                          <span>
                            <span className="text-muted">#{song.id} </span>
                            <strong>{song.title}</strong>
                            {song.artistId && (
                              <span className="text-muted">
                                {" "}
                                (artistId: {song.artistId})
                              </span>
                            )}
                          </span>
                          <span className="text-muted">
                            클릭하면 추가됩니다
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!searching && query.trim() && searchResults.length === 0 && (
                  <p className="text-muted" style={{ marginTop: 8 }}>
                    검색 결과가 없습니다.
                  </p>
                )}
              </div>

              {/* 플레이리스트 내 곡 목록 */}
              <div>
                <h4 style={{ marginBottom: 8 }}>플레이리스트에 담긴 곡</h4>
                {loadingItems && (
                  <p className="text-muted">곡 목록 불러오는 중...</p>
                )}
                <ul className="list">
                  {items.map((item) => (
                    <li key={item.id} className="list-item">
                      <span>
                        <strong>{item.position}.</strong>{" "}
                        <span className="text-muted">
                          songId: {item.songId}
                        </span>
                      </span>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        제거
                      </button>
                    </li>
                  ))}
                  {!loadingItems && items.length === 0 && (
                    <li className="list-item">
                      <span className="text-muted">
                        아직 이 플레이리스트에 담긴 곡이 없습니다.
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
