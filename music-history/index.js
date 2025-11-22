// index.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// EJS 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 가짜 로그인 미들웨어 (테스트용) 
app.use((req, res, next) => {
    req.user = {
        email: 'test10@naver.com', // 테스트용 유저
        nickname: 'test10'
    };
    next();
});

// 라우터 연결
const historyRouter = require('./routes/history');
app.use('/api/history', historyRouter);

// 메인 화면 연결
app.get('/', (req, res) => {
    res.render('history', { 
        title: 'Music Play History',
        user: req.user 
    });
});

const PORT = process.env.PORT || 4000; 
app.listen(PORT, () => {
    console.log(`🚀 History 서버 실행 중: http://localhost:${PORT}`);
});