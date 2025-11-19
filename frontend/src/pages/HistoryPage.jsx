import { useEffect, useState } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function HistoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson(`${API}/play-history`);
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
          <span>🕒</span>
          <span>
            Play History{" "}
            <span className="card-badge">{rows.length.toString()}</span>
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
        {rows.map((h) => (
          <li key={h.id} className="list-item">
            <span>
              <strong>user {h.userId}</strong>
              <span className="text-muted"> → song {h.songId}</span>
            </span>
            <span className="text-muted">
              {h.playedAt && h.playedAt.replace("T", " ").substring(0, 19)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
