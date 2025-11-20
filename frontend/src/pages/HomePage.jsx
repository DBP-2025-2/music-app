import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function HomePage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const lowerEmail = email.toLowerCase().trim();
      console.log("📤 HomePage: Logging in with:", {
        email: lowerEmail,
        password,
      });

      const response = await fetchJson(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lowerEmail, password }),
      });

      console.log("✅ HomePage: Login response:", response);
      localStorage.setItem("authToken", response.token);
      setTimeout(() => {
        onLoginSuccess();
      }, 500);
    } catch (e) {
      console.error("❌ HomePage: Login error:", e.message);
      setError("❌ " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      {/* 백그라운드 그라디언트 */}
      <div className="gradient-background"></div>

      {/* 메인 콘텐츠 */}
      <div className="home-container">
        {/* 왼쪽: 소개 */}
        <div className="home-left">
          <div className="home-hero">
            <h1 className="hero-title">
              <span className="emoji">🎵</span>
              Music Hub
            </h1>
            <p className="hero-subtitle">
              당신의 음악 라이브러리를 한곳에서 관리하세요
            </p>
            <p className="hero-description">
              아티스트, 앨범, 플레이리스트를 쉽게 탐색하고 <br />
              당신의 음악 취향을 발견해보세요
            </p>

            {/* 피처 리스트 */}
            <div className="features">
              <div className="feature-item">
                <span className="feature-icon">🎤</span>
                <span>수천의 아티스트</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💿</span>
                <span>다양한 앨범</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📻</span>
                <span>실시간 차트</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">❤️</span>
                <span>즐겨찾기 기능</span>
              </div>
            </div>

            {/* CTA 버튼 */}
            <Link to="/register" className="btn-primary-large">
              지금 시작하기
            </Link>
          </div>
        </div>

        {/* 오른쪽: 로그인 폼 */}
        <div className="home-right">
          <div className="login-card">
            <div className="login-card-header">
              <h2>로그인</h2>
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

            <p className="login-footer">
              처음이신가요?{" "}
              <Link to="/register" className="link-text">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
