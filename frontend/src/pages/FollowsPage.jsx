import { useEffect, useState } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function FollowsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson(`${API}/follows`);
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
          <span>👥</span>
          <span>
            Follows <span className="card-badge">{rows.length.toString()}</span>
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
        {rows.map((f, idx) => (
          <li key={idx} className="list-item">
            <span>
              <strong>{f.followerId}</strong>
              <span className="text-muted">
                {" "}
                → ({f.targetType}) {f.followingId}
              </span>
            </span>
            <span className="text-muted">
              {f.createdAt && f.createdAt.substring(0, 10)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
