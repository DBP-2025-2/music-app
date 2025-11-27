import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchJson } from "../lib/http";
import { API } from "../lib/api";

export default function ArtistPage() {
  const { artistId } = useParams();
  const [songs, setSongs] = useState([]);
  const [artistName, setArtistName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSongs();
  }, [artistId]);

  async function loadSongs() {
    try {
      setLoading(true);
      const data = await fetchJson(`${API}/songs?artistId=${artistId}`);
      setSongs(data);
      
      // 아티스트 이름 설정 (첫 번째 곡 정보 활용)
      if (data.length > 0) {
        // 만약 백엔드가 artistName을 따로 안 주면 여기서 가져옴 (API에 따라 다름)
        setArtistName(data[0].artistName || "Unknown");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // 🔹 [추가] 재생 핸들러
  async function handlePlay(songId, title) {
    try {
      await fetchJson(`${API}/play-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: songId }),
      });
      alert(`🎵 '${title}' 재생을 시작합니다!`);
    } catch (err) {
      alert("재생 실패: " + err.message);
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <h2 style={{ margin: 0 }}>🎤 아티스트 상세</h2>
        <p style={{ color: "#666" }}>ID: {artistId}</p>
      </div>

      <div className="card" style={{ backgroundColor: "white", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <h3 style={{ borderBottom: "1px solid #eee", paddingBottom: 10, marginTop: 0 }}>
          🎵 노래 목록 <span style={{ fontSize: "0.9rem", color: "#888", fontWeight: "normal" }}>({songs.length}곡)</span>
        </h3>

        {loading && <p style={{ textAlign: "center", color: "#888" }}>로딩 중...</p>}

        <ul style={{ listStyle: "none", padding: 0 }}>
          {songs.map((song, index) => (
            <li 
              key={song.id} 
              style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "12px 5px",
                borderBottom: "1px solid #f5f5f5"
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ width: 30, color: "#bbb", fontWeight: "bold" }}>{index + 1}</span>
                <div>
                  <strong style={{ fontSize: "1rem", color: "#333" }}>{song.title}</strong>
                </div>
              </div>

              {/* 🔹 [추가] 재생 버튼 */}
              <button
                style={{
                  backgroundColor: "#ff4757",
                  color: "white",
                  border: "none",
                  borderRadius: "20px",
                  padding: "6px 15px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: "bold"
                }}
                onClick={() => handlePlay(song.id, song.title)}
              >
                ▶ 재생
              </button>
            </li>
          ))}
          {!loading && songs.length === 0 && (
            <p style={{ textAlign: "center", color: "#aaa", padding: 20 }}>
              등록된 노래가 없습니다.
            </p>
          )}
        </ul>
      </div>
    </div>
  );
}