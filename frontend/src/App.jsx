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
    <div className="panel">
      <div
        className="row wrap"
        style={{ justifyContent: "space-between", marginBottom: 12 }}
      >
        <h2 style={{ margin: 0 }}>
          👤 Artists <span className="badge">{filtered.length}</span>
        </h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="검색 (이름)"
          style={{ minWidth: 220 }}
        />
      </div>

      <form onSubmit={add} className="row" style={{ gap: 8, marginBottom: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="아티스트 이름"
          style={{ flex: 1 }}
        />
        <button className="btn primary" disabled={!name.trim() || busy}>
          ➕ 추가 {busy && <span className="spinner" />}
        </button>
        <button type="button" className="btn ghost" onClick={load}>
          🔄 새로고침
        </button>
      </form>

      {loading && <div className="empty">⏳ 불러오는 중…</div>}
      {error && (
        <div className="empty" style={{ color: "var(--danger)" }}>
          ❗ {error}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="empty">🙈 결과가 없어요</div>
      )}

      <div className="list">
        {filtered.map((a) => (
          <div
            key={a.id}
            className="item"
            style={{ gridTemplateColumns: "1fr auto auto" }}
          >
            {editId === a.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <button className="btn success" onClick={() => save(a.id)}>
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
              </>
            ) : (
              <>
                <div>
                  #{a.id} — <b>{a.name}</b>
                </div>
                <button
                  className="btn ghost"
                  onClick={() => {
                    setEditId(a.id);
                    setEditName(a.name);
                  }}
                >
                  ✏️ 수정
                </button>
                <button className="btn danger" onClick={() => remove(a.id)}>
                  🗑️ 삭제
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
