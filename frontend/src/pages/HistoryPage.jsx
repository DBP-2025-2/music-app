import { useEffect, useState, useMemo } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function PlayHistoryPage() {
  // 상태 관리
  const [history, setHistory] = useState([]);
  const [allSongs, setAllSongs] = useState([]); // 검색용 전체 노래 데이터
  const [searchTerm, setSearchTerm] = useState(""); // 검색어
  const [selectedSong, setSelectedSong] = useState(null); // 선택된 노래 객체
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. 초기 데이터 로드 (노래 목록 & 히스토리)
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [historyData, songsData] = await Promise.all([
        fetchJson(`${API}/play-history/list`),
        fetchJson(`${API}/play-history/songs`), // 검색용 노래 목록
      ]);

      setHistory(historyData.history || []);
      setAllSongs(songsData.songs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 검색 로직 (클라이언트 사이드 필터링)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lowerQuery = searchTerm.toLowerCase();
    
    return allSongs.filter(
      (s) =>
        s.title.toLowerCase().includes(lowerQuery) ||
        s.artist.toLowerCase().includes(lowerQuery)
    );
  }, [searchTerm, allSongs]);

  // 3. 노래 선택 핸들러
  const handleSelectSong = (song) => {
    setSelectedSong(song);
    setSearchTerm(`${song.title} - ${song.artist}`); // 인풋창에 표시
  };

  // 4. 재생(기록 저장) 핸들러
  const handlePlay = async () => {
    if (!selectedSong) {
      alert("검색해서 노래를 선택해주세요!");
      return;
    }

    try {
      await fetchJson(`${API}/play-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: selectedSong.song_id }),
      });

      // 성공 시 초기화 및 목록 갱신
      alert(`🎵 '${selectedSong.title}' 재생 시작!`);
      setSearchTerm("");
      setSelectedSong(null);
      
      // 목록만 새로고침
      const historyData = await fetchJson(`${API}/play-history/list`);
      setHistory(historyData.history || []);

    } catch (err) {
      alert(err.message || "재생 실패");
    }
  };

  // 5. 새로고침 핸들러
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
        <p style={{ color: "#888", fontSize: "0.9rem" }}>내가 들었던 음악들의 기록</p>
      </div>

      {/* === 섹션 1: Now Playing (검색 및 재생) === */}
      <section className="card" style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={{ margin: 0 }}>🎵 Now Playing</h3>
        </div>
        
        <div style={{ display: "flex", gap: "10px", position: "relative" }}>
          {/* 검색 입력창 */}
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              placeholder="노래 제목이나 가수를 검색하세요..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedSong(null); // 검색어 바꾸면 선택 해제
              }}
              style={styles.input}
            />

            {/* 검색 결과 드롭다운 */}
            {searchTerm && !selectedSong && searchResults.length > 0 && (
              <ul style={styles.dropdown}>
                {searchResults.map((song) => (
                  <li
                    key={song.song_id}
                    onClick={() => handleSelectSong(song)}
                    style={styles.dropdownItem}
                  >
                    <strong>{song.title}</strong>
                    <span style={{ fontSize: "0.8rem", color: "#888", marginLeft: "6px" }}>
                      {song.artist}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button onClick={handlePlay} style={styles.playButton}>
            ▶ 재생
          </button>
        </div>
      </section>

      {/* === 섹션 2: Recent History (목록) === */}
      <section className="card" style={{ ...styles.card, marginTop: "20px" }}>
        <div style={{ ...styles.cardHeader, justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>🕒 최근 기록</h3>
          <button onClick={handleRefresh} style={styles.refreshButton}>
            ↻
          </button>
        </div>

        {loading && <p style={{ textAlign: "center", color: "#888" }}>로딩 중...</p>}
        {error && <p style={{ color: "red", textAlign: "center" }}>Error: {error}</p>}

        <ul style={{ listStyle: "none", padding: 0 }}>
          {!loading && history.length === 0 && (
            <li style={{ padding: "20px", textAlign: "center", color: "#aaa" }}>
              아직 재생 기록이 없습니다.
            </li>
          )}

          {history.map((h, idx) => (
            <li key={idx} style={styles.listItem}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <strong style={{ fontSize: "1rem", color: "#333" }}>{h.title}</strong>
                <span style={{ fontSize: "0.85rem", color: "#666" }}>{h.artist_name}</span>
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
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  playButton: {
    backgroundColor: "#ff4757",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "0 25px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  refreshButton: {
    background: "none",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    padding: "5px 10px",
    fontSize: "1.2rem",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "0 0 8px 8px",
    maxHeight: "200px",
    overflowY: "auto",
    zIndex: 10,
    listStyle: "none",
    padding: 0,
    margin: 0,
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  dropdownItem: {
    padding: "10px 15px",
    borderBottom: "1px solid #f5f5f5",
    cursor: "pointer",
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 5px",
    borderBottom: "1px solid #f7f7f7",
  },
};