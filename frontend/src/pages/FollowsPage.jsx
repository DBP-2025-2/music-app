import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // 이동 기능 훅
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function FollowsPage() {
  const navigate = useNavigate(); // 페이지 이동 함수

  const [rows, setRows] = useState([]);
  const [recommendations, setRecommendations] = useState({ users: [], artists: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [targetType, setTargetType] = useState("user");
  const [targetInput, setTargetInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // 데이터 불러오기
  async function loadData() {
    try {
      setLoading(true);
      setError(null);

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

  useEffect(() => {
    loadData();
  }, []);

  // 목록만 새로고침
  async function reloadList() {
    try {
      const data = await fetchJson(`${API}/follows/list`);
      setRows(data.follows || []);
    } catch (err) {
      console.error(err);
    }
  }

  // 팔로우 추가
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
      setTargetInput("");
      reloadList();
    } catch (err) {
      alert(err.message || "오류 발생");
    }
  }

  // 언팔로우
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
      reloadList();
    } catch (err) {
      alert(err.message || "삭제 실패");
    }
  }

  async function handleInputChange(e) {
    const value = e.target.value;
    setTargetInput(value);

    if (value.trim().length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const results = await fetchJson(`${API}/follows/search?q=${encodeURIComponent(value)}`);
      setSearchResults(results);
      setShowDropdown(true);
    } catch (err) {
      console.error(err);
    }
  }

  const selectSearchResult = (item) => {
    setTargetInput(item.name);
    setTargetType(item.type);
    setShowDropdown(false);
  };

  // 추천 클릭
  const handleRecommendClick = (type, name) => {
    setTargetType(type);
    setTargetInput(name);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>
        🎵 Follow Manager
      </h1>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>

        {/* 왼쪽: 기능 */}
        <div style={{ flex: 2, minWidth: "300px" }}>

          {/* 추가 폼 */}
          <section className="card" style={styles.card}>
            <div style={styles.header}>
              <h3 style={{ margin: 0 }}>➕ 팔로우 하기</h3>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                style={{ ...styles.input, flex: "0 0 100px" }}
              >
                <option value="user">유저</option>
                <option value="artist">아티스트</option>
              </select>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="text"
                  value={targetInput}
                  onChange={handleInputChange} // 🔹 [수정됨]
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // 🔹 [추가됨]
                  placeholder="이름을 입력하세요"
                  style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                />

                {/* 🔹 [완전 새로 추가됨] */}
                {showDropdown && searchResults.length > 0 && (
                  <ul style={styles.dropdown}>
                    {searchResults.map((item, idx) => (
                      <li
                        key={idx}
                        style={styles.dropdownItem}
                        onMouseDown={() => selectSearchResult(item)}
                      >
                        <span style={{ fontWeight: "bold" }}>{item.name}</span>
                        <span style={{ fontSize: "0.8rem", color: "#888", marginLeft: "5px" }}>
                          ({item.type})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button onClick={handleFollow} style={styles.btnPrimary}>추가</button>
            </div>
          </section>

          {/* 목록 */}
          <section className="card" style={styles.card}>
            <div style={{ ...styles.header, justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>
                내 목록 <span style={styles.countBadge}>{rows.length}</span>
              </h3>
              <button onClick={reloadList} style={styles.btnRefresh}>↻</button>
            </div>

            {loading && <p style={{ textAlign: "center", color: "#888" }}>로딩 중...</p>}
            {!loading && rows.length === 0 && (
              <p style={{ textAlign: "center", color: "#aaa", padding: "20px" }}>내역 없음</p>
            )}

            <ul style={{ listStyle: "none", padding: 0 }}>
              {rows.map((item, idx) => {
                const type = item.targetType || item.target_type || "user";
                const id = item.followingId || item.following_id || item.id;
                const name = item.targetName || item.target_name || item.name || item.nickname;
                const createdDate = item.createdAt || item.created_at || "";

                // 🔹 백엔드에서 받아온 playlist 작성자 ID
                const ownerId = item.owner_id;

                // 뱃지 색상 설정 (플레이리스트는 파란색 계열로 추가)
                let badgeColor = "#7950f2";
                if (type === "user") badgeColor = "#20c997";
                if (type === "playlist") badgeColor = "#4c6ef5";

                const displayName = name ? name : `ID: ${id}`;

                return (
                  <li
                    key={idx}
                    style={{ ...styles.listItem, cursor: "pointer" }}
                    onClick={() => {
                      // 🔹 클릭 시 이동 로직 강화
                      if (type === 'user') navigate(`/user/${id}`);
                      else if (type === 'artist') navigate(`/artist/${id}`);
                      else if (type === 'playlist' && ownerId) {
                        // 플레이리스트를 누르면 작성자의 유저 페이지로 이동
                        navigate(`/user/${ownerId}`);
                      }
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ ...styles.badge, backgroundColor: badgeColor }}>
                        {type}
                      </span>
                      <div>
                        <strong style={{ color: "#333" }}>{displayName}</strong>
                        <span style={{ fontSize: "0.8rem", color: "#aaa", marginLeft: "8px" }}>
                          ({createdDate.substring(0, 10)})
                        </span>
                        {/* 플레이리스트인 경우 추가 설명 */}
                        {type === 'playlist' && (
                          <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "5px" }}>
                            (작성자 페이지로 이동)
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnfollow(id, type);
                      }}
                      style={styles.btnDanger}
                    >
                      삭제
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* 오른쪽: 추천 */}
        <div style={{ flex: 1, minWidth: "250px" }}>
          <div style={{ ...styles.card, backgroundColor: "#fff3cd", border: "1px solid #ffeeba" }}>
            <h4 style={{ marginTop: 0, color: "#856404", borderBottom: "1px solid #ffeeba", paddingBottom: "10px" }}>
              💾 추천 목록
            </h4>

            <p style={styles.recLabel}>👤 유저</p>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {recommendations.users.map(u => (
                <li key={u.userId} onClick={() => handleRecommendClick("user", u.nickname)} style={styles.recItem}>
                  <span>{u.nickname}</span><span style={{ color: "#aaa" }}>👉</span>
                </li>
              ))}
            </ul>

            <p style={styles.recLabel}>🎤 아티스트</p>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {recommendations.artists.map(a => (
                <li key={a.artistId} onClick={() => handleRecommendClick("artist", a.name)} style={styles.recItem}>
                  <span>{a.name}</span><span style={{ color: "#aaa" }}>👉</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  card: { padding: "20px", marginBottom: "20px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  header: { marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px", display: "flex", alignItems: "center" },
  input: { padding: "10px", borderRadius: "5px", border: "1px solid #ddd" },
  btnPrimary: { padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" },
  btnDanger: { backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", padding: "5px 10px", fontSize: "0.8rem", cursor: "pointer" },
  btnRefresh: { background: "transparent", border: "none", cursor: "pointer", fontSize: "1.2rem" },
  countBadge: { background: "#eee", padding: "2px 8px", borderRadius: "10px", fontSize: "0.8rem" },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 5px", borderBottom: "1px solid #f1f1f1" },
  badge: { color: "white", padding: "4px 8px", borderRadius: "20px", fontSize: "0.7rem", fontWeight: "bold", marginRight: "10px", textTransform: "uppercase", minWidth: "50px", textAlign: "center" },
  recLabel: { margin: "15px 0 5px", fontWeight: "bold", color: "#666", fontSize: "0.9rem" },

  // 👇 여기 끝에 콤마(,)를 꼭 찍어야 합니다!
  recItem: { padding: "8px", background: "white", marginBottom: "5px", borderRadius: "4px", cursor: "pointer", border: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between" },

  // 🔹 [추가] 드롭다운 스타일
  dropdown: {
    position: "absolute",
    top: "100%", left: 0, right: 0,
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "0 0 5px 5px",
    maxHeight: "200px",
    overflowY: "auto",
    listStyle: "none",
    padding: 0, margin: 0,
    zIndex: 10,
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
  },
  dropdownItem: {
    padding: "10px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
    display: "flex", justifyContent: "space-between", alignItems: "center"
  }
};
