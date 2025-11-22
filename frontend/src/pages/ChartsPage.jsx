// frontend/src/pages/ChartsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "../lib/http";
import HeartIcon from "../components/HeartIcon";

export default function ChartsPage() {
  const [periods, setPeriods] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    // ─────────────────────────────
  // 플리 선택 모달 (차트 → 플리추가)
  // ─────────────────────────────
  const [playlistPickerOpen, setPlaylistPickerOpen] = useState(false);
  const [playlistPickerLoading, setPlaylistPickerLoading] = useState(false);
  const [playlistPickerError, setPlaylistPickerError] = useState("");
  const [myPlaylists, setMyPlaylists] = useState([]);
  const [targetSongId, setTargetSongId] = useState(null);


  // 연도별 인기곡
  const [yearlyTop, setYearlyTop] = useState([]);
  const [selectedYearForTop, setSelectedYearForTop] = useState(null);
  const [yearlyLoading, setYearlyLoading] = useState(false);
  const [yearlyError, setYearlyError] = useState("");

  // 뷰 모드: 주간 차트 / 연도별 TOP
  const [viewMode, setViewMode] = useState("weekly"); // "weekly" | "yearly"

  // 페이지네이션 (20개씩)
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  /* -------------------------------------------------------------------------- */
  /*  차트 기간 목록 불러오기                                                   */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJson("/charts/periods");
        setPeriods(data);
        if (data.length > 0) {
          setSelectedYear(data[0].year);
          setSelectedWeek(data[0].week);
        }
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*  선택된 기간의 차트 데이터 가져오기                                       */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!selectedYear || !selectedWeek) return;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchJson(
          `/charts/weekly?year=${selectedYear}&week=${selectedWeek}&type=weekly`
        );
        setEntries(data);
        setPage(1); // 기간 바뀌면 1페이지로 리셋
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedYear, selectedWeek]);

  const currentPeriod = useMemo(
    () =>
      periods.find(
        (p) => p.year === selectedYear && p.week === selectedWeek
      ),
    [periods, selectedYear, selectedWeek]
  );

  const years = useMemo(
    () =>
      Array.from(new Set(periods.map((p) => p.year))).sort((a, b) => b - a),
    [periods]
  );


  /* -------------------------------------------------------------------------- */
  /*  연도별 인기곡 데이터 가져오기                                            */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    if (!selectedYearForTop) return;

    (async () => {
      try {
        setYearlyLoading(true);
        setYearlyError("");
        const data = await fetchJson(
          `/charts/top-liked?year=${selectedYearForTop}`
        );
        setYearlyTop(data);
      } catch (e) {
        setYearlyError(e.message);
        setYearlyTop([]);
      } finally {
        setYearlyLoading(false);
      }
    })();
  }, [selectedYearForTop]);

  const weeksForYear = useMemo(
    () =>
      periods
        .filter((p) => p.year === selectedYear)
        .map((p) => p.week)
        .sort((a, b) => a - b),
    [periods, selectedYear]
  );

  /* -------------------------------------------------------------------------- */
  /*  페이지네이션 계산                                                        */
  /* -------------------------------------------------------------------------- */
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const pagedEntries = useMemo(
    () =>
      entries.slice(
        (page - 1) * PAGE_SIZE,
        (page - 1) * PAGE_SIZE + PAGE_SIZE
      ),
    [entries, page]
  );

  const handlePrevPage = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setPage((p) => Math.min(totalPages, p + 1));
  };

  /* -------------------------------------------------------------------------- */
  /*  좋아요 Toggle (주간 + 연도별 둘 다 반영)                                  */
  /* -------------------------------------------------------------------------- */
  const handleLikeToggle = async (songId) => {
    try {
      const result = await fetchJson("/likes/toggle", {
        method: "POST",
        body: JSON.stringify({ songId }),
      });

      // 주간 차트 업데이트
      setEntries((prev) =>
        prev.map((e) =>
          e.song_id === songId
            ? {
                ...e,
                user_liked: result.liked ? 1 : 0,
                total_likes: e.total_likes + (result.liked ? 1 : -1),
              }
            : e
        )
      );

      // 연도별 TOP도 같이 반영
      setYearlyTop((prev) =>
        prev.map((e) =>
          e.song_id === songId
            ? {
                ...e,
                user_liked: result.liked ? 1 : 0,
                total_likes: e.total_likes + (result.liked ? 1 : -1),
              }
            : e
        )
      );
    } catch (e) {
      alert(e.message);
    }
  };

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


  /* -------------------------------------------------------------------------- */
  /*  렌더링                                                                    */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="charts-page">
      {/* ====== 연도 타임라인 (연도별 TOP 선택용) ====== */}
      <div className="charts-year-timeline">
        <div className="charts-year-timeline-header">
          <h2 className="charts-year-title">연도별 인기순위</h2>
          <p className="charts-year-desc">
            좋아요 TOP 20 
          </p>
        </div>

        <div className="charts-year-line" />
        {years.map((y) => {
          const active = y === selectedYearForTop;
          return (
            <button
              key={y}
              className={
                "year-timeline-item" +
                (active ? " year-timeline-item--active" : "")
              }
              onClick={() => {
                setSelectedYearForTop(y);
                setViewMode("yearly"); // 연도 클릭 시 연도별 TOP 뷰로 전환
              }}
            >
              <span className="year-timeline-dot" />
              <span className="year-timeline-label">{y}년</span>
            </button>
          );
        })}
      </div>

      {/* 상단 가운데 Music Hub 타이틀 */}
      <div className="chart-hero-title">
        <h1>Music Hub Chart</h1>
      </div>

      {/* 타이틀 + 기간 선택 */}
      <div className="charts-header-row">
        <div>
          <h1 className="charts-title">
            {viewMode === "weekly" ? "Charts" : "Yearly Top 20"}
          </h1>

          {viewMode === "weekly" && currentPeriod && (
            <p className="charts-subtitle">
              weekly · {currentPeriod.year}년 {currentPeriod.week}주차{" "}
              <span className="charts-date-range">
                ({currentPeriod.week_start_date} ~{" "}
                {currentPeriod.week_end_date})
              </span>
            </p>
          )}

          {viewMode === "yearly" && selectedYearForTop && (
            <>
              <p className="charts-subtitle">
                {selectedYearForTop}년 좋아요 TOP 20
              </p>
              {/* 🔙 연도별 차트에서 메인 주간 차트로 돌아가는 버튼 */}
              <button
                type="button"
                className="charts-back-btn"
                onClick={() => {
                  setViewMode("weekly") 
                  setSelectedYearForTop(null); 
              }}
            >
                메인 주간 차트로 돌아가기
              </button>
            </>
          )}
        </div>

        {/* ✅ 주간 차트일 때만 연/주차 셀렉트 보여주기 */}
        {viewMode === "weekly" && (
          <div className="charts-filters">
            <select
              className="charts-select"
              value={selectedYear ?? ""}
              onChange={(e) => {
                const newYear = Number(e.target.value);
                setSelectedYear(newYear);
                setViewMode("weekly");

                const firstWeekForYear =
                  periods
                    .filter((p) => p.year === newYear)
                    .map((p) => p.week)
                    .sort((a, b) => a - b)[0] ?? null;

                setSelectedWeek(firstWeekForYear);
                setPage(1); // 페이지도 1로 리셋
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>

            <select
              className="charts-select"
              value={selectedWeek ?? ""}
              onChange={(e) => {
                setSelectedWeek(Number(e.target.value));
                setViewMode("weekly");
              }}
            >
              {weeksForYear.map((w) => (
                <option key={w} value={w}>
                  {w}주차
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ====== 주간 차트 카드 ====== */}
      {viewMode === "weekly" && (
        <div className="charts-card">
          {error && <div className="charts-error">⚠️ {error}</div>}
          {loading && (
            <div className="charts-loading">차트 불러오는 중...</div>
          )}

          {!loading && (
            <>
              {/* 테이블 헤더 */}
              <div className="charts-table-header">
                <span className="col-rank">순위</span>
                <span className="col-title">곡명</span>
                <span className="col-artist">가수</span>
                <span className="col-album">앨범</span>
                <span className="col-like">좋아요</span>
                <span className="col-playlist">플리추가</span>
              </div>

              {/* 테이블 바디 (20개씩) */}
              <div className="charts-table-body">
                {pagedEntries.map((item, index) => {
                  const globalRank =
                    (page - 1) * PAGE_SIZE + (index + 1);

                  return (
                    <div
                      key={item.song_id}
                      className={
                        "charts-row" +
                        (globalRank <= 10 ? " charts-row--top10" : "")
                      }
                    >
                      <div className="col-rank">{globalRank}</div>

                      <div className="col-title">
                        <div className="song-title">
                          {item.song_title}
                        </div>
                      </div>

                      <div className="col-artist">
                        {item.artist_name}
                      </div>

                      <div className="col-album">
                        {item.album_title}
                      </div>

                      {/* 좋아요 버튼 */}
                      <div className="col-like">
                        <button
                          onClick={() => handleLikeToggle(item.song_id)}
                          className={`like-button ${
                            item.user_liked
                              ? "like-button--active"
                              : ""
                          }`}
                        >
                          <HeartIcon
                            filled={item.user_liked}
                            size={20}
                          />
                          <span className="like-count">
                            {item.total_likes}
                          </span>
                        </button>
                      </div>

                      {/* 플리추가 버튼 */}
                      <div className="col-playlist">
                        <button
                          className="playlist-button"
                          onClick={() =>
                            handleAddToPlaylist(item.song_id)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}

                {entries.length === 0 && (
                  <div className="charts-empty">
                    차트 데이터가 없습니다.
                  </div>
                )}
              </div>

              {/* 페이지네이션 */}
              {entries.length > 0 && (
                <div className="charts-pagination">
                  <button
                    className="charts-page-btn"
                    onClick={handlePrevPage}
                    disabled={page === 1}
                  >
                    ← 이전 20곡
                  </button>
                  <span className="charts-page-info">
                    {page} / {totalPages} 페이지
                  </span>
                  <button
                    className="charts-page-btn"
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                  >
                    다음 20곡 →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ====== 연도별 인기곡 섹션 ====== */}
      {viewMode === "yearly" && (
        <div className="charts-card yearly-card">
          <div className="charts-table-header">
            <span className="col-rank">연도 TOP</span>
            <span className="col-title">곡명</span>
            <span className="col-artist">가수</span>
            <span className="col-album">앨범</span>
            <span className="col-like">좋아요</span>
          </div>

          {yearlyError && (
            <div className="charts-error">⚠ {yearlyError}</div>
          )}

          {yearlyLoading ? (
            <div className="charts-loading">
              {selectedYearForTop}년 인기곡 불러오는 중...
            </div>
          ) : (
            <div className="charts-table-body">
              {yearlyTop.slice(0, 20).map((item, index) => (
                <div key={item.song_id} className="charts-row">
                  <div className="col-rank">{index + 1}</div>
                  <div className="col-title">
                    <div className="song-title">
                      {item.song_title}
                    </div>
                  </div>
                  <div className="col-artist">
                    {item.artist_name}
                  </div>
                  <div className="col-album">
                    {item.album_title}
                  </div>

                  <div className="col-like">
                    <button
                      onClick={() => handleLikeToggle(item.song_id)}
                      className={
                        "like-button" +
                        (item.user_liked
                          ? " like-button--active"
                          : "")
                      }
                    >
                      <HeartIcon
                        filled={item.user_liked}
                        size={20}
                      />
                      <span className="like-count">
                        {item.total_likes}
                      </span>
                    </button>
                  </div>
                </div>
              ))}

              {yearlyTop.length === 0 && (
                <div className="charts-empty">
                  {selectedYearForTop}년 좋아요 데이터가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* ====== 플레이리스트 선택 모달 ====== */}
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
