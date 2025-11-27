import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchJson } from "../lib/http";
import { API } from "../lib/api";

export default function UserPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expandedId, setExpandedId] = useState(null);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    loadUserPlaylists();
  }, [userId]);

  async function loadUserPlaylists() {
    try {
      setLoading(true);
      const data = await fetchJson(`${API}/playlists/user/${userId}`);
      setPlaylists(data);
    } catch (e) {
      alert("정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleFollowPlaylist(e, playlistId) {
    e.stopPropagation();
    try {
      const res = await fetchJson(`${API}/playlists/${playlistId}/follow`, {
        method: "POST"
      });
      alert(res.followed ? "팔로우했습니다! 🎉" : "팔로우 취소했습니다.");
      loadUserPlaylists();
    } catch (err) {
      alert("오류 발생: " + err.message);
    }
  }

  async function handlePlaylistClick(playlistId) {
    if (expandedId === playlistId) {
      setExpandedId(null);
      setItems([]);
      return;
    }
    try {
      setExpandedId(playlistId);
      setItemsLoading(true);
      const data = await fetchJson(`${API}/playlists/${playlistId}/items`);
      setItems(data);
    } catch (e) {
      console.error(e);
      alert("곡 정보를 불러오는데 실패했습니다.");
    } finally {
      setItemsLoading(false);
    }
  }

  // 🔹 [추가] 재생 핸들러
  async function handlePlay(e, songId, title) {
    e.stopPropagation(); // 부모 클릭(접기) 방지
    try {
      await fetchJson(`${API}/play-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: songId }),
      });
      alert(`🎵 '${title}' 재생을 시작합니다! (히스토리 저장됨)`);
    } catch (err) {
      alert("재생 실패: " + err.message);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ borderBottom: "1px solid #eee", paddingBottom: 10 }}>
        👤 유저 플레이리스트
      </h2>
      
      {loading && <p>로딩 중...</p>}
      
      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        {playlists.map(pl => (
          <div 
            key={pl.id} 
            className="card" 
            style={{ 
              padding: 20, 
              cursor: "pointer", 
              backgroundColor: "white",
              border: expandedId === pl.id ? "2px solid #6366f1" : "1px solid #e5e7eb",
              borderRadius: 12,
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              transition: "all 0.2s"
            }}
            onClick={() => handlePlaylistClick(pl.id)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ margin: "0 0 5px 0", fontSize: "1.1rem" }}>{pl.name}</h3>
                {pl.note && <p style={{ color: "#666", margin: "0 0 10px 0", fontSize: "0.9rem" }}>{pl.note}</p>}
                <small style={{ color: "#999" }}>
                  곡 {pl.trackCount}개 · 팔로워 {pl.followerCount}명
                </small>
              </div>
              
              <button 
                className="btn"
                style={{ 
                  backgroundColor: pl.isFollowed ? "#ffebeb" : "#f3f4f6", 
                  color: pl.isFollowed ? "#dc3545" : "#374151", 
                  border: pl.isFollowed ? "1px solid #dc3545" : "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "0.85rem"
                }}
                onClick={(e) => toggleFollowPlaylist(e, pl.id)}
              >
                {pl.isFollowed ? "💔 언팔로우" : "❤️ 팔로우"}
              </button>
            </div>

            {expandedId === pl.id && (
              <div style={{ marginTop: 20, borderTop: "1px solid #f3f4f6", paddingTop: 15 }}>
                {itemsLoading ? (
                  <p style={{ color: "#888", textAlign: "center" }}>곡 불러오는 중...</p>
                ) : (
                  <>
                    {items.length === 0 ? (
                      <p style={{ color: "#aaa", textAlign: "center", fontSize: "0.9rem" }}>
                        플레이리스트에 담긴 곡이 없습니다.
                      </p>
                    ) : (
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {items.map((item, idx) => (
                          <li 
                            key={item.id} 
                            style={{ 
                              display: "flex", 
                              padding: "8px 0", 
                              borderBottom: idx < items.length - 1 ? "1px solid #f9fafb" : "none",
                              alignItems: "center",
                              justifyContent: "space-between" // 양쪽 정렬
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <span style={{ width: 30, color: "#bbb", fontSize: "0.9rem" }}>{idx + 1}</span>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <strong style={{ fontSize: "0.95rem", color: "#333" }}>
                                  {item.songTitle || "제목 없음"}
                                </strong>
                                <span style={{ fontSize: "0.85rem", color: "#888" }}>
                                  {item.artistName || "알 수 없는 아티스트"}
                                </span>
                              </div>
                            </div>

                            {/* 🔹 [추가] 재생 버튼 */}
                            <button
                              style={{
                                backgroundColor: "#ff4757",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: "32px",
                                height: "32px",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                              onClick={(e) => handlePlay(e, item.songId, item.songTitle)}
                              title="재생"
                            >
                              ▶
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {!loading && playlists.length === 0 && (
          <p style={{ textAlign: "center", color: "#aaa", padding: 30 }}>
            공개된 플레이리스트가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}