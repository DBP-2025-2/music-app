export async function fetchJson(url, options = {}) {
  // 기본 Content-Type을 application/json으로 설정
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const fetchOptions = {
    ...options,
    headers,
  };

  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[${res.status}] ${res.statusText} ${text}`);
  }
  return res.json();
}
