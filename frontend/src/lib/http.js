// frontend/src/lib/http.js
import { API } from "./api";

export async function fetchJson(pathOrUrl, options = {}) {
  const token = localStorage.getItem("authToken");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // 토큰 있으면 Authorization 자동 추가
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 이미 http로 시작하면 그대로 쓰고, 아니면 API 붙이기
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : API + pathOrUrl;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // 에러 처리
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch {
      // JSON 아니면 무시
    }
    throw new Error(message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;

  const text = await res.text();
  if (!text) return null;

  return JSON.parse(text);
}
