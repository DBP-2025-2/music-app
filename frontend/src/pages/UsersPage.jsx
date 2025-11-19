import { useEffect, useState } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson(`${API}/users`);
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title">
          <span>🙋‍♀️</span>
          <span>
            Users <span className="card-badge">{rows.length.toString()}</span>
          </span>
        </div>
      </div>

      {loading && <p className="text-muted">불러오는 중...</p>}
      {error && (
        <p className="text-error">
          ⚠️ Error: <span>{error}</span>
        </p>
      )}

      <ul className="list">
        {rows.map((u) => (
          <li key={u.id} className="list-item">
            <span>
              <span className="text-muted">#{u.id} </span>
              <strong>{u.nickname || u.email}</strong>
              {u.nickname && <span className="text-muted"> ({u.email})</span>}
            </span>
            <span className="text-muted">
              가입: {u.createdAt && u.createdAt.substring(0, 10)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
