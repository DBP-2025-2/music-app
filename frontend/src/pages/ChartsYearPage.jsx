// frontend/src/pages/ChartsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJson } from "../lib/http";
import HeartIcon from "../components/HeartIcon";

const PAGE_SIZE = 20;

export default function ChartsPage() {
  const [periods, setPeriods] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1); // 🔹 페이지 번호

  const navigate = useNavigate();

  /* -------------------------------------------------------------------------- */
  /*  🔹 차트 기간 목록 불러오기                                               */
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
  /*  🔹 선택된 기간의 차트 데이터 가져오기                                   */
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
        setPage(1); // ✅ 다른 연/주차로 바꿀 때는 항상 1페이지로 리셋
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

  const weeksForYear = useMemo(
    () =>
      periods
        .filter((p) => p.year === selectedYear)
        .map((p) => p.week)
        .sort((a, b) => a - b),
    [periods, selectedYear]
  );

  /* -------------------------------------------------------------------------- */
  /*  🔹 페이지네이션                                                          */
  /* -------------------------------------------------------------------------- */
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(entries.length / PAGE_SIZE)),
    [entries.length]
  );

  const pagedEntries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return entries.slice(start, end); // ✅ rank 그대로, 배열만 잘라서 보여주기
  }, [entries, page]);

  const handlePrevPage = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setPage((p) => Math.min(totalPages, p + 1));
  };

  /* -------------------------------------------------------------------------- */
  /*  🔹 좋아요 Toggle                                                         */
  /* -------------------------------------------------------------------------- */
  const handleLikeToggle = async (songId) => {
    try {
      const result = await fetchJson("/likes/toggle", {
        method: "POST",
        body: JSON.stringify({ songId }),
      });

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
    } catch (e) {
      alert(e.message);
    }
  };

  const handleAddToPlaylist = (songId) => {
    console.log("플리 추가 예정:", songId);
  };

  /* -------------------------------------------------------------------------- */
  /*  🔹 렌더링                                                                 */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="charts-page">
      {/* 🔹 연도 타임라인 (클릭하면 연도별 TOP 페이지로 이동) */}
      {years.length > 0 && (
        <div className="charts-year-timeline">
          <div className="timeline-track">
            {years.map((y) => (
              <button
                key={y}
                className={
                  "timeline-dot" +
                  (y === selectedYear ? " timeline-dot--active" : "")
                }
                onClick={() => navigate(`/charts/year/${y}`)}
              >
                <span className="timeline-year-label">{y}년</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 상단 가운데 Music Hub 타이틀 */}
      <div className="chart-hero-title">
        <h1>Music Hub Chart</h1>
      </div>

      {/* 타이틀 + 기간 선택 */}
      <div className="charts-header-row">
        <div>
          <h1 className="charts-title">Charts</h1>

          {currentPeriod && (
            <p className="charts-subtitle">
              weekly · {currentPeriod.year}년 {currentPeriod.week}주차{" "}
              <span className="charts-date-range">
                ({currentPeriod.week_start_date} ~{" "}
                {currentPeriod.week_end_date})
              </span>
            </p>
          )}
        </div>

        {/* 연/주차 선택 */}
        <div className="charts-filters">
          <select
            className="charts-select"
            value={selectedYear ?? ""}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
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
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
          >
            {weeksForYear.map((w) => (
              <option key={w} value={w}>
                {w}주차
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ====== 주간 차트 카드 ====== */}
      <div className="charts-card">
        {error && <div className="charts-error">⚠️ {error}</div>}
        {loading && <div className="charts-loading">차트 불러오는 중...</div>}

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

            {/* 테이블 바디 */}
            <div className="charts-table-body">
              {pagedEntries.map((item) => (
                <div
                  key={item.rank} // 백엔드가 주간마다 1~N으로 유니크하게 주니까 괜찮음
                  className={
                    "charts-row" +
                    (item.rank <= 10 ? " charts-row--top10" : "")
                  }
                >
                  <div className="col-rank">{item.rank}</div>

                  <div className="col-title">
                    <div className="song-title">{item.song_title}</div>
                  </div>

                  <div className="col-artist">{item.artist_name}</div>

                  <div className="col-album">{item.album_title}</div>

                  {/* 좋아요 버튼 */}
                  <div className="col-like">
                    <button
                      onClick={() => handleLikeToggle(item.song_id)}
                      className={`like-button ${
                        item.user_liked ? "like-button--active" : ""
                      }`}
                    >
                      <HeartIcon filled={item.user_liked} size={20} />
                      <span className="like-count">{item.total_likes}</span>
                    </button>
                  </div>

                  {/* 플리추가 버튼 */}
                  <div className="col-playlist">
                    <button
                      className="playlist-button"
                      onClick={() => handleAddToPlaylist(item.song_id)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              {entries.length === 0 && (
                <div className="charts-empty">차트 데이터가 없습니다.</div>
              )}
            </div>

            {/* 페이지네이션 */}
            {entries.length > PAGE_SIZE && (
              <div className="charts-pagination">
                <button
                  className="page-btn"
                  onClick={handlePrevPage}
                  disabled={page === 1}
                >
                  ← 이전 20곡
                </button>
                <span className="page-info">
                  {page} / {totalPages} 페이지
                </span>
                <button
                  className="page-btn"
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
    </div>
  );
}
