// frontend/src/lib/http.js
export async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  // 에러 응답 처리
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch {
      // body 없으면 그냥 넘어감
    }
    throw new Error(message || `HTTP ${res.status}`);
  }

  // ❗ 204 No Content 는 그냥 null 반환
  if (res.status === 204) return null;

  // body 가 비어 있을 수도 있으니 text 로 먼저 읽기
  const text = await res.text();
  if (!text) return null;

  return JSON.parse(text);
}
