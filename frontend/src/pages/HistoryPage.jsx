import { useEffect, useState } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function PlayHistoryPage() {
  // 상태 관리
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 초기 데이터 로드 (히스토리)
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const historyData = await fetchJson(`${API}/play-history/list`);
      setHistory(historyData.history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 새로고침 핸들러
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const data = await fetchJson(`${API}/play-history/list`);
      setHistory(data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#333", margin: 0 }}>🎧 Play History</h1>
        <p style={{ color: "#888", fontSize: "0.9rem" }}>
          내가 들었던 음악들의 기록
        </p>
      </div>

      {/* === 섹션: Play History (목록) === */}
      <section className="card" style={styles.card}>
        <div style={{ ...styles.cardHeader, justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>🕒 재생 기록</h3>
          <button onClick={handleRefresh} style={styles.refreshButton}>
            🔄
          </button>
        </div>

        {loading && (
          <p style={{ textAlign: "center", color: "#888" }}>로딩 중...</p>
        )}
        {error && (
          <p style={{ color: "red", textAlign: "center" }}>Error: {error}</p>
        )}

        <ul style={{ listStyle: "none", padding: 0 }}>
          {!loading && history.length === 0 && (
            <li style={{ padding: "20px", textAlign: "center", color: "#aaa" }}>
              재생 기록이 없습니다.
            </li>
          )}

          {history.map((h, idx) => (
            <li key={idx} style={styles.listItem}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <strong style={{ fontSize: "1rem", color: "#333" }}>
                  {h.title}
                </strong>
                <span style={{ fontSize: "0.85rem", color: "#666" }}>
                  {h.artist_name}
                </span>
              </div>
              <span style={{ fontSize: "0.8rem", color: "#aaa" }}>
                {new Date(h.played_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// 스타일 객체 (인라인 스타일)
const styles = {
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    padding: "20px",
    border: "1px solid #f0f0f0",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "15px",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
  },
  refreshButton: {
    background: "none",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    padding: "5px 10px",
    fontSize: "1.2rem",
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 5px",
    borderBottom: "1px solid #f7f7f7",
  },
};
