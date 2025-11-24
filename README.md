# 🎵 Music App

완전한 스택의 음악 관리 웹 애플리케이션입니다.

## 📋 프로젝트 구조

```
music-app/
├── backend/              # Node.js + Express 백엔드
│   ├── src/
│   │   ├── routes/       # API 라우트
│   │   ├── store/        # DB 연결
│   │   ├── views/        # EJS 뷰 (로그인/회원가입)
│   │   └── server.js     # 메인 서버
│   ├── package.json
│   └── .env
│
└── frontend/             # React + Vite 프론트엔드
    ├── src/
    │   ├── pages/        # 페이지 컴포넌트
    │   ├── lib/          # API 헬퍼
    │   ├── App.jsx       # 메인 앱
    │   └── index.css
    ├── package.json
    └── .env
```

## 시작하기

### 사전 요구사항

- Node.js 18+
- MySQL 8.0+

### 설치

#### 1. 백엔드 설정

```bash
cd backend
npm install
```

`.env` 파일 생성:

```
PORT=4000
DB_HOST=your_db_host
DB_USER=root
DB_PASS=your_password
DB_NAME=railway
DB_PORT=3306
JWT_SECRET=your_secret_key
```

#### 2. 프론트엔드 설정

```bash
cd frontend
npm install
```

`.env` 파일 생성:

```
VITE_API_BASE=http://localhost:4000
```

### 실행

#### 백엔드 (개발 모드)

```bash
cd backend
npm run dev
```

서버: http://localhost:4000

#### 프론트엔드 (개발 모드)

```bash
cd frontend
npm run dev
```

앱: http://localhost:5173

## 주요 기능

### 인증 (Authentication)

- 회원가입 (`/register`)
- 로그인 (`/login`)
- JWT 토큰 기반 인증
- 비밀번호 암호화 (bcrypt)

### 음악 관리

- 아티스트 관리 (CRUD)
- 곡 관리 (CRUD)
- 앨범 관리 (CRUD)
- 플레이리스트 관리 (CRUD)
- 곡 검색 및 필터링
- 재생 기록
- 차트 조회
- 팔로우 시스템

## API 엔드포인트

### 인증

- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `GET /auth/me` - 내 정보 조회 (JWT 필요)

### 아티스트

- `GET /artists` - 전체 조회
- `POST /artists` - 생성
- `PATCH /artists/:id` - 수정
- `DELETE /artists/:id` - 삭제

### 곡

- `GET /songs` - 전체 조회
- `POST /songs` - 생성
- `PATCH /songs/:id` - 수정
- `DELETE /songs/:id` - 삭제

### 앨범

- `GET /albums` - 전체 조회
- `POST /albums` - 생성
- `PATCH /albums/:id` - 수정
- `DELETE /albums/:id` - 삭제

### 플레이리스트

- `GET /playlists` - 전체 조회
- `POST /playlists` - 생성
- `PATCH /playlists/:id` - 수정
- `DELETE /playlists/:id` - 삭제
- `GET /playlists/:id/items` - 플레이리스트의 곡 조회
- `POST /playlists/:id/items` - 곡 추가
- `DELETE /playlists/:id/items/:itemId` - 곡 제거

## ✨ 최신 업데이트

### v2.0

- 프론트엔드 로그인/회원가입 페이지 추가
- JWT 토큰 기반 인증 시스템
- 백엔드와 프론트엔드 통합
- music-user 모듈 완전 통합
- 필드명 불일치 문제 모두 해결
- 외래키 제약 조건 최적화

# .env.example 파일을 복사해서 .env 파일을 만드세요.

cp .env.example .env

# 4. .env 파일을 열어서 [ ] 안에 실제 값 (백엔드 API 주소 등)을 입력하세요.

# 예: VITE_API_URL="http://localhost:4000" (백엔드 포트에 맞춰주세요)

# 5. 프론트엔드 개발 서버 실행 (Vite 기준)

npm run dev

```

```
