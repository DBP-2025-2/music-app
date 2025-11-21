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
  /*  🔹 좋아요 Toggle                                                          */
  /* -------------------------------------------------------------------------- */
  const handleLikeToggle = async (songId) => {
    try {
      const result = await fetchJson("/likes/toggle", {
        method: "POST",
        body: JSON.stringify({ songId }),
      });

      // UI 즉시 반영
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
                ({currentPeriod.week_start_date} ~ {currentPeriod.week_end_date})
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

      {/* 메인 카드 박스 */}
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
              {entries.map((item) => (
                <div
                 key={item.rank}
                 className={
                  "charts-row" + (item.rank <= 10 ? " charts-row--top10" : "")
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
                        item.user_liked
                          ? "like-button--active"
                          : ""
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
          </>
        )}
      </div>
    </div>
  );
}
