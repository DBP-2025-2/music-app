// frontend/src/pages/LikesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../lib/http";
import HeartIcon from "../components/HeartIcon";
import { API } from "../lib/api";

export default function LikesPage() {
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  // 페이지네이션
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  /* -------------------------------------------------------------------------- */
  /*  좋아요 목록 불러오기                                                     */
  /* -------------------------------------------------------------------------- */
  const loadLikes = async () => {
    try {
      setError("");
      setLoading(true);

      const data = await fetchJson("/likes/me");

      const withFlag = (data || []).map((r) => ({
        ...r,
        user_liked: 1,
      }));

      setLikes(withFlag);
      setPage(1);
    } catch (e) {
      console.error(e);
      setError(e.message || "좋아요 목록을 불러오는데 실패했습니다.");
      setLikes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLikes();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*  검색 필터                                                                 */
  /* -------------------------------------------------------------------------- */
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return likes;

    return likes.filter((row) => {
      const title = (row.song_title || "").toLowerCase();
      const artist = (row.artist_name || "").toLowerCase();
      return title.includes(t) || artist.includes(t);
    });
  }, [likes, q]);

  /* -------------------------------------------------------------------------- */
  /*  페이지네이션                                                              */
  /* -------------------------------------------------------------------------- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedLikes = useMemo(
    () =>
      filtered.slice(
        (page - 1) * PAGE_SIZE,
        (page - 1) * PAGE_SIZE + PAGE_SIZE
      ),
    [filtered, page]
  );

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));

  /* -------------------------------------------------------------------------- */
  /*  좋아요 토글 → 해제 시 목록에서 제거                                      */
  /* -------------------------------------------------------------------------- */
  const handleToggleLike = async (songId) => {
    if (!songId) return;

    try {
      setBusy(true);

      const res = await fetchJson("/likes/toggle", {
        method: "POST",
        body: JSON.stringify({ songId }),
      });

      if (res?.liked === false) {
        // 목록에서 제거
        setLikes((prev) => prev.filter((r) => r.song_id !== songId));
      } else {
        await loadLikes();
      }
    } catch (e) {
      alert(e.message || "좋아요 처리 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*  ▶️ 전체 재생 (Play All)                                                 */
  /* -------------------------------------------------------------------------- */
  const handlePlayAllSongs = async () => {
    if (likes.length === 0) {
      alert("좋아요한 곡이 없습니다.");
      return;
    }

    try {
      setBusy(true);

      // 좋아요 목록 전체 재생 기록 생성
      for (const row of likes) {
        await fetchJson(`${API}/play-history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ song_id: row.song_id }),
        });
      }

      alert(`🎧 좋아요한 전체 곡 ${likes.length}개를 재생 큐에 추가했습니다!`);
    } catch (e) {
      console.error(e);
      alert(e.message || "전체 재생에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*  렌더링                                                                    */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="charts-page">
      {/* 상단 헤더 */}
      <div className="charts-header-row">
        <div>
          <h1 className="charts-title">내 좋아요</h1>
          <p className="charts-subtitle">내가 좋아요한 곡들을 한눈에!</p>
        </div>

        <div className="charts-filters">
          <input
            className="charts-select"
            style={{ width: 260 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="곡명/가수 검색..."
          />
          <button
            className="charts-page-btn"
            onClick={loadLikes}
            disabled={loading}
          >
            새로고침
          </button>
        </div>
      </div>

      <div className="charts-card">
        {/* 에러 */}
        {error && <div className="charts-error">⚠ {error}</div>}

        {/* 로딩 */}
        {loading && (
          <div className="charts-loading">좋아요 목록을 불러오는 중...</div>
        )}

        {/* ▶️ 전체 재생 버튼 */}
        {!loading && likes.length > 0 && (
          <div style={{ marginBottom: "16px", textAlign: "right" }}>
            <button
              className="btn primary"
              onClick={handlePlayAllSongs}
              disabled={busy}
            >
              ▶️ 전체 재생
            </button>
          </div>
        )}

        {/* 테이블 */}
        {!loading && (
          <>
            <div className="charts-table-header">
              <span className="col-rank">순위</span>
              <span className="col-title">곡명</span>
              <span className="col-artist">가수</span>
              <span className="col-album">앨범</span>
              <span className="col-like">좋아요</span>
            </div>

            <div className="charts-table-body">
              {pagedLikes.map((row, index) => {
                const globalRank = (page - 1) * PAGE_SIZE + (index + 1);

                return (
                  <div key={row.song_id} className="charts-row">
                    <div className="col-rank">{globalRank}</div>

                    <div className="col-title">
                      <div className="song-title">{row.song_title}</div>
                    </div>

                    <div className="col-artist">{row.artist_name}</div>
                    <div className="col-album">{row.album_title}</div>

                    <div className="col-like">
                      <button
                        onClick={() => handleToggleLike(row.song_id)}
                        className="like-button like-button--active"
                        disabled={busy}
                      >
                        <HeartIcon filled={true} size={20} />
                        <span className="like-count">취소</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {!loading && filtered.length === 0 && (
                <div className="charts-empty">
                  좋아요한 곡이 없습니다.
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            {filtered.length > 0 && (
              <div className="charts-pagination">
                <button
                  className="charts-page-btn"
                  onClick={handlePrevPage}
                  disabled={page === 1}
                >
                  ← 이전
                </button>
                <span className="charts-page-info">
                  {page} / {totalPages} 페이지
                </span>
                <button
                  className="charts-page-btn"
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                >
                  다음 →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
