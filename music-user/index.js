// index.js

// ### 1. dotenv 설정을 db.js가 아닌 index.js 맨 위로 이동 ###
require('dotenv').config();

const express = require('express');
const db = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');


//  2. 중복 제거 (원래 메시지로 통일) 
app.get('/', (req, res) => {
  res.send('🎵 My Music API 서버가 실행 중입니다! 🎵');
});

// 2. 중복 제거 (1개만 남김) 
app.get('/register', (req, res) => {
  try {
    res.render('register');
  } catch (error) {
    console.error('페이지 렌더링 오류:', error);
    res.status(500).send('페이지를 불러오는 데 실패했습니다.');
  }
});

// GET /login 요청이 오면, 'views/login.ejs' 파일을 렌더링
app.get('/login', (req, res) => {
  try {
    res.render('login');
  } catch (error) {
    console.error('페이지 렌더링 오류:', error);
    res.status(500).send('페이지를 불러오는 데 실패했습니다.');
  }
});

// ▼▼▼ [새로 추가된 회원가입 API] ▼▼▼
app.post('/users/register', async (req, res) => {
  try {
    // 1. 사용자가 보낸 정보(body)에서 email, password, nickname을 꺼냅니다.
    const { email, password, nickname } = req.body;

    // 2. (기본 유효성 검사)
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호는 필수입니다.' });
    }

    // 3. 비밀번호 해시(암호화)
    const saltRounds = 10; // 암호화 강도
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. 데이터베이스에 사용자 삽입
    const [result] = await db.execute(
      'INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)',
      [email, hashedPassword, nickname]
    );

    // 5. 성공 응답
    res.status(201).json({
      message: '✅ 회원가입 성공!',
      userId: result.insertId,
      email: email,
    });
  } catch (error) {
    // 6. 오류 처리
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
    }
    
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
});

app.post('/users/login', async (req, res) => {
  try {
    // 1. 사용자가 보낸 email, password를 받습니다.
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력하세요.' });
    }

    // 2. DB에서 이메일로 사용자를 찾습니다.
    const [rows] = await db.execute(
      'SELECT user_id, email, password_hash, nickname FROM users WHERE email = ?',
      [email]
    );

    // 3. 사용자가 존재하지 않는지 확인
    if (rows.length === 0) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    const user = rows[0];

    // 4. 비밀번호 비교
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordMatch) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    // 5. 로그인 인증 토큰(JWT) 생성
    // ### 1. 보안 수정 ###
    const token = jwt.sign(
      { userId: user.user_id, email: user.email, nickname: user.nickname }, 
      process.env.JWT_SECRET, // .env 파일에서 비밀 키 읽어오기
      { expiresIn: '1h' } // 토큰 유효 시간 (예: 1시간)
    );

    // 6. 명세서 요구사항: 'last_login_at' 업데이트
    await db.execute(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [user.user_id]
    );

    // 7. 토큰을 사용자에게 응답
    res.status(200).json({
      message: '✅ 로그인 성공!',
      token: token
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
  }
});

// --- 서버 실행 ---
app.listen(port, () => {
  console.log(`✅ 서버가 http://localhost:${port} 에서 실행되었습니다.`);
});