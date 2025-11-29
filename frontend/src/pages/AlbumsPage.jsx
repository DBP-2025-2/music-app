import { useEffect, useMemo, useState } from "react";
// 🔹 [추가] useSearchParams 가져오기 (URL 관리용)
import { useNavigate, useSearchParams } from "react-router-dom";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function AlbumsPage() {
  const navigate = useNavigate();
  // 🔹 [추가] URL 쿼리 파라미터 훅 사용
  const [searchParams, setSearchParams] = useSearchParams();

  // 🔹 [변경] q와 sort를 useState가 아닌 URL에서 가져오도록 수정
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "year-desc";

  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);

  // 추가/수정용 State (이건 페이지 이동과 상관없으니 useState 유지)
  const [title, setTitle] = useState("");
  const [artistId, setArtistId] = useState("");
  const [year, setYear] = useState("");

  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtistId, setEditArtistId] = useState("");
  const [editYear, setEditYear] = useState("");

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const artistNameById = useMemo(() => {
    const m = new Map();
    artists.forEach((a) => m.set(a.id, a.name));
    return m;
  }, [artists]);

  const loadAll = async () => {
    try {
      setError("");
      setLoading(true);
      const [a, s] = await Promise.all([
        fetchJson(`${API}/artists`),
        fetchJson(`${API}/albums`),
      ]);
      setArtists(a);
      setAlbums(s);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // 🔹 [변경] URL 값을 변경하는 핸들러 함수들
  const handleSearchChange = (e) => {
    // 검색어가 바뀌면 URL의 q 파라미터 업데이트 (sort는 유지)
    setSearchParams({ q: e.target.value, sort }, { replace: true });
  };

  const handleSortChange = (e) => {
    // 정렬이 바뀌면 URL의 sort 파라미터 업데이트 (q는 유지)
    setSearchParams({ q, sort: e.target.value });
  };

  const sorted = useMemo(() => {
    let data = albums;
    const t = q.trim().toLowerCase();
    if (t) {
      data = data.filter((a) => {
        const artistName = (artistNameById.get(a.artistId) || "").toLowerCase();
        return artistName.includes(t);
      });
    }
    const [k, dir] = sort.split("-");
    return [...data].sort((A, B) => {
      const a = A[k] ?? "";
      const b = B[k] ?? "";
      if (a < b) return dir === "asc" ? -1 : 1;
      if (a > b) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [albums, sort, q, artistNameById]);

  // (add, save, remove 함수들은 기존과 동일)
  const add = async (e) => {
    e.preventDefault();
    if (!title.trim() || !artistId) return;
    setBusy(true);
    try {
      await fetchJson(`${API}/albums`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artistId: Number(artistId),
          year: year ? Number(year) : null,
        }),
      });
      setTitle("");
      setArtistId("");
      setYear("");
      await loadAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (id) => {
    if (!editTitle.trim() || !editArtistId) return;
    setBusy(true);
    try {
      await fetchJson(`${API}/albums/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          artistId: Number(editArtistId),
          year: editYear === "" ? null : Number(editYear),
        }),
      });
      setEditId(null);
      setEditTitle("");
      setEditArtistId("");
      setEditYear("");
      await loadAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("삭제할까요?")) return;
    setBusy(true);
    try {
      await fetchJson(`${API}/albums/${id}`, { method: "DELETE" });
      await loadAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="content-page">
      <div className="content-container">
        <div className="page-header">
          <h1 className="page-title">
            💿 앨범 <span className="badge">{sorted.length}</span>
          </h1>
          <button className="btn new" onClick={loadAll} title="새로고침">
            새로고침
          </button>
        </div>

        <div className="content-panel">
          {/* 검색 & 정렬 */}
          <div className="search-toolbar">
            <input
              value={q}
              onChange={handleSearchChange} // 🔹 [연결] URL 변경 핸들러
              placeholder="🔍 가수 이름으로 검색..."
              style={{ flex: 1 }}
            />
            <select value={sort} onChange={handleSortChange}> {/* 🔹 [연결] */}
              <option value="year-desc">📅 연도 (최신순)</option>
              <option value="year-asc">📅 연도 (오래된순)</option>
              <option value="title-asc">📝 제목 (오름차순)</option>
              <option value="title-desc">📝 제목 (내림차순)</option>
            </select>
          </div>

          {/* 추가 폼 (기존 동일) */}
          <form onSubmit={add} className="add-form">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="앨범 제목을 입력하세요"
              style={{ flex: 1.5 }}
            />
            <select
              value={artistId}
              onChange={(e) => setArtistId(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">아티스트 선택</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="연도 (선택사항)"
              inputMode="numeric"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              style={{ flex: 0.8 }}
            />
            <button
              className="btn primary"
              disabled={!title.trim() || !artistId || busy}
            >
              {busy ? (
                <>
                  <span className="loading-spinner"></span> 추가 중...
                </>
              ) : (
                <>➕ 추가</>
              )}
            </button>
          </form>

          {/* 에러/로딩 메시지 */}
          {error && (
            <div className="error-message">
              <span>❗</span>
              <span>{error}</span>
            </div>
          )}
          {loading && (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <div className="empty-state-text">앨범을 불러오는 중...</div>
            </div>
          )}
          {!loading && !error && sorted.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">💿</div>
              <div className="empty-state-text">앨범을 추가해보세요!</div>
            </div>
          )}

          {/* 앨범 목록 */}
          {!loading && !error && sorted.length > 0 && (
            <div className="items-grid">
              {sorted.map((a) => (
                <div key={a.id} className="item-card">
                  {editId === a.id ? (
                    <div className="edit-form">
                      {/* 수정 폼 (기존 동일) */}
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="앨범 제목"
                      />
                      <select
                        value={editArtistId}
                        onChange={(e) => setEditArtistId(e.target.value)}
                      >
                        <option value="">아티스트 선택</option>
                        {artists.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value)}
                        placeholder="연도"
                        inputMode="numeric"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                      <button
                        className="btn success"
                        onClick={() => save(a.id)}
                        disabled={busy}
                      >
                        💾 저장
                      </button>
                      <button
                        className="btn muted"
                        onClick={() => {
                          setEditId(null);
                          setEditTitle("");
                          setEditArtistId("");
                          setEditYear("");
                        }}
                      >
                        ↩️ 취소
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="item-card-header">
                        <h3 className="item-card-title">{a.title}</h3>
                      </div>

                      <div className="item-card-meta">
                        <span>🆔 #{a.id}</span>
                        <span>
                          👤 {artistNameById.get(a.artistId) || "Unknown"}
                        </span>
                        <span>📅 {a.year || "—"}</span>
                      </div>

                      <div className="item-card-actions">
                        {/* 🔹 수록곡 버튼 (누르면 이동) */}
                        <button
                          className="btn"
                          style={{
                            backgroundColor: "#e0e7ff",
                            color: "#4338ca",
                            fontWeight: "bold",
                            border: "none"
                          }}
                          onClick={() => navigate(`/album/${a.id}`)}
                        >
                          🎵 수록곡
                        </button>

                        <button
                          className="btn ghost"
                          onClick={() => {
                            setEditId(a.id);
                            setEditTitle(a.title);
                            setEditArtistId(String(a.artistId));
                            setEditYear(a.year ?? "");
                          }}
                        >
                          ✏️ 수정
                        </button>
                        <button
                          className="btn danger"
                          onClick={() => remove(a.id)}
                          disabled={busy}
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}