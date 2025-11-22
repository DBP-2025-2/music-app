// frontend/src/pages/PlaylistsPage.jsx
import { useEffect, useState, useMemo } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function PlaylistsPage() {
  // 나의 플레이리스트
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 생성 단계
  const [createMode, setCreateMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  // 선택된 플리 + 곡 목록
  const [selectedId, setSelectedId] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // 곡 검색
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // 공개 플레이리스트 검색 / 인기
  const [publicQuery, setPublicQuery] = useState("");
  const [publicMode, setPublicMode] = useState("search"); // "search" | "popular"
  const [publicResults, setPublicResults] = useState([]);
  const [publicLoading, setPublicLoading] = useState(false);

  // ─────────────────────────────
  // 내 플레이리스트 불러오기
  // ─────────────────────────────
  async function loadPlaylists() {
    try {
      setError("");
      setLoading(true);
      const data = await fetchJson(`${API}/playlists`);
      setPlaylists(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
        loadItems(data[0].id);
      }
    } catch (e) {
      console.error(e);
      setError("플레이리스트를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────
  // 특정 플레이리스트의 곡 목록
  // ─────────────────────────────
  async function loadItems(playlistId) {
    try {
      setLoadingItems(true);
      const data = await fetchJson(`${API}/playlists/${playlistId}/items`);
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingItems(false);
    }
  }

  // ─────────────────────────────
  // 새 플레이리스트 생성
  // ─────────────────────────────
  async function handleCreatePlaylist() {
    const name = newName.trim();
    const note = newNote.trim();
    if (!name) return;

    try {
      setCreating(true);
      setError("");

      const newPl = await fetchJson(`${API}/playlists`, {
        method: "POST",
        body: JSON.stringify({
          name,
          isPublic: newIsPublic,
          note,
        }),
      });

      setPlaylists((prev) => [newPl, ...prev]);
      setCreateMode(false);
      setNewName("");
      setNewNote("");
      setNewIsPublic(true);

      setSelectedId(newPl.id);
      setItems([]);
      setSearchResults([]);
      setQuery("");
      await loadItems(newPl.id);
    } catch (e) {
      console.error(e);
      alert(e.message || "플레이리스트 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  }

  // ─────────────────────────────
  // 플레이리스트 삭제
  // ─────────────────────────────
  async function handleDeletePlaylist(id) {
    if (!window.confirm("정말 삭제할까요?")) return;

    try {
      await fetchJson(`${API}/playlists/${id}`, { method: "DELETE" });
      setPlaylists((prev) => prev.filter((p) => p.id !== id));

      if (selectedId === id) {
        setSelectedId(null);
        setItems([]);
        setSearchResults([]);
        setQuery("");
      }
    } catch (e) {
      console.error(e);
      alert("플레이리스트 삭제에 실패했습니다.");
    }
  }

  // ─────────────────────────────
  // 리스트에서 플리 선택
  // ─────────────────────────────
  async function handleSelectPlaylist(id) {
    setSelectedId(id);
    setItems([]);
    setSearchResults([]);
    setQuery("");
    await loadItems(id);
  }

  // ─────────────────────────────
  // 곡 검색
  // ─────────────────────────────
  async function handleSearchSongs() {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const data = await fetchJson(
        `${API}/songs?q=${encodeURIComponent(q)}`
      );
      setSearchResults(data);
    } catch (e) {
      console.error(e);
      alert("곡 검색에 실패했습니다.");
    } finally {
      setSearching(false);
    }
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSongs();
    }
  }

  // 곡을 플레이리스트에 추가
  async function handleAddItemBySong(songId) {
    if (!selectedId) {
      alert("먼저 왼쪽에서 플레이리스트를 선택하세요.");
      return;
    }
    try {
      await fetchJson(`${API}/playlists/${selectedId}/items`, {
        method: "POST",
        body: JSON.stringify({ songId }),
      });
      await loadItems(selectedId);
    } catch (e) {
      console.error(e);
      alert(e.message || "곡 추가에 실패했습니다.");
    }
  }

  // 플레이리스트 내 곡 삭제
  async function handleRemoveItem(itemId) {
    if (!selectedId) return;
    try {
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

  // ─────────────────────────────
  // 공개 플레이리스트 검색 / 인기
  // ─────────────────────────────
  async function handleSearchPublic() {
    const q = publicQuery.trim();
    try {
      setPublicLoading(true);
      setPublicMode("search");
      const data = await fetchJson(
        `${API}/playlists/public?q=${encodeURIComponent(q)}`
      );
      setPublicResults(data);
    } catch (e) {
      console.error(e);
      alert("공개 플레이리스트 검색에 실패했습니다.");
    } finally {
      setPublicLoading(false);
    }
  }

  async function handleLoadPopularPublic() {
    try {
      setPublicLoading(true);
      setPublicMode("popular");
      const data = await fetchJson(
        `${API}/playlists/public?sort=followers`
      );
      setPublicResults(data);
    } catch (e) {
      console.error(e);
      alert("인기 플레이리스트를 불러오는데 실패했습니다.");
    } finally {
      setPublicLoading(false);
    }
  }

  // 순위 바 길이 계산용 (가장 팔로워 많은 값)
  const maxFollowers = useMemo(() => {
    if (!publicResults || publicResults.length === 0) return 1;
    return publicResults.reduce(
      (max, pl) => Math.max(max, Number(pl.followerCount ?? 0)),
      0
    ) || 1;
  }, [publicResults]);

  return (
    <>
      {/* ========== 나의 플레이리스트 ========== */}
      <section className="card">
        <div className="card-header">
          <div className="card-title">
            <span>📂</span>
            <span>
              나의 플레이리스트{" "}
              <span className="card-badge">
                {playlists.length.toString()}
              </span>
            </span>
          </div>

          <button
            className="btn primary"
            onClick={() => {
              setCreateMode(true);
              setNewName("");
              setNewNote("");
              setNewIsPublic(true);
            }}
          >
            플레이리스트 만들기
          </button>
        </div>

        {/* 새 플레이리스트 만들기 폼 */}
        {createMode && (
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              border: "2px dashed #e5e7eb",
              marginBottom: 20,
              background: "#f9fafb",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>
              새 플레이리스트 만들기
            </h3>

            <div className="form-group">
              <label>제목</label>
              <input
                className="field-input"
                maxLength={40}
                placeholder="플레이리스트 제목을 입력해 주세요."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>소개글 (note)</label>
              <textarea
                style={{
                  width: "100%",
                  minHeight: 80,
                  resize: "vertical",
                  padding: 10,
                  borderRadius: 8,
                  border: "2px solid #e2e8f0",
                  fontFamily: "inherit",
                  fontSize: 14,
                }}
                maxLength={160}
                placeholder="플레이리스트를 소개하는 문장을 적어주세요."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                공개 설정
              </span>
              <label style={{ fontSize: 14 }}>
                <input
                  type="radio"
                  name="pl_public"
                  checked={newIsPublic}
                  onChange={() => setNewIsPublic(true)}
                  style={{ marginRight: 4 }}
                />
                공개
              </label>
              <label style={{ fontSize: 14 }}>
                <input
                  type="radio"
                  name="pl_public"
                  checked={!newIsPublic}
                  onChange={() => setNewIsPublic(false)}
                  style={{ marginRight: 4 }}
                />
                비공개
              </label>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setCreateMode(false)}
                disabled={creating}
              >
                취소
              </button>
              <button
                className="btn primary"
                onClick={handleCreatePlaylist}
                disabled={creating || !newName.trim()}
              >
                {creating ? "만드는 중..." : "다음 (곡 선택하기)"}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <p className="text-muted">플레이리스트 불러오는 중...</p>
        )}

        {/* 좌측 목록 + 우측 곡 담기 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.4fr",
            gap: 24,
            marginTop: 16,
          }}
        >
          {/* 왼쪽: 내 플리 리스트 */}
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
                        : "1px solid #e5e7eb",
                    borderRadius: 8,
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                  onClick={() => handleSelectPlaylist(p.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div>
                      <span className="text-muted">#{p.id} </span>
                      <strong>{p.name}</strong>
                      {!p.isPublic && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 11,
                            padding: "2px 6px",
                            borderRadius: 999,
                            background: "#e5e7eb",
                            color: "#4b5563",
                          }}
                        >
                          비공개
                        </span>
                      )}
                    </div>
                    {p.note && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: "#6b7280",
                          whiteSpace: "pre-line",
                        }}
                      >
                        {p.note}
                      </div>
                    )}
                  </div>
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
              {!loading && playlists.length === 0 && !createMode && (
                <li
                  className="list-item"
                  style={{
                    flexDirection: "column",
                    alignItems: "center",
                    border: "none",
                  }}
                >
                  <span className="text-muted" style={{ marginBottom: 8 }}>
                    플레이리스트가 없습니다.
                  </span>
                  <button
                    className="btn primary"
                    onClick={() => setCreateMode(true)}
                  >
                    플레이리스트 만들기
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* 오른쪽: 선택된 플리 상세 + 곡 검색/추가 */}
          <div>
            <h3 style={{ marginBottom: 8 }}>
              선택된 플레이리스트{" "}
              {selectedId ? `#${selectedId}` : "(선택 안 됨)"}
            </h3>

            {!selectedId && (
              <p className="text-muted">
                왼쪽 목록에서 플레이리스트 하나를 선택하거나 새로 생성해보세요.
              </p>
            )}

            {selectedId && (
              <>
                {/* 곡 검색 영역 */}
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    borderRadius: 8,
                    background: "#f9fafb",
                  }}
                >
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                    곡 검색해서 플레이리스트에 추가
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
                      onClick={handleSearchSongs}
                    >
                      {searching ? "검색 중..." : "검색"}
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        maxHeight: 180,
                        overflowY: "auto",
                      }}
                    >
                      <ul className="list">
                        {searchResults.map((song) => (
                          <li
                            key={song.id}
                            className="list-item"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleAddItemBySong(song.id)}
                          >
                            <span>
                              <span className="text-muted">
                                #{song.id}{" "}
                              </span>
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

                  {!searching &&
                    query.trim() &&
                    searchResults.length === 0 && (
                      <p
                        className="text-muted"
                        style={{ marginTop: 8 }}
                      >
                        검색 결과가 없습니다.
                      </p>
                    )}
                </div>

                {/* 플레이리스트에 담긴 곡 목록 */}
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
                          </span>{" "}
                          {item.songTitle && (
                            <span> - {item.songTitle}</span>
                          )}
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

      {/* ========== 공개 플레이리스트 둘러보기 ========== */}
      <section className="card" style={{ marginTop: 32 }}>
        <div className="card-header">
          <div className="card-title">
            <span>공개 플레이리스트 둘러보기</span>
          </div>
        </div>

        <div className="card-toolbar">
          <input
            className="field-input"
            placeholder="제목 또는 소개글으로 검색"
            value={publicQuery}
            onChange={(e) => setPublicQuery(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={handleSearchPublic}>
            {publicLoading && publicMode === "search"
              ? "검색 중..."
              : "검색"}
          </button>

          <button
            className="btn btn-secondary"
            style={{ marginLeft: "auto" }}
            onClick={handleLoadPopularPublic}
          >
            {publicLoading && publicMode === "popular"
              ? "불러오는 중..."
              : "팔로우 순 인기 보기"}
          </button>
        </div>

        {publicLoading && (
          <p className="text-muted">공개 플레이리스트 불러오는 중...</p>
        )}

        {!publicLoading && publicResults.length === 0 && (
          <p className="text-muted" style={{ marginTop: 8 }}>
            검색 결과가 없습니다.
          </p>
        )}

        {publicResults.length > 0 && (
          <div className="public-playlist-ranking">
            {/* 헤더 */}
            <div className="public-playlist-header">
              <span className="col-rank">순위</span>
              <span className="col-main">플레이리스트</span>
              <span className="col-followers">팔로워</span>
              <span className="col-actions" />
            </div>

            {/* 랭킹 행들 */}
            <div className="public-playlist-body">
              {publicResults.map((pl, index) => {
                const rank = index + 1;
                const followerCount = Number(pl.followerCount ?? 0);
                const ratio = followerCount / maxFollowers;

                const rankClass =
                  rank === 1
                    ? " public-playlist-row--rank1"
                    : rank === 2
                    ? " public-playlist-row--rank2"
                    : rank === 3
                    ? " public-playlist-row--rank3"
                    : "";

                return (
                  <div
                    key={pl.id}
                    className={"public-playlist-row" + rankClass}
                  >
                    <div className="col-rank">{rank}</div>

                    <div className="col-main">
                      <div className="public-playlist-title">
                        {pl.name}
                      </div>
                      <div className="public-playlist-meta">
                        만든이: {pl.ownerNickname || "알 수 없음"}
                        {" · "}곡 {pl.trackCount ?? 0}개
                      </div>

                      {/* 팔로워 수 비율 바 */}
                      <div className="public-playlist-bar-wrapper">
                        <div
                          className="public-playlist-bar"
                          style={{
                            width: `${
                              Math.max(8, ratio * 100)
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="col-followers">
                      {followerCount}명
                    </div>

                    <div className="col-actions">
                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          alert("팔로우 기능은 아직 미구현입니다 :)")
                        }
                      >
                        팔로우
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </>
  );
}
