import { useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetchJson(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("authToken", response.token);

      setTimeout(() => {
        onLoginSuccess();
      }, 500);
    } catch (e) {
      setError("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="gradient-background"></div>
      <div className="login-container">
        <div className="login-card">
          <div className="login-card-header">
            <h2>🎵 로그인</h2>
            <p>당신의 음악 세상으로 돌아오세요</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <div className="login-divider">또는</div>

          <Link to="/register" className="btn-secondary">
            새 계정 만들기
          </Link>

          <p className="login-footer">
            처음이신가요? <Link to="/register" className="link-text">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
