import { useEffect, useState } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function FollowsPage() {
  // 상태 관리
  const [rows, setRows] = useState([]);
  const [recommendations, setRecommendations] = useState({ users: [], artists: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 입력 폼 상태
  const [targetType, setTargetType] = useState("user");
  const [targetInput, setTargetInput] = useState("");

  // 1. 초기 데이터 불러오기 (내 목록 + 추천 목록)
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // 두 개의 API를 병렬로 호출
      const [listData, recData] = await Promise.all([
        fetchJson(`${API}/follows/list`),
        fetchJson(`${API}/follows/recommendations`),
      ]);

      setRows(listData.follows || []);
      setRecommendations(recData || { users: [], artists: [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 2. 목록만 새로고침
  async function reloadList() {
    try {
      const data = await fetchJson(`${API}/follows/list`);
      setRows(data.follows || []);
    } catch (err) {
      console.error("목록 갱신 실패:", err);
    }
  }

  // 3. 팔로우 추가 요청
  async function handleFollow() {
    if (!targetInput.trim()) return alert("대상을 입력하세요.");

    try {
      const result = await fetchJson(`${API}/follows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_input: targetInput,
          target_type: targetType,
        }),
      });

      alert(result.message);
      setTargetInput(""); // 입력창 비우기
      reloadList();       // 목록 갱신
    } catch (err) {
      alert(err.message || "오류가 발생했습니다.");
    }
  }

  // 4. 언팔로우 요청
  async function handleUnfollow(followingId, type) {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await fetchJson(`${API}/follows`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          following_id: followingId,
          target_type: type,
        }),
      });
      reloadList(); // 목록 갱신
    } catch (err) {
      alert(err.message || "삭제 실패");
    }
  }

  // 5. 추천 아이템 클릭 시 자동 입력
  const handleRecommendClick = (type, name) => {
    setTargetType(type);
    setTargetInput(name);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>
        🎵 Follow Manager
      </h1>

      <div style={{ display: "flex", gap: "20px", flexDirection: "row", flexWrap: "wrap" }}>
        
        {/* === 왼쪽 패널: 기능 영역 === */}
        <div style={{ flex: 2, minWidth: "300px" }}>
          
          {/* 1. 팔로우 추가 카드 */}
          <section className="card" style={{ padding: "20px", marginBottom: "20px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <div style={{ marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
              <h3 style={{ margin: 0, color: "#444" }}>➕ 팔로우 하기</h3>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ddd", flex: "0 0 100px" }}
              >
                <option value="user">유저</option>
                <option value="artist">아티스트</option>
              </select>
              <input
                type="text"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder={targetType === "user" ? "닉네임 입력" : "아티스트 이름 입력"}
                style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ddd", flex: 1 }}
              />
              <button
                onClick={handleFollow}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                추가
              </button>
            </div>
          </section>

          {/* 2. 팔로우 목록 카드 */}
          <section className="card" style={{ padding: "20px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.2rem" }}>👥</span>
                <h3 style={{ margin: 0, color: "#444" }}>
                  내 팔로우 목록 <span style={{ background: "#eee", padding: "2px 8px", borderRadius: "10px", fontSize: "0.8rem" }}>{rows.length}</span>
                </h3>
              </div>
              <button 
                onClick={reloadList} 
                title="새로고침"
                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ↻
              </button>
            </div>

            {loading && <p style={{ textAlign: "center", color: "#888" }}>불러오는 중...</p>}
            {error && <p style={{ color: "red", textAlign: "center" }}>⚠️ Error: {error}</p>}

            {!loading && !error && rows.length === 0 && (
              <p style={{ textAlign: "center", color: "#aaa", padding: "20px" }}>
                팔로우한 내역이 없습니다.
              </p>
            )}

            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {rows.map((item, idx) => {
                const badgeColor = item.target_type === "user" ? "#20c997" : "#7950f2";
                const displayName = item.target_name || `ID: ${item.following_id}`;

                return (
                  <li 
                    key={`${item.target_type}-${item.following_id}-${idx}`} 
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      padding: "12px 5px", 
                      borderBottom: "1px solid #f1f1f1" 
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span
                        style={{
                          backgroundColor: badgeColor,
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "20px",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                          marginRight: "10px",
                          textTransform: "uppercase",
                          minWidth: "50px",
                          textAlign: "center"
                        }}
                      >
                        {item.target_type}
                      </span>
                      <div>
                        <strong style={{ color: "#333", fontSize: "1rem" }}>{displayName}</strong>
                        <span style={{ fontSize: "0.8rem", color: "#aaa", marginLeft: "8px" }}>
                          ({item.created_at?.substring(0, 10)})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUnfollow(item.following_id, item.target_type)}
                      style={{
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "5px 10px",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      삭제
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* === 오른쪽 패널: 추천 목록 (DB 데이터) === */}
        <div style={{ flex: 1, minWidth: "250px" }}>
          <div style={{ backgroundColor: "#fff3cd", padding: "20px", borderRadius: "12px", border: "1px solid #ffeeba" }}>
            <h4 style={{ marginTop: 0, color: "#856404", borderBottom: "1px solid #ffeeba", paddingBottom: "10px" }}>
              💾 추천 (DB 데이터)
            </h4>
            
            <p style={{ margin: "15px 0 5px", fontWeight: "bold", color: "#666", fontSize: "0.9rem" }}>👤 유저</p>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {recommendations.users.length === 0 && <li style={{color: "#999", fontSize: "0.8rem"}}>추천 유저 없음</li>}
              {recommendations.users.map(u => (
                <li 
                  key={u.userId} 
                  onClick={() => handleRecommendClick("user", u.nickname)}
                  style={{ 
                    padding: "8px", 
                    background: "white", 
                    marginBottom: "5px", 
                    borderRadius: "4px", 
                    cursor: "pointer",
                    border: "1px solid #e0e0e0",
                    display: "flex",
                    justifyContent: "space-between"
                  }}
                >
                  <span>{u.nickname}</span>
                  <span style={{color: "#aaa"}}>👉</span>
                </li>
              ))}
            </ul>

            <p style={{ margin: "20px 0 5px", fontWeight: "bold", color: "#666", fontSize: "0.9rem" }}>🎤 아티스트</p>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {recommendations.artists.length === 0 && <li style={{color: "#999", fontSize: "0.8rem"}}>추천 아티스트 없음</li>}
              {recommendations.artists.map(a => (
                <li 
                  key={a.artistId} 
                  onClick={() => handleRecommendClick("artist", a.name)}
                  style={{ 
                    padding: "8px", 
                    background: "white", 
                    marginBottom: "5px", 
                    borderRadius: "4px", 
                    cursor: "pointer",
                    border: "1px solid #e0e0e0",
                    display: "flex",
                    justifyContent: "space-between"
                  }}
                >
                  <span>{a.name}</span>
                  <span style={{color: "#aaa"}}>👉</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}