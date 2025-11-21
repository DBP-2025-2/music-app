export default function HeartIcon({ filled = false, size = 22 }) {
  const strokeWidth = 1.6;

  return filled ? (
    // ❤️ 채워진 하트 (빨간 그라데이션)
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="url(#gradRed)"
      stroke="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gradRed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff4f4f" />
          <stop offset="100%" stopColor="#d90000" />
        </linearGradient>
      </defs>
      <path d="M12 21s-6.5-4.3-9.5-8C-0.5 8 1.3 3 5.2 3c2.2 0 3.8 1.4 4.8 2.9C11 4.4 12.6 3 14.8 3c3.8 0 5.7 5 2.7 10-3 3.7-9.5 8-9.5 8z" />
    </svg>
  ) : (
    // 🤍 비어 있는 하트
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#e80000"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 21s-6.5-4.3-9.5-8C-0.5 8 1.3 3 5.2 3c2.2 0 3.8 1.4 4.8 2.9C11 4.4 12.6 3 14.8 3c3.8 0 5.7 5 2.7 10-3 3.7-9.5 8-9.5 8z" />
    </svg>
  );
}
