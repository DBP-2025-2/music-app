// routes/follows.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// 이메일로 내 ID 찾기 (로그인용)
async function getUserIdByEmail(email) {
    const [rows] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);
    return rows.length > 0 ? rows[0].user_id : null;
}

// 닉네임으로 상대방 ID 찾기 (유저 팔로우용)
async function getUserIdByNickname(nickname) {
    // 닉네임이 정확히 일치하는 유저 검색
    const [rows] = await db.execute('SELECT user_id FROM users WHERE nickname = ?', [nickname]);
    return rows.length > 0 ? rows[0].user_id : null;
}

//  이름으로 아티스트 ID 찾기 (아티스트 팔로우용)
async function getArtistIdByName(nameInput) {
    // 검색 효율을 위해 입력값을 정규화 (소문자, 공백제거)
    const searchNorm = nameInput.trim().toLowerCase().replace(/\s+/g, '');
    
    // 1. 정확한 이름(name) 또는 2. 정규화된 이름(name_norm)으로 검색
    // 예: "IU" 또는 "iu" 모두 검색 가능하도록
    const query = `SELECT artist_id FROM artists WHERE name = ? OR name_norm = ?`;
    const [rows] = await db.execute(query, [nameInput, searchNorm]);
    return rows.length > 0 ? rows[0].artist_id : null;
}

//팔로우 하기 (POST /api/follows)
router.post('/', async (req, res) => {
    const { follower_email, target_input, target_type } = req.body;

    if (!follower_email || !target_input || !target_type) {
        return res.status(400).json({ message: '필수 정보가 누락되었습니다.' });
    }

    try {
        const follower_id = await getUserIdByEmail(follower_email);
        if (!follower_id) return res.status(404).json({ message: '내 이메일(사용자)을 찾을 수 없습니다.' });
        let following_id;

        if (target_type === 'user') {
            // 유저라면: 닉네임으로 찾기
            following_id = await getUserIdByNickname(target_input);
            if (!following_id) {
                return res.status(404).json({ message: `닉네임이 '${target_input}'인 사용자를 찾을 수 없습니다.` });
            }
            if (follower_id === following_id) {
                return res.status(400).json({ message: '자기 자신을 팔로우할 수 없습니다.' });
            }
        } else if (target_type === 'artist') {
            // 아티스트라면: 이름으로 찾기
            following_id = await getArtistIdByName(target_input);
            if (!following_id) {
                return res.status(404).json({ message: `이름이 '${target_input}'인 아티스트를 찾을 수 없습니다.` });
            }
        }

        //  DB 저장
        const query = `INSERT INTO follows (follower_id, following_id, target_type) VALUES (?, ?, ?)`;
        await db.execute(query, [follower_id, following_id, target_type]);

        res.status(201).json({ message: '팔로우 성공!' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: '이미 팔로우한 대상입니다.' });
        }
        console.error(error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
});

//팔로우 취소 (DELETE /api/follows).
router.delete('/', async (req, res) => {
    const { follower_email, following_id, target_type } = req.body;

    try {
        const follower_id = await getUserIdByEmail(follower_email);
        if (!follower_id) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

        const query = `DELETE FROM follows WHERE follower_id = ? AND following_id = ? AND target_type = ?`;
        const [result] = await db.execute(query, [follower_id, following_id, target_type]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '팔로우 내역이 없습니다.' });
        }
        res.json({ message: '팔로우 취소 완료' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
});

// 내 목록 조회 
router.get('/list', async (req, res) => {
    const email = req.query.email;
    if (!email) return res.status(400).json({ message: '이메일이 필요합니다.' });

    try {
        const follower_id = await getUserIdByEmail(email);
        if (!follower_id) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

        const query = `
            SELECT f.following_id, f.target_type, f.created_at,
                   CASE 
                       WHEN f.target_type = 'user' THEN u.nickname 
                       WHEN f.target_type = 'artist' THEN a.name 
                   END AS target_name
            FROM follows f
            LEFT JOIN users u ON f.following_id = u.user_id AND f.target_type = 'user'
            LEFT JOIN artists a ON f.following_id = a.artist_id AND f.target_type = 'artist'
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
        `;
        
        const [rows] = await db.execute(query, [follower_id]);
        res.json({ count: rows.length, follows: rows });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류 발생' });
    }
});

module.exports = router;