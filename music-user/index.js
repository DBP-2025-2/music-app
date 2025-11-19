require('dotenv').config(); // .env 파일 로드
const express = require('express');
const db = require('./db'); // DB 연결
const bcrypt = require('bcrypt'); // 비밀번호 암호화
const jwt = require('jsonwebtoken'); // 인증 토큰

const app = express();
const port = 3000;

// 미들웨어 설정
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// ▼▼▼ [1. 인증 미들웨어 (수정됨: 디버깅 로그 포함)] ▼▼▼
const authMiddleware = (req, res, next) => {
  try {
    // [디버깅용 로그] 헤더가 진짜 오는지 확인
    console.log('--- [디버깅] 요청 헤더 도착 ---');
    console.log('Authorization 값:', req.headers['authorization']);
    console.log('-----------------------------');

    // 1. 요청 헤더에서 'Authorization' 값 찾기
    const authHeader = req.headers['authorization'];
    
    // 2. 헤더가 없거나 'Bearer ' 형식이 아니면 에러
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    // 3. 순수 토큰 추출
    const token = authHeader.split(' ')[1];

    // 4. 토큰 검증 (.env의 비밀키 사용)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. 검증 성공 시 사용자 정보 저장
    req.user = decoded; 
    
    // 6. 다음 단계로 이동
    next();

  } catch (error) {
    // 7. 에러 처리
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '토큰이 만료되었습니다.' });
    }
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
};


// --- API 라우터(기능)들은 이 아래에 추가합니다 ---

// 테스트용 홈
app.get('/', (req, res) => {
  res.send('🎵 My Music API 서버가 실행 중입니다! 🎵');
});

// 회원가입 페이지 (EJS)
app.get('/register', (req, res) => {
  res.render('register');
});

// 로그인 페이지 (EJS)
app.get('/login', (req, res) => {
  res.render('login');
});


// ▼▼▼ [2. 내 정보 보기 API] ▼▼▼
app.get('/users/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await db.execute(
      'SELECT user_id, email, nickname, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const user = rows[0];

    res.status(200).json({
      userId: user.user_id,
      email: user.email,
      nickname: user.nickname,
      joinedAt: user.created_at
    });

  } catch (error) {
    console.error('내 정보 조회 오류:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
});


// 회원가입 API (POST)
app.post('/users/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호는 필수입니다.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)',
      [email, hashedPassword, nickname]
    );

    res.status(201).json({
      message: '✅ 회원가입 성공!',
      userId: result.insertId,
      email: email,
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
    }
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
});


// 로그인 API (POST)
app.post('/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력하세요.' });
    }

    const [rows] = await db.execute(
      'SELECT user_id, email, password_hash, nickname FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    const user = rows[0];
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordMatch) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    const token = jwt.sign(
      { userId: user.user_id, email: user.email, nickname: user.nickname }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' } 
    );

    await db.execute(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [user.user_id]
    );

    res.status(200).json({
      message: '✅ 로그인 성공!',
      token: token
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
});


// 서버 실행
app.listen(port, () => {
  console.log(`✅ 서버가 http://localhost:${port} 에서 실행되었습니다.`);
});