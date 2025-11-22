// index.js
const express = require('express');
const cors = require('cors');
const path = require('path'); 
const app = express();

app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views')); 

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 라우터 연결
const followsRouter = require('./routes/follows');
app.use('/api/follows', followsRouter);

// 접속(GET /).
app.get('/', (req, res) => {
    res.render('follow', { title: 'Music App - 팔로우 관리' });
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 서버가 실행 중입니다: http://localhost:${PORT}`);
});