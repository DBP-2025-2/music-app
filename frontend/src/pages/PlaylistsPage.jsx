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

  // 자동완성 상태
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [autocompleting, setAutocompleting] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // 공개 플레이리스트 검색 / 인기
  const [publicQuery, setPublicQuery] = useState("");
  const [publicMode, setPublicMode] = useState("search"); // "search" | "popular"
  const [publicResults, setPublicResults] = useState([]);
  const [publicLoading, setPublicLoading] = useState(false);

  // 공개 플레이리스트 상세(곡 목록)용
  const [publicSelectedId, setPublicSelectedId] = useState(null);
  const [publicSelectedItems, setPublicSelectedItems] = useState([]);
  const [publicItemsLoading, setPublicItemsLoading] = useState(false);
  const [publicItemsError, setPublicItemsError] = useState("");

  // 차트와 공유하는 "플레이리스트 선택 모달" 상태
  const [playlistPickerOpen, setPlaylistPickerOpen] = useState(false);
  const [playlistPickerLoading, setPlaylistPickerLoading] = useState(false);
  const [playlistPickerError, setPlaylistPickerError] = useState("");
  const [myPlaylists, setMyPlaylists] = useState([]);
  const [targetSongId, setTargetSongId] = useState(null);

  // 삭제용 3점 메뉴 상태
  const [playlistMenuOpenId, setPlaylistMenuOpenId] = useState(null);
  const [itemMenuOpenId, setItemMenuOpenId] = useState(null);

  // 현재 선택된 플레이리스트 객체
  const selectedPlaylist = useMemo(
    () => playlists.find((p) => p.id === selectedId) || null,
    [playlists, selectedId]
  );

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
    } finally {
      setPlaylistMenuOpenId(null);
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
    setItemMenuOpenId(null);
    await loadItems(id);
  }

  // ─────────────────────────────
  // 곡 검색 (제목 + 가수명)
  // ─────────────────────────────
  async function handleSearchSongs() {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const data = await fetchJson(`${API}/songs?q=${encodeURIComponent(q)}`);
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

  // ─────────────────────────────
  // 곡을 (현재 선택된) 플레이리스트에 추가
  // ─────────────────────────────
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

  // ─────────────────────────────
  // 자동완성 검색
  // ─────────────────────────────
  async function handleAutocomplete(value) {
    setQuery(value);
    const q = value.trim();
    if (!q || q.length < 1) {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
      return;
    }

    try {
      setAutocompleting(true);
      const data = await fetchJson(`${API}/songs?q=${encodeURIComponent(q)}`);

      // 우선순위 정렬:
      // 1순위 = 첫글자로 시작 (다, 달, 달콤 모두 '다'로 시작하면 최우선)
      // 2순위 = 전체 검색어로 prefix 매칭
      // 3순위 = 포함
      const qLower = q.toLowerCase();
      const firstChar = qLower[0];

      const scored = (data || []).map((item) => {
        const title = (item.title || "").toLowerCase();
        const artist = (item.artistName || "").toLowerCase();
        let score = 0;
        if (title.startsWith(firstChar) || artist.startsWith(firstChar))
          score = 3;
        else if (title.startsWith(qLower) || artist.startsWith(qLower))
          score = 2;
        else if (title.includes(qLower) || artist.includes(qLower)) score = 1;
        return { item, score };
      });

      scored.sort((a, b) => {
        // 높은 score부터 정렬
        if (b.score !== a.score) return b.score - a.score;
        // 동일 점수면 제목 사전순
        const A = (a.item.title || "").toLowerCase();
        const B = (b.item.title || "").toLowerCase();
        return A < B ? -1 : A > B ? 1 : 0;
      });

      const sorted = scored.map((s) => s.item);
      setAutocompleteResults(sorted.slice(0, 5)); // 최대 5개
      setShowAutocomplete(true);
    } catch (e) {
      console.error(e);
      setAutocompleteResults([]);
    } finally {
      setAutocompleting(false);
    }
  }

  function handleSelectFromAutocomplete(song) {
    setQuery(song.title);
    setSearchResults([song]); // 선택된 곡을 검색 결과로 설정
    setShowAutocomplete(false);
    setAutocompleteResults([]);
  }

  // ─────────────────────────────
  // 플레이리스트 내 곡 삭제
  // ─────────────────────────────
  async function handleRemoveItem(itemId) {
    if (!selectedId) return;
    try {
      await fetchJson(`${API}/playlists/${selectedId}/items/${itemId}`, {
        method: "DELETE",
      });
      await loadItems(selectedId);
    } catch (e) {
      console.error(e);
      alert("곡 삭제에 실패했습니다.");
    } finally {
      setItemMenuOpenId(null);
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
      setPublicSelectedId(null);
      setPublicSelectedItems([]);
      setPublicItemsError("");
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
      const data = await fetchJson(`${API}/playlists/public?sort=followers`);
      setPublicResults(data);
      setPublicSelectedId(null);
      setPublicSelectedItems([]);
      setPublicItemsError("");
    } catch (e) {
      console.error(e);
      alert("인기 플레이리스트를 불러오는데 실패했습니다.");
    } finally {
      setPublicLoading(false);
    }
  }

  // 공개 플레이리스트 한 줄 클릭 시 곡 목록 토글
  async function handleTogglePublicPlaylist(playlistId) {
    if (publicSelectedId === playlistId) {
      setPublicSelectedId(null);
      setPublicSelectedItems([]);
      setPublicItemsError("");
      return;
    }

    try {
      setPublicSelectedId(playlistId);
      setPublicItemsLoading(true);
      setPublicItemsError("");

      const data = await fetchJson(`${API}/playlists/${playlistId}/items`);
      setPublicSelectedItems(data);
    } catch (e) {
      console.error(e);
      setPublicSelectedItems([]);
      setPublicItemsError(
        e.message || "플레이리스트 곡 정보를 불러오는데 실패했습니다."
      );
    } finally {
      setPublicItemsLoading(false);
    }
  }

  // 순위 바 길이 계산용 (가장 팔로워 많은 값)
  const maxFollowers = useMemo(() => {
    if (!publicResults || publicResults.length === 0) return 1;
    return (
      publicResults.reduce(
        (max, pl) => Math.max(max, Number(pl.followerCount ?? 0)),
        0
      ) || 1
    );
  }, [publicResults]);

  // ─────────────────────────────
  // 공개 플리 곡에서 "플리 추가" 모달 열기
  // ─────────────────────────────
  async function handleOpenPlaylistPicker(songId) {
    try {
      setTargetSongId(songId);
      setPlaylistPickerOpen(true);
      setPlaylistPickerError("");
      setPlaylistPickerLoading(true);

      const data = await fetchJson(`${API}/playlists`);
      setMyPlaylists(data);
    } catch (e) {
      console.error(e);
      setPlaylistPickerError(
        e.message || "플레이리스트 목록을 불러오는데 실패했습니다."
      );
    } finally {
      setPlaylistPickerLoading(false);
    }
  }
  // 🔹 [추가] 공개 플레이리스트 팔로우하기
  async function handleFollowPublicPlaylist(playlistId) {
    try {
      // API 호출 (토글 방식)
      const res = await fetchJson(`${API}/playlists/${playlistId}/follow`, {
        method: "POST",
      });

      if (res.followed) {
        alert("이 플레이리스트를 팔로우했습니다! 💖\n(내 목록에서 확인 가능)");
      } else {
        alert("팔로우를 취소했습니다. 💔");
      }
      
      // 목록 갱신 (팔로워 수 업데이트 등을 위해)
      if (publicMode === "search") handleSearchPublic();
      else handleLoadPopularPublic();

    } catch (e) {
      console.error(e);
      alert(e.message || "오류가 발생했습니다.");
    }
  }

  // ─────────────────────────────
  // 모달에서 특정 플레이리스트 선택 → 곡 추가
  // ─────────────────────────────
  async function handleSelectPlaylistForSong(playlistId) {
    if (!targetSongId) return;

    try {
      await fetchJson(`${API}/playlists/${playlistId}/items`, {
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
  }

  return (
    <>
      {/* ========== 나의 플레이리스트 ========== */}
      <section className="card">
        <div className="card-header">
          <div className="card-title">
            <span>📂</span>
            <span>
              나의 플레이리스트{" "}
              <span className="card-badge">{playlists.length.toString()}</span>
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
              <span style={{ fontSize: 14, fontWeight: 600 }}>공개 설정</span>
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

        {loading && <p className="text-muted">플레이리스트 불러오는 중...</p>}

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
              {playlists.map((p) => {
                const isPublic = p.isPublic ?? p.is_public ?? true;
                return (
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
                        <span
                          className={
                            "playlist-modal-badge " +
                            (isPublic
                              ? "playlist-modal-badge--public"
                              : "playlist-modal-badge--private")
                          }
                          style={{ marginLeft: 6 }}
                        >
                          {isPublic ? "공개" : "비공개"}
                        </span>
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

                    {/* 3점 메뉴 버튼 */}
                    <div style={{ position: "relative" }}>
                      <button
                        className="btn btn-secondary playlist-menu-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlaylistMenuOpenId((prev) =>
                            prev === p.id ? null : p.id
                          );
                        }}
                      >
                        ⋮
                      </button>
                      {playlistMenuOpenId === p.id && (
                        <div
                          style={{
                            position: "absolute",
                            left: "-100px", // ← 왼쪽으로 이동
                            top: "-20%",
                            background: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            boxShadow: "0 8px 16px rgba(15, 23, 42, 0.12)",

                            zIndex: 10,

                            display: "flex", // ← 가로 배치
                            flexDirection: "row", // ← 가로 방향
                            gap: "6px", // ← 버튼 간격
                          }}
                        >
                          <button
                            className="btn btn-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlaylist(p.id);
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
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
            <h3 style={{ marginBottom: 3 }}>
              {selectedPlaylist ? selectedPlaylist.name : "(선택 안 됨)"}
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
                    검색해서 플레이리스트에 추가
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="field-input"
                      placeholder="제목 또는 가수를 입력하세요"
                      value={query}
                      onChange={(e) => handleAutocomplete(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={() =>
                        query.length > 0 && setShowAutocomplete(true)
                      }
                      onBlur={() =>
                        setTimeout(() => setShowAutocomplete(false), 200)
                      }
                    />
                    <button
                      className="btn btn-secondary"
                      onClick={handleSearchSongs}
                    >
                      {searching ? "검색 중..." : "검색"}
                    </button>
                  </div>

                  {/* 자동완성 드롭다운 */}
                  {showAutocomplete && autocompleteResults.length > 0 && (
                    <div
                      style={{
                        marginTop: 4,
                        border: "1px solid #ddd",
                        borderRadius: 4,
                        background: "#fff",
                        maxHeight: 200,
                        overflowY: "auto",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                        }}
                      >
                        {autocompleteResults.map((song, idx) => (
                          <li
                            key={`${song.id}-${idx}`}
                            style={{
                              padding: "8px 12px",
                              borderBottom: "1px solid #eee",
                              cursor: "pointer",
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#f0f0f0")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "#fff")
                            }
                            onClick={() => handleSelectFromAutocomplete(song)}
                          >
                            <strong>{song.title}</strong>
                            {song.artistName && (
                              <span
                                style={{ color: "#666", fontSize: "0.9em" }}
                              >
                                {" "}
                                · {song.artistName}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

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
                            style={{
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ textAlign: "left" }}>
                              <strong>{song.title}</strong>
                              {song.artistName && (
                                <span className="text-muted">
                                  {" "}
                                  · {song.artistName}
                                </span>
                              )}
                            </span>

                            <button
                              type="button"
                              className="playlist-button"
                              onClick={() => handleAddItemBySong(song.id)}
                              title="선택된 플레이리스트에 추가"
                            >
                              +
                            </button>
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

                {/* 플레이리스트에 담긴 곡 목록 */}
                <div>
                  <h4 style={{ marginBottom: 8 }}>플레이리스트 곡</h4>
                  {loadingItems && (
                    <p className="text-muted">곡 목록 불러오는 중...</p>
                  )}
                  <ul className="list">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="list-item"
                        style={{
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          <strong>{item.position}.</strong>{" "}
                          {item.songTitle && <span>{item.songTitle}</span>}
                          {item.artistName && (
                            <span className="text-muted">
                              {" "}
                              – {item.artistName}
                            </span>
                          )}
                        </span>

                        {/* 3점 메뉴 버튼 (곡 삭제) */}
                        <div style={{ position: "relative" }}>
                          <button
                            className="btn btn-secondary playlist-menu-button"
                            onClick={() =>
                              setItemMenuOpenId((prev) =>
                                prev === item.id ? null : item.id
                              )
                            }
                          >
                            ⋮
                          </button>
                          {itemMenuOpenId === item.id && (
                            <div
                              style={{
                                position: "absolute",
                                left: "-100px",
                                top: "-20%",
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: 8,
                                zIndex: 10,
                                display: "flex",
                                flexDirection: "row",
                                gap: "6px",
                              }}
                            >
                              <button
                                className="btn btn-danger"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
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
            <span>공개 플레이리스트 </span>
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
            {publicLoading && publicMode === "search" ? "검색 중..." : "검색"}
          </button>

          <button
            className="btn btn-secondary"
            style={{
              marginLeft: "auto",
              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", // 🔥 배경
              color: "#ffffff", // 🔥 글자색
              fontWeight: "600", // 🔥 폰트 굵기
              fontSize: "14px", // 🔥 폰트 크기
              border: "none",
            }}
            onClick={handleLoadPopularPublic}
          >
            {publicLoading && publicMode === "popular"
              ? "불러오는 중..."
              : "인기 플레이리스트"}
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

            {/* 랭킹 리스트 */}
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

                const isOpened = publicSelectedId === pl.id;

                return (
                  <div key={pl.id}>
                    {/* ▶ 한 줄 전체 클릭 가능 */}
                    <div
                      className={"public-playlist-row" + rankClass}
                      onClick={() => handleTogglePublicPlaylist(pl.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="col-rank">{rank}</div>

                      <div className="col-main">
                        <div className="public-playlist-title">{pl.name}</div>
                        <div className="public-playlist-meta">
                          만든이: {pl.ownerNickname || "알 수 없음"}
                          {" · "}곡 {pl.trackCount ?? 0}개
                        </div>

                        {/* 팔로워 비율 바 */}
                        <div className="public-playlist-bar-wrapper">
                          <div
                            className="public-playlist-bar"
                            style={{
                              width: `${Math.max(8, ratio * 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="col-followers">{followerCount}명</div>

                      <div className="col-actions">
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                              onClick={(e) => {
                              e.stopPropagation(); // 클릭 시 상세 목록 펼쳐짐 방지
                              handleFollowPublicPlaylist(pl.id); 
                            }}
                          >
                            ❤️ 팔로우
                          </button>
                      </div>
                    </div>

                    {/* ▼ 클릭 시 아래로 곡 목록 펼침 */}
                    {isOpened && (
                      <div className="public-playlist-detail">
                        {publicItemsLoading && (
                          <p className="text-muted">곡 목록 불러오는 중...</p>
                        )}

                        {publicItemsError && (
                          <p className="text-error">⚠ {publicItemsError}</p>
                        )}

                        {!publicItemsLoading && !publicItemsError && (
                          <>
                            {publicSelectedItems.length === 0 ? (
                              <p className="text-muted">
                                이 플레이리스트에 곡 정보가 없습니다.
                              </p>
                            ) : (
                              <div className="public-playlist-songs">
                                {/* 헤더 */}
                                <div className="public-playlist-songs-header">
                                  <span className="col-rank">순번</span>
                                  <span className="col-title">곡명</span>
                                  <span className="col-artist">가수</span>
                                </div>

                                {/* 곡 리스트 */}
                                <div className="public-playlist-songs-body">
                                  {publicSelectedItems.map((item, index2) => (
                                    <div
                                      key={item.id}
                                      className="public-playlist-songs-row"
                                    >
                                      <div className="col-rank">
                                        {index2 + 1}
                                      </div>

                                      <div className="col-title">
                                        <div className="song-with-add">
                                          <span className="song-title">
                                            {item.songTitle || item.title}
                                          </span>
                                          <button
                                            type="button"
                                            className="playlist-button"
                                            onClick={() =>
                                              handleOpenPlaylistPicker(
                                                item.songId || item.song_id
                                              )
                                            }
                                            title="내 플레이리스트에 추가"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>

                                      <div className="col-artist">
                                        {item.artistName ||
                                          item.artist_name ||
                                          "-"}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ====== 플레이리스트 선택 모달 (공개 플리 곡 → 내 플리에 담기) ====== */}
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
    </>
  );
}