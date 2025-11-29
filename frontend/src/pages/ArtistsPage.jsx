// frontend/src/pages/ArtistsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";
import HeartIcon from "../components/HeartIcon"; // ✅ 차트에서 쓰던 하트 아이콘

export default function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [name, setName] = useState("");

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 내가 팔로우한 아티스트 id 목록
  const [followedIds, setFollowedIds] = useState(new Set());

  // 페이지네이션
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // 정렬 옵션: name(가나다) | follow(팔로우 많은 순)
  const [sortMode, setSortMode] = useState("name");

  // 추천 탭: follow | duration | top10
  const [recommendTab, setRecommendTab] = useState("follow");

  // 아티스트 클릭 시 곡 리스트
  const [selectedArtistId, setSelectedArtistId] = useState(null);
  const [selectedArtistSongs, setSelectedArtistSongs] = useState([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [songsError, setSongsError] = useState("");

  // “…” 메뉴
  const [openMenuArtistId, setOpenMenuArtistId] = useState(null);

  // ─────────────────────────────
  // 차트와 동일한 플리 선택 모달 상태
  // ─────────────────────────────
  const [playlistPickerOpen, setPlaylistPickerOpen] = useState(false);
  const [playlistPickerLoading, setPlaylistPickerLoading] = useState(false);
  const [playlistPickerError, setPlaylistPickerError] = useState("");
  const [myPlaylists, setMyPlaylists] = useState([]);
  const [targetSongId, setTargetSongId] = useState(null);

  // 전체 아티스트 로드
  const loadAll = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await fetchJson(`${API}/artists`);
      setArtists(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  // 내 팔로우(아티스트) 목록 로드
  const loadMyFollows = async () => {
    try {
      const res = await fetchJson(`${API}/follows/list`);
      const follows = res?.follows ?? [];

      const artistIds = follows
        .filter((f) => f.target_type === "artist")
        .map(
          (f) =>
            f.following_id ??
            f.followingId ?? // 혹시 카멜케이스로 올 수도 있어서 방어
            f.artist_id
        )
        .filter((id) => id != null);

      setFollowedIds(new Set(artistIds));
    } catch (e) {
      console.error("내 팔로우 목록 불러오기 실패:", e);
    }
  };

  useEffect(() => {
    // 아티스트 목록 + 내 팔로우 목록
    loadAll();
    loadMyFollows();
  }, []);

  // 아티스트 추가
  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setBusy(true);
      await fetchJson(`${API}/artists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setName("");
      await loadAll();
      setPage(1);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  // 수정 시작
  const startEdit = (artist) => {
    setEditId(artist.id);
    setEditName(artist.name);
  };

  // 수정 저장
  const save = async (id) => {
    if (!editName.trim()) return;

    try {
      setBusy(true);
      await fetchJson(`${API}/artists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      setEditId(null);
      setEditName("");
      await loadAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  // 삭제
  const remove = async (id) => {
    if (!confirm("삭제할까요?")) return;
    try {
      setBusy(true);
      await fetchJson(`${API}/artists/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  // 검색 필터
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return artists;
    return artists.filter((a) => a.name.toLowerCase().includes(t));
  }, [artists, q]);

  // 정렬 적용
  const sortedArtists = useMemo(() => {
    const arr = [...filtered];

    if (sortMode === "name") {
      // 가나다 순
      return arr.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", "ko")
      );
    }

    if (sortMode === "follow") {
      // 팔로우 많은 순 (followCount 없으면 0)
      return arr.sort(
        (a, b) => (b.followCount || 0) - (a.followCount || 0)
      );
    }

    return arr;
  }, [filtered, sortMode]);

  // 검색어나 정렬 바뀌면 페이지 초기화
  useEffect(() => {
    setPage(1);
  }, [q, sortMode]);

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(sortedArtists.length / pageSize));

  const viewPaged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedArtists.slice(start, start + pageSize);
  }, [sortedArtists, page]);

  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  // ─────────────────────────────
  // 팔로우 토글 (백엔드 연동)
  // ─────────────────────────────
  const toggleFollow = async (artist) => {
    const isFollowed = followedIds.has(artist.id);

    try {
      if (isFollowed) {
        // 언팔로우
        await fetchJson(`${API}/follows`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            following_id: artist.id,
            target_type: "artist",
          }),
        });
      } else {
        // 팔로우
        await fetchJson(`${API}/follows`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_input: artist.name,
            target_type: "artist",
          }),
        });
      }

      // 로컬 상태 업데이트
      setFollowedIds((prev) => {
        const next = new Set(prev);
        if (isFollowed) next.delete(artist.id);
        else next.add(artist.id);
        return next;
      });

      // 서버 기준으로 다시 맞추고 싶으면 아래 주석을 풀면 됨
      // await loadMyFollows();
      // await loadAll(); // followCount를 서버에서 갱신해줄 경우
    } catch (e) {
      console.error(e);
      alert(e.message || "팔로우 처리 중 오류가 발생했습니다.");
    }
  };

  // 추천용 리스트
  const topByFollow = useMemo(
    () =>
      [...artists]
        .sort((a, b) => (b.followCount || 0) - (a.followCount || 0))
        .slice(0, 10),
    [artists]
  );

  const topByDuration = useMemo(
    () =>
      [...artists]
        .sort((a, b) => (b.chartWeeks || 0) - (a.chartWeeks || 0))
        .slice(0, 10),
    [artists]
  );

  const topByTop10 = useMemo(
    () =>
      [...artists]
        .sort(
          (a, b) => (b.top10Appearances || 0) - (a.top10Appearances || 0)
        )
        .slice(0, 10),
    [artists]
  );

  const currentRecommendList =
    recommendTab === "follow"
      ? topByFollow
      : recommendTab === "duration"
      ? topByDuration
      : topByTop10;

  // 추천 목록 상위 3명 (포디움용)
  const podiumArtists = currentRecommendList.slice(0, 3);

  // 아티스트 클릭 → 곡 목록
  const handleSelectArtist = async (artist) => {
    // 다시 클릭하면 닫기
    if (selectedArtistId === artist.id) {
      setSelectedArtistId(null);
      setSelectedArtistSongs([]);
      setSongsError("");
      return;
    }

    setSelectedArtistId(artist.id);
    setSelectedArtistSongs([]);
    setSongsError("");

    try {
      setSongsLoading(true);
      const songs = await fetchJson(`${API}/songs?artistId=${artist.id}`);
      setSelectedArtistSongs(songs);
    } catch (e) {
      setSongsError(String(e));
    } finally {
      setSongsLoading(false);
    }
  };

  // ─────────────────────────────
  // 차트와 동일한 좋아요 토글
  // ─────────────────────────────
  const handleLikeToggle = async (songId) => {
    try {
      const result = await fetchJson("/likes/toggle", {
        method: "POST",
        body: JSON.stringify({ songId }),
      });

      setSelectedArtistSongs((prev) =>
        prev.map((s) => {
          const id = s.id ?? s.song_id;
          if (id !== songId) return s;
          const likedNow = result.liked ? 1 : 0;
          const currentLikes = s.total_likes ?? 0;
          return {
            ...s,
            user_liked: likedNow,
            total_likes: currentLikes + (result.liked ? 1 : -1),
          };
        })
      );
    } catch (e) {
      alert(e.message);
    }
  };

  // ─────────────────────────────
  // 차트와 동일한 플리 추가 로직
  // ─────────────────────────────
  const handleAddToPlaylist = async (songId) => {
    try {
      setTargetSongId(songId);
      setPlaylistPickerOpen(true);
      setPlaylistPickerError("");
      setPlaylistPickerLoading(true);

      const data = await fetchJson("/playlists"); // 내 플레이리스트 목록
      setMyPlaylists(data);
    } catch (e) {
      console.error(e);
      setPlaylistPickerError(
        e.message || "플레이리스트 목록을 불러오는데 실패했습니다."
      );
    } finally {
      setPlaylistPickerLoading(false);
    }
  };

  const handleSelectPlaylistForSong = async (playlistId) => {
    if (!targetSongId) return;

    try {
      await fetchJson(`/playlists/${playlistId}/items`, {
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
  };

  return (
    <div className="content-page">
      <div className="content-container">
        {/* 상단 헤더 */}
        <div className="page-header">
          <h1 className="page-title">
            아티스트 <span className="badge">{filtered.length}</span>
          </h1>
          <button className="btn new" onClick={loadAll}>
            새로고침
          </button>
        </div>

        <div className="content-panel artists-page">
          {/* ============ 추천 아티스트 ============ */}
          <section className="artist-recommend">
            <div className="artist-recommend-header">
              <h2>추천 아티스트</h2>
              <div className="artist-recommend-tabs">
                <button
                  className={
                    "artist-recommend-tab" +
                    (recommendTab === "follow" ? " active" : "")
                  }
                  onClick={() => setRecommendTab("follow")}
                >
                  팔로우 순위 Top 10
                </button>
                <button
                  className={
                    "artist-recommend-tab" +
                    (recommendTab === "duration" ? " active" : "")
                  }
                  onClick={() => setRecommendTab("duration")}
                >
                  차트 인 기간 Top 10
                </button>
                <button
                  className={
                    "artist-recommend-tab" +
                    (recommendTab === "top10" ? " active" : "")
                  }
                  onClick={() => setRecommendTab("top10")}
                >
                  TOP10 진입 수 Top 10
                </button>
              </div>
            </div>

            {/* 🔼 포디움 영역 (1, 2, 3위) */}
            {podiumArtists.length > 0 && (
              <div className="artist-recommend-podium">
                {/* 2위 */}
                {podiumArtists[1] && (
                  <div className="artist-recommend-podium-item podium-second">
                    <div className="podium-medal-wrapper">
                      <div className="podium-medal">
                        <span>2</span>
                      </div>
                      <div className="podium-ribbons">
                        <div className="podium-ribbon" />
                        <div className="podium-ribbon" />
                      </div>
                    </div>
                    <div className="podium-avatar">
                      <span>{podiumArtists[1].name?.[0] || "?"}</span>
                    </div>
                    <div className="podium-name">{podiumArtists[1].name}</div>
                    <div className="podium-meta">
                      {recommendTab === "follow" && (
                        <>
                          팔로워{" "}
                          <strong>{podiumArtists[1].followCount ?? 0}</strong>명
                        </>
                      )}
                      {recommendTab === "duration" && (
                        <>
                          차트 인{" "}
                          <strong>{podiumArtists[1].chartWeeks ?? 0}</strong>주
                        </>
                      )}
                      {recommendTab === "top10" && (
                        <>
                          TOP10 진입{" "}
                          <strong>
                            {podiumArtists[1].top10Appearances ?? 0}
                          </strong>
                          회
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* 1위 */}
                {podiumArtists[0] && (
                  <div className="artist-recommend-podium-item podium-first">
                    <div className="podium-medal-wrapper">
                      <div className="podium-medal">
                        <span>1</span>
                      </div>
                      <div className="podium-ribbons">
                        <div className="podium-ribbon" />
                        <div className="podium-ribbon" />
                      </div>
                    </div>
                    <div className="podium-avatar">
                      <span>{podiumArtists[0].name?.[0] || "?"}</span>
                    </div>
                    <div className="podium-name">{podiumArtists[0].name}</div>
                    <div className="podium-meta">
                      {recommendTab === "follow" && (
                        <>
                          팔로워{" "}
                          <strong>{podiumArtists[0].followCount ?? 0}</strong>명
                        </>
                      )}
                      {recommendTab === "duration" && (
                        <>
                          차트 인{" "}
                          <strong>{podiumArtists[0].chartWeeks ?? 0}</strong>주
                        </>
                      )}
                      {recommendTab === "top10" && (
                        <>
                          TOP10 진입{" "}
                          <strong>
                            {podiumArtists[0].top10Appearances ?? 0}
                          </strong>
                          회
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* 3위 */}
                {podiumArtists[2] && (
                  <div className="artist-recommend-podium-item podium-third">
                    <div className="podium-medal-wrapper">
                      <div className="podium-medal">
                        <span>3</span>
                      </div>
                      <div className="podium-ribbons">
                        <div className="podium-ribbon" />
                        <div className="podium-ribbon" />
                      </div>
                    </div>
                    <div className="podium-avatar">
                      <span>{podiumArtists[2].name?.[0] || "?"}</span>
                    </div>
                    <div className="podium-name">{podiumArtists[2].name}</div>
                    <div className="podium-meta">
                      {recommendTab === "follow" && (
                        <>
                          팔로워{" "}
                          <strong>{podiumArtists[2].followCount ?? 0}</strong>명
                        </>
                      )}
                      {recommendTab === "duration" && (
                        <>
                          차트 인{" "}
                          <strong>{podiumArtists[2].chartWeeks ?? 0}</strong>주
                        </>
                      )}
                      {recommendTab === "top10" && (
                        <>
                          TOP10 진입{" "}
                          <strong>
                            {podiumArtists[2].top10Appearances ?? 0}
                          </strong>
                          회
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 1~10위 리스트(기존 카드) */}
            {currentRecommendList.length === 0 ? (
              <div className="artist-recommend-empty">
                추천 데이터를 불러오는 중이거나 아직 없습니다.
              </div>
            ) : (
              <div className="artist-recommend-grid">
                {/* 왼쪽 1~5위 */}
                <div className="artist-recommend-col">
                  {currentRecommendList.slice(0, 5).map((a, idx) => {
                    const isFollowed = followedIds.has(a.id);
                    const rank = idx + 1;

                    return (
                      <div key={a.id} className="artist-recommend-card">
                        <div className="artist-recommend-rank">{rank}</div>
                        <div className="artist-recommend-avatar">
                          <span>{a.name?.[0] || "?"}</span>
                        </div>
                        <div className="artist-recommend-main">
                          <div className="artist-recommend-name">{a.name}</div>
                          <div className="artist-recommend-meta">
                            {recommendTab === "follow" && (
                              <>
                                팔로워{" "}
                                <strong>{a.followCount ?? 0}</strong>명
                              </>
                            )}
                            {recommendTab === "duration" && (
                              <>
                                차트 인{" "}
                                <strong>{a.chartWeeks ?? 0}</strong>주
                              </>
                            )}
                            {recommendTab === "top10" && (
                              <>
                                TOP10 진입{" "}
                                <strong>
                                  {a.top10Appearances ?? 0}
                                </strong>
                                회
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          className={
                            "artist-follow-btn small" +
                            (isFollowed ? " artist-follow-btn--active" : "")
                          }
                          onClick={() => toggleFollow(a)}
                        >
                          {isFollowed ? "팔로잉" : "팔로우"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* 오른쪽 6~10위 */}
                <div className="artist-recommend-col artist-recommend-col--right">
                  {currentRecommendList.slice(5, 10).map((a, idx) => {
                    const isFollowed = followedIds.has(a.id);
                    const rank = idx + 6;

                    return (
                      <div key={a.id} className="artist-recommend-card">
                        <div className="artist-recommend-rank">{rank}</div>
                        <div className="artist-recommend-avatar">
                          <span>{a.name?.[0] || "?"}</span>
                        </div>
                        <div className="artist-recommend-main">
                          <div className="artist-recommend-name">{a.name}</div>
                          <div className="artist-recommend-meta">
                            {recommendTab === "follow" && (
                              <>
                                팔로워{" "}
                                <strong>{a.followCount ?? 0}</strong>명
                              </>
                            )}
                            {recommendTab === "duration" && (
                              <>
                                차트 인{" "}
                                <strong>{a.chartWeeks ?? 0}</strong>주
                              </>
                            )}
                            {recommendTab === "top10" && (
                              <>
                                TOP10 진입{" "}
                                <strong>
                                  {a.top10Appearances ?? 0}
                                </strong>
                                회
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          className={
                            "artist-follow-btn small" +
                            (isFollowed ? " artist-follow-btn--active" : "")
                          }
                          onClick={() => toggleFollow(a)}
                        >
                          {isFollowed ? "팔로잉" : "팔로우"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* ============ 검색 + 추가 ============ */}
          <div className="artist-search-toolbar">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="아티스트 이름으로 검색..."
            />
          </div>

          <form onSubmit={add} className="add-form">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="새로운 아티스트 이름을 입력하세요"
              style={{ flex: 1.5 }}
            />
            <button className="btn primary" disabled={!name.trim() || busy}>
              {busy ? (
                <>
                  <span className="loading-spinner" /> 추가 중...
                </>
              ) : (
                <>추가</>
              )}
            </button>
          </form>

          {/* 🔻 정렬 옵션 바 */}
          <div className="artist-sort-toolbar">
            <span className="artist-sort-label">정렬</span>
            <button
              type="button"
              className={
                "artist-sort-btn" + (sortMode === "name" ? " active" : "")
              }
              onClick={() => setSortMode("name")}
            >
              가나다 순
            </button>
            <button
              type="button"
              className={
                "artist-sort-btn" + (sortMode === "follow" ? " active" : "")
              }
              onClick={() => setSortMode("follow")}
            >
              팔로우 많은 순
            </button>
          </div>

          {/* 에러/로딩/빈 상태 */}
          {error && (
            <div className="error-message">
              <span>❗</span>
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <div className="empty-state-text">아티스트를 불러오는 중...</div>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <div className="empty-state-text">
                {q ? "검색 결과가 없습니다." : "아티스트를 추가해보세요!"}
              </div>
            </div>
          )}

          {/* ============ 리스트 ============ */}
          {!loading && !error && filtered.length > 0 && (
            <>
              <div className="artist-list">
                {viewPaged.map((a) => {
                  const isEditing = editId === a.id;
                  const isFollowed = followedIds.has(a.id);
                  const isSelected = selectedArtistId === a.id;

                  return (
                    <div
                      key={a.id}
                      className={
                        "artist-row" +
                        (isSelected ? " artist-row--active" : "")
                      }
                      onClick={() => handleSelectArtist(a)}
                    >
                      {/* 썸네일 */}
                      <div className="artist-thumb">
                        <div className="artist-thumb-inner">
                          {a.imageUrl ? (
                            <img src={a.imageUrl} alt={a.name} />
                          ) : (
                            <span className="artist-thumb-name">{a.name}</span>
                          )}
                        </div>
                      </div>

                      {/* 중앙 정보 */}
                      <div className="artist-main">
                        {isEditing ? (
                          <div
                            className="artist-edit-form"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="아티스트 이름"
                            />
                            <div className="artist-edit-actions">
                              <button
                                className="btn success small"
                                onClick={() => save(a.id)}
                                disabled={busy}
                              >
                                💾 저장
                              </button>
                              <button
                                className="btn muted small"
                                onClick={() => {
                                  setEditId(null);
                                  setEditName("");
                                }}
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="artist-name-line">
                              <span className="artist-name">{a.name}</span>
                              <span className="artist-id">#{a.id}</span>
                            </div>
                            <div className="artist-meta">
                              <span>
                                팔로워{" "}
                                <strong>
                                  {typeof a.followCount === "number"
                                    ? a.followCount
                                    : 0}
                                </strong>
                                명
                              </span>
                            </div>
                            <div className="artist-rep-song">
                              대표곡{" "}
                              <span>
                                {a.repSongTitle || "대표곡 정보 준비중"}
                              </span>
                            </div>
                          </>
                        )}

                        {/* 선택된 아티스트 → 곡 리스트 */}
                        {isSelected && (
                          <div className="artist-songs-panel">
                            <div className="artist-songs-header">
                              <span>곡 리스트</span>
                              {songsLoading && (
                                <span className="artist-songs-status">
                                  불러오는 중...
                                </span>
                              )}
                              {songsError && (
                                <span className="artist-songs-status error">
                                  {songsError}
                                </span>
                              )}
                            </div>

                            {!songsLoading &&
                              !songsError &&
                              selectedArtistSongs.length === 0 && (
                                <div className="artist-songs-empty">
                                  등록된 곡이 없습니다.
                                </div>
                              )}

                            {selectedArtistSongs.length > 0 && (
                              <ul className="artist-songs-list">
                                {selectedArtistSongs.map((song) => {
                                  const songId = song.id ?? song.song_id;

                                  return (
                                    <li
                                      key={songId}
                                      className="artist-song-row"
                                    >
                                      <div className="artist-song-main">
                                        <span className="artist-song-title">
                                          {song.title}
                                        </span>
                                        <span className="artist-song-artist">
                                          {a.name}
                                        </span>
                                      </div>

                                      {/* 좋아요 + 플리 버튼 */}
                                      <div className="artist-song-actions">
                                        <button
                                          className={
                                            "like-button" +
                                            (song.user_liked
                                              ? " like-button--active"
                                              : "")
                                          }
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleLikeToggle(songId);
                                          }}
                                          title="좋아요"
                                        >
                                          <HeartIcon
                                            filled={song.user_liked}
                                            size={18}
                                          />
                                          <span className="like-count">
                                            {song.total_likes ?? 0}
                                          </span>
                                        </button>

                                        <button
                                          className="playlist-button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToPlaylist(songId);
                                          }}
                                          title="플레이리스트에 추가"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 오른쪽: 팔로우 + … 메뉴 */}
                      <div
                        className="artist-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className={
                            "artist-follow-btn" +
                            (isFollowed ? " artist-follow-btn--active" : "")
                          }
                          onClick={() => toggleFollow(a)}
                        >
                          {isFollowed ? "팔로잉" : "팔로우"}
                        </button>

                        <div className="artist-admin-buttons">
                          <button
                            className="artist-menu-button"
                            onClick={() =>
                              setOpenMenuArtistId((prev) =>
                                prev === a.id ? null : a.id
                              )
                            }
                          >
                            ⋮
                          </button>
                          {openMenuArtistId === a.id && (
                            <div className="artist-menu-dropdown">
                              <button
                                onClick={() => {
                                  startEdit(a);
                                  setOpenMenuArtistId(null);
                                }}
                              >
                                ✏️ 수정
                              </button>
                              <button
                                onClick={() => {
                                  remove(a.id);
                                  setOpenMenuArtistId(null);
                                }}
                              >
                                🗑️ 삭제
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 페이지네이션 */}
              <div className="charts-pagination">
                <button
                  className="charts-page-btn"
                  onClick={handlePrevPage}
                  disabled={page === 1}
                >
                  ← 이전 20명
                </button>
                <span className="charts-page-info">
                  {page} / {totalPages} 페이지
                </span>
                <button
                  className="charts-page-btn"
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                >
                  다음 20명 →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─────────────────────────────
          차트와 동일한 플리 선택 모달
      ───────────────────────────── */}
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
    </div>
  );
}
