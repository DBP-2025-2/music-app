import { useEffect, useMemo, useState } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function ArtistsPage() {
  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter((a) => a.name.toLowerCase().includes(t));
  }, [q, list]);

  const load = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await fetchJson(`${API}/artists`);
      setList(data);
    } catch (e) {
      setError(String(e));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setBusy(true);
      await fetchJson(`${API}/artists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setName("");
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (id) => {
    if (!editName.trim()) return;
    try {
      setBusy(true);
      await fetchJson(`${API}/artists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      setEditId(null);
      setEditName("");
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("정말 삭제할까요? 관련 노래/앨범도 정리됩니다.")) return;
    try {
      setBusy(true);
      await fetchJson(`${API}/artists/${id}`, { method: "DELETE" });
      await load();
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
            👤 아티스트 <span className="badge">{filtered.length}</span>
          </h1>
          <button className="btn ghost" onClick={load} title="새로고침">
            🔄 새로고침
          </button>
        </div>

        <div className="content-panel">
          {/* 검색 */}
          <div className="search-toolbar">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="🔍 아티스트 이름으로 검색..."
              style={{ flex: 1 }}
            />
          </div>

          {/* 추가 폼 */}
          <form onSubmit={add} className="add-form">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="새로운 아티스트 이름을 입력하세요"
              style={{ flex: 1 }}
            />
            <button className="btn primary" disabled={!name.trim() || busy}>
              {busy ? (
                <>
                  <span className="loading-spinner"></span> 추가 중...
                </>
              ) : (
                <>➕ 추가</>
              )}
            </button>
          </form>

          {/* 에러 메시지 */}
          {error && (
            <div className="error-message">
              <span>❗</span>
              <span>{error}</span>
            </div>
          )}

          {/* 로딩 상태 */}
          {loading && (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <div className="empty-state-text">아티스트를 불러오는 중...</div>
            </div>
          )}

          {/* 빈 상태 */}
          {!loading && !error && filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🎸</div>
              <div className="empty-state-text">
                {q ? "검색 결과가 없어요" : "아티스트를 추가해보세요!"}
              </div>
            </div>
          )}

          {/* 아티스트 목록 */}
          {!loading && !error && filtered.length > 0 && (
            <div className="items-grid">
              {filtered.map((a) => (
                <div key={a.id} className="item-card">
                  {editId === a.id ? (
                    <div className="edit-form">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="아티스트 이름"
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
                          setEditName("");
                        }}
                      >
                        ↩️ 취소
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="item-card-header">
                        <h3 className="item-card-title">{a.name}</h3>
                      </div>
                      <div className="item-card-meta">
                        <span>🆔 #{a.id}</span>
                      </div>
                      <div className="item-card-actions">
                        <button
                          className="btn ghost"
                          onClick={() => {
                            setEditId(a.id);
                            setEditName(a.name);
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
