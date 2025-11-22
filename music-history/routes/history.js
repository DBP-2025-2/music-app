// routes/history.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/songs', async (req, res) => {
    try {
        const query = `
            SELECT s.song_id, s.title, a.name AS artist 
            FROM songs s
            JOIN albums al ON s.album_id = al.album_id
            JOIN artists a ON al.artist_main_id = a.artist_id
            ORDER BY s.title ASC
        `;
        const [rows] = await db.execute(query);
        res.json({ songs: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '노래 목록 로딩 실패' });
    }
});

//  노래 재생 (기록 저장)
router.post('/', async (req, res) => {
    const { song_id } = req.body;
    const myEmail = req.user.email; 

    if (!song_id) return res.status(400).json({ message: '노래를 선택해주세요.' });

    try {
        const [users] = await db.execute('SELECT user_id FROM users WHERE email = ?', [myEmail]);
        if (users.length === 0) return res.status(404).json({ message: '유저 정보 없음' });
        const userId = users[0].user_id;
        // 기록 저장 
        await db.execute('INSERT INTO play_history (user_id, song_id) VALUES (?, ?)', [userId, song_id]);

        // 노래 조회수 증가 
        await db.execute('UPDATE songs SET play_count = play_count + 1 WHERE song_id = ?', [song_id]);

        res.status(201).json({ message: '재생 기록 저장 완료' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 에러' });
    }
});

// 내 재생 기록 조회
router.get('/list', async (req, res) => {
    const myEmail = req.user.email;

    try {
        const [users] = await db.execute('SELECT user_id FROM users WHERE email = ?', [myEmail]);
        const userId = users[0].user_id;

        const query = `
            SELECT h.played_at, s.title, a.name AS artist_name
            FROM play_history h
            JOIN songs s ON h.song_id = s.song_id
            JOIN albums al ON s.album_id = al.album_id
            JOIN artists a ON al.artist_main_id = a.artist_id
            WHERE h.user_id = ?
            ORDER BY h.played_at DESC
            LIMIT 20
        `;
        const [rows] = await db.execute(query, [userId]);
        
        res.json({ history: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '기록 조회 실패' });
    }
});

module.exports = router;