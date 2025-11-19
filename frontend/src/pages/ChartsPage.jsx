import { useEffect, useState } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function ChartsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson(`${API}/charts`);
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
          <span>📊</span>
          <span>
            Charts <span className="card-badge">{rows.length.toString()}</span>
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
        {rows.map((c) => (
          <li key={c.id} className="list-item">
            <span>
              <span className="text-muted">
                {c.chartType} / {c.year}년 {c.week}주{" "}
              </span>
              <strong>#{c.rank}</strong>
              <span className="text-muted"> (songId: {c.songId})</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
