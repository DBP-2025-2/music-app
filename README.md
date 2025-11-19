# Music App v1 (music-app-version1)

---
DB 비밀번호 변경하여 railway에서 확인 부탁드립니다.

## 프로젝트 실행 방법 (Quick Start)

이 프로젝트는 `backend`와 `frontend`가 분리된 **Monorepo** 구조입니다.
**반드시 2개의 터미널**을 열고 각각 실행해야 합니다.

### 1. 저장소 클론 (Clone)

git clone [여기에_클론_링크_붙여넣기]
cd music-app-version1

# 1. 백엔드 폴더로 이동

cd backend

# 2. 필요한 패키지 설치

npm install

# 3. .env 파일 설정 (중요!)

# .env.example 파일을 복사해서 .env 파일을 만드세요.

cp .env.example .env

# 4. .env 파일을 열어서 [ ] 안에 실제 값 (DB 정보, API 키 등)을 입력하세요.

# 예: DATABASE_URL="..."

# 예: JWT_SECRET="..."

# 5. 백엔드 서버 실행

npm start

# (또는 package.json에 설정된 dev 스크립트가 있다면 npm run dev)

# 1. 프론트엔드 폴더로 이동 (루트 폴더에서 시작)

cd frontend

# 2. 필요한 패키지 설치

npm install

# 3. .env 파일 설정 (중요!)

# .env.example 파일을 복사해서 .env 파일을 만드세요.

cp .env.example .env

# 4. .env 파일을 열어서 [ ] 안에 실제 값 (백엔드 API 주소 등)을 입력하세요.

# 예: VITE_API_URL="http://localhost:4000" (백엔드 포트에 맞춰주세요)

# 5. 프론트엔드 개발 서버 실행 (Vite 기준)

npm run dev

```

```
