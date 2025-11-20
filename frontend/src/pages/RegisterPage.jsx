import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetchJson(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname }),
      });

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (e) {
      setError("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="gradient-background"></div>
      <div className="register-container">
        <div className="register-card">
          <div className="register-card-header">
            <h2>🎵 회원가입</h2>
            <p>당신의 음악 여정을 시작하세요</p>
          </div>

          <form onSubmit={handleRegister} className="register-form">
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

            <div className="form-group">
              <label htmlFor="nickname">닉네임 (선택사항)</label>
              <input
                type="text"
                id="nickname"
                placeholder="your nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={loading}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "가입 중..." : "회원가입"}
            </button>
          </form>

          <div className="register-divider">또는</div>

          <Link to="/login" className="btn-secondary">
            기존 계정으로 로그인
          </Link>

          <p className="register-footer">
            이미 계정이 있으신가요? <Link to="/login" className="link-text">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
