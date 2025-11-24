// backend/src/store/db.mysql.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();
/**
 *
 *
 * tables:
 *  - artists(artist_id, name, name_norm, created_at)
 *  - albums(album_id, title, title_norm, artist_main_id, created_at)
 *  - songs(song_id, title, title_norm, album_id, is_collab, play_count, created_at)
 *  - song_artists(song_id, artist_id, display_order, created_at)
 *  - playlists(playlist_id, user_id, name, is_public, created_at, updated_at)
 *  - playlist_items(item_id, playlist_id, song_id, position, note, added_at)
 *  - charts(chart_id, chart_type, year, week, rank, song_id, week_start_date, week_end_date)
 *  - follows(follower_id, following_id, target_type, created_at)
 *  - play_history(history_id, user_id, song_id, played_at)
 *  - users(user_id, email, password_hash, nickname, created_at, last_login_at)
 */

// === Table & Column Constants ===
const ARTISTS_TABLE = "artists";
const ARTIST_ID_COL = "artist_id";
const ARTIST_NAME_COL = "name";

const ALBUMS_TABLE = "albums";
const ALBUM_ID_COL = "album_id";
const ALBUM_TITLE_COL = "title";
const ALBUM_ARTIST_ID_COL = "artist_main_id";
const ALBUM_CREATED_AT_COL = "created_at";

const SONGS_TABLE = "songs";
const SONG_ID_COL = "song_id";
const SONG_TITLE_COL = "title";
const SONG_ALBUM_ID_COL = "album_id";
const SONG_IS_COLLAB_COL = "is_collab";
const SONG_PLAY_COUNT_COL = "play_count";

const SONG_ARTISTS_TABLE = "song_artists";
const SA_SONG_ID_COL = "song_id";
const SA_ARTIST_ID_COL = "artist_id";
const SA_DISPLAY_ORDER_COL = "display_order";

const PLAYLISTS_TABLE = "playlists";
const PLAYLIST_ID_COL = "playlist_id";
const PLAYLIST_USER_ID_COL = "user_id";
const PLAYLIST_NAME_COL = "name";
const PLAYLIST_IS_PUBLIC_COL = "is_public";

const PLAYLIST_ITEMS_TABLE = "playlist_items";
const ITEM_ID_COL = "item_id";
const ITEM_PLAYLIST_ID_COL = "playlist_id";
const ITEM_SONG_ID_COL = "song_id";
const ITEM_POSITION_COL = "position";

const CHARTS_TABLE = "charts";
const FOLLOWS_TABLE = "follows";
const PLAY_HISTORY_TABLE = "play_history";
const HISTORY_ID_COL = "history_id";
const USERS_TABLE = "users";
const USER_ID_COL = "user_id";

// --------------------------------------------------------------------
// 공통: DB 커넥션 풀
// --------------------------------------------------------------------
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

export async function testConnection() {
  const [rows] = await pool.query("SELECT 1 AS ok");
  return rows[0].ok === 1;
}

// --------------------------------------------------------------------
// Artists
// --------------------------------------------------------------------
export async function getArtists() {
  const [rows] = await pool.query(`
    SELECT ${ARTIST_ID_COL} AS id, ${ARTIST_NAME_COL} AS name
    FROM ${ARTISTS_TABLE} ORDER BY ${ARTIST_ID_COL} DESC
  `);
  return rows;
}

export async function createArtist({ name }) {
  const trimmed = name.trim();
  const norm = trimmed.toLowerCase();
  const [result] = await pool.query(`
    INSERT INTO ${ARTISTS_TABLE} (${ARTIST_NAME_COL}, name_norm) VALUES (?, ?)
  `, [trimmed, norm]);
  return { id: result.insertId, name: trimmed };
}

export async function updateArtist(id, { name }) {
  const trimmed = name.trim();
  const norm = trimmed.toLowerCase();
  await pool.query(`
    UPDATE ${ARTISTS_TABLE} SET ${ARTIST_NAME_COL} = ?, name_norm = ? WHERE ${ARTIST_ID_COL} = ?
  `, [trimmed, norm, id]);
  return { id, name: trimmed };
}

export async function deleteArtist(id) {
  await pool.query(`DELETE FROM ${ARTISTS_TABLE} WHERE ${ARTIST_ID_COL} = ?`, [id]);
}

// --------------------------------------------------------------------
// Albums
// --------------------------------------------------------------------
export async function getAlbums() {
  const [rows] = await pool.query(`
    SELECT ${ALBUM_ID_COL} AS id, ${ALBUM_TITLE_COL} AS title,
           ${ALBUM_ARTIST_ID_COL} AS artistId, YEAR(${ALBUM_CREATED_AT_COL}) AS year
    FROM ${ALBUMS_TABLE} ORDER BY ${ALBUM_ID_COL} DESC
  `);
  return rows;
}

export async function createAlbum({ title, artistId }) {
  const trimmed = title.trim();
  const norm = trimmed.toLowerCase();
  const [result] = await pool.query(`
    INSERT INTO ${ALBUMS_TABLE} (${ALBUM_TITLE_COL}, title_norm, ${ALBUM_ARTIST_ID_COL}) VALUES (?, ?, ?)
  `, [trimmed, norm, artistId]);
  return { id: result.insertId, title: trimmed, artistId, year: null };
}

export async function updateAlbum(id, { title, artistId }) {
  const trimmed = title.trim();
  const norm = trimmed.toLowerCase();
  await pool.query(`
    UPDATE ${ALBUMS_TABLE} SET ${ALBUM_TITLE_COL} = ?, title_norm = ?, ${ALBUM_ARTIST_ID_COL} = ? WHERE ${ALBUM_ID_COL} = ?
  `, [trimmed, norm, artistId, id]);
  return { id, title: trimmed, artistId, year: null };
}

export async function deleteAlbum(id) {
  await pool.query(`DELETE FROM ${ALBUMS_TABLE} WHERE ${ALBUM_ID_COL} = ?`, [id]);
}

// --------------------------------------------------------------------
// Songs
// --------------------------------------------------------------------
export async function getSongs({ artistId, q } = {}) {
  const params = [];
  const where = [];
  if (artistId) {
    where.push(`sa.${SA_ARTIST_ID_COL} = ?`);
    params.push(artistId);
  }
  if (q) {
    where.push(`s.title_norm LIKE ?`);
    params.push(`%${q.toLowerCase()}%`);
  }
  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(`
    SELECT s.${SONG_ID_COL} AS id, s.${SONG_TITLE_COL} AS title, sa.${SA_ARTIST_ID_COL} AS artistId
    FROM ${SONGS_TABLE} s
    LEFT JOIN ${SONG_ARTISTS_TABLE} sa ON s.${SONG_ID_COL} = sa.${SA_SONG_ID_COL}
      AND (sa.${SA_DISPLAY_ORDER_COL} = 1 OR sa.${SA_DISPLAY_ORDER_COL} IS NULL)
    ${whereClause} ORDER BY s.${SONG_ID_COL} DESC
  `, params);
  return rows;
}

export async function createSong({ title, artistId }) {
  const trimmed = title.trim();
  const norm = trimmed.toLowerCase();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [songResult] = await conn.query(`
      INSERT INTO ${SONGS_TABLE} (${SONG_TITLE_COL}, title_norm, ${SONG_ALBUM_ID_COL}, ${SONG_IS_COLLAB_COL}, ${SONG_PLAY_COUNT_COL})
      VALUES (?, ?, NULL, 0, 0)
    `, [trimmed, norm]);
    const songId = songResult.insertId;
    await conn.query(`
      INSERT INTO ${SONG_ARTISTS_TABLE} (${SA_SONG_ID_COL}, ${SA_ARTIST_ID_COL}, ${SA_DISPLAY_ORDER_COL}) VALUES (?, ?, 1)
    `, [songId, artistId]);
    await conn.commit();
    return { id: songId, title: trimmed, artistId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateSong(id, { title, artistId }) {
  const trimmed = title.trim();
  const norm = trimmed.toLowerCase();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`UPDATE ${SONGS_TABLE} SET ${SONG_TITLE_COL} = ?, title_norm = ? WHERE ${SONG_ID_COL} = ?`, [trimmed, norm, id]);
    
    const [rows] = await conn.query(`
      SELECT ${SA_SONG_ID_COL} FROM ${SONG_ARTISTS_TABLE} WHERE ${SA_SONG_ID_COL} = ? AND (${SA_DISPLAY_ORDER_COL} = 1 OR ${SA_DISPLAY_ORDER_COL} IS NULL)
    `, [id]);

    if (rows.length > 0) {
      await conn.query(`
        UPDATE ${SONG_ARTISTS_TABLE} SET ${SA_ARTIST_ID_COL} = ? WHERE ${SA_SONG_ID_COL} = ? AND (${SA_DISPLAY_ORDER_COL} = 1 OR ${SA_DISPLAY_ORDER_COL} IS NULL)
      `, [artistId, id]);
    } else {
      await conn.query(`
        INSERT INTO ${SONG_ARTISTS_TABLE} (${SA_SONG_ID_COL}, ${SA_ARTIST_ID_COL}, ${SA_DISPLAY_ORDER_COL}) VALUES (?, ?, 1)
      `, [id, artistId]);
    }
    await conn.commit();
    return { id, title: trimmed, artistId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function deleteSong(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM ${SONG_ARTISTS_TABLE} WHERE ${SA_SONG_ID_COL} = ?`, [id]);
    await conn.query(`DELETE FROM ${SONGS_TABLE} WHERE ${SONG_ID_COL} = ?`, [id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// --------------------------------------------------------------------
// Playlists
// --------------------------------------------------------------------
export async function getPlaylists(userId) {
  const [rows] = await pool.query(`
    SELECT ${PLAYLIST_ID_COL} AS id, ${PLAYLIST_NAME_COL} AS name, ${PLAYLIST_IS_PUBLIC_COL} AS isPublic, note
    FROM ${PLAYLISTS_TABLE} WHERE ${PLAYLIST_USER_ID_COL} = ? ORDER BY ${PLAYLIST_ID_COL} DESC
  `, [userId]);
  return rows;
}

export async function createPlaylist({ userId, name, isPublic = true, note = "" }) {
  const [result] = await pool.query(`
    INSERT INTO ${PLAYLISTS_TABLE} (${PLAYLIST_USER_ID_COL}, ${PLAYLIST_NAME_COL}, ${PLAYLIST_IS_PUBLIC_COL}, note) VALUES (?, ?, ?, ?)
  `, [userId, name, isPublic ? 1 : 0, note]);
  return { id: result.insertId, name, isPublic, note };
}

export async function updatePlaylist(id, { name, note, isPublic }) {
  await pool.query(`
    UPDATE ${PLAYLISTS_TABLE} SET ${PLAYLIST_NAME_COL} = ?, note = ?, ${PLAYLIST_IS_PUBLIC_COL} = ? WHERE ${PLAYLIST_ID_COL} = ?
  `, [name, note ?? "", isPublic ? 1 : 0, id]);
  return { id, name, note, isPublic };
}

export async function deletePlaylist(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM ${PLAYLIST_ITEMS_TABLE} WHERE ${ITEM_PLAYLIST_ID_COL} = ?`, [id]);
    await conn.query(`DELETE FROM ${PLAYLISTS_TABLE} WHERE ${PLAYLIST_ID_COL} = ?`, [id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function searchSongs({ q }) {
  const like = `%${q}%`;
  const [rows] = await pool.query(`
    SELECT s.song_id AS id, s.title, GROUP_CONCAT(DISTINCT a.name ORDER BY sa.display_order SEPARATOR ', ') AS artistName
    FROM songs AS s
    LEFT JOIN song_artists AS sa ON sa.song_id = s.song_id
    LEFT JOIN artists AS a ON a.artist_id = sa.artist_id
    WHERE s.title LIKE ? OR a.name LIKE ?
    GROUP BY s.song_id, s.title ORDER BY s.song_id ASC
  `, [like, like]);
  return rows;
}

export async function searchPublicPlaylists({ q }) {
  const params = [];
  let where = `WHERE p.${PLAYLIST_IS_PUBLIC_COL} = 1`;
  if (q && q.trim()) {
    where += ` AND (p.${PLAYLIST_NAME_COL} LIKE ? OR p.note LIKE ?)`;
    const like = `%${q.trim()}%`;
    params.push(like, like);
  }
  const [rows] = await pool.query(`
    SELECT p.${PLAYLIST_ID_COL} AS id, p.${PLAYLIST_NAME_COL} AS name, p.note, u.nickname AS ownerNickname,
           COUNT(DISTINCT pi.${ITEM_ID_COL}) AS trackCount, COALESCE(f.followers, 0) AS followerCount
    FROM ${PLAYLISTS_TABLE} p
    JOIN ${USERS_TABLE} u ON u.${USER_ID_COL} = p.${PLAYLIST_USER_ID_COL}
    LEFT JOIN ${PLAYLIST_ITEMS_TABLE} pi ON pi.${ITEM_PLAYLIST_ID_COL} = p.${PLAYLIST_ID_COL}
    LEFT JOIN (
      SELECT following_id, COUNT(DISTINCT follower_id) AS followers FROM ${FOLLOWS_TABLE} WHERE target_type = 'playlist' GROUP BY following_id
    ) f ON f.following_id = p.${PLAYLIST_ID_COL}
    ${where}
    GROUP BY p.${PLAYLIST_ID_COL}, p.${PLAYLIST_NAME_COL}, p.note, u.nickname, f.followers
    ORDER BY p.${PLAYLIST_ID_COL} DESC
  `, params);
  return rows;
}

export async function getPopularPublicPlaylists({ limit = 50 } = {}) {
  const [rows] = await pool.query(`
    SELECT p.${PLAYLIST_ID_COL} AS id, p.${PLAYLIST_NAME_COL} AS name, p.note, u.nickname AS ownerNickname,
           COUNT(DISTINCT pi.${ITEM_ID_COL}) AS trackCount, COALESCE(f.followers, 0) AS followerCount
    FROM ${PLAYLISTS_TABLE} p
    JOIN ${USERS_TABLE} u ON u.${USER_ID_COL} = p.${PLAYLIST_USER_ID_COL}
    LEFT JOIN ${PLAYLIST_ITEMS_TABLE} pi ON pi.${ITEM_PLAYLIST_ID_COL} = p.${PLAYLIST_ID_COL}
    LEFT JOIN (
      SELECT following_id, COUNT(DISTINCT follower_id) AS followers FROM ${FOLLOWS_TABLE} WHERE target_type = 'playlist' GROUP BY following_id
    ) f ON f.following_id = p.${PLAYLIST_ID_COL}
    WHERE p.${PLAYLIST_IS_PUBLIC_COL} = 1
    GROUP BY p.${PLAYLIST_ID_COL}, p.${PLAYLIST_NAME_COL}, p.note, u.nickname, f.followers
    ORDER BY followerCount DESC, p.${PLAYLIST_ID_COL} DESC
    LIMIT ?
  `, [limit]);
  return rows;
}

// --------------------------------------------------------------------
// Playlist Items
// --------------------------------------------------------------------
export async function getPlaylistItems(playlistId) {
  const [rows] = await pool.query(`
    SELECT pi.item_id AS id, pi.playlist_id, pi.song_id AS songId, pi.position, pi.added_at, s.title AS songTitle,
           GROUP_CONCAT(DISTINCT a.name ORDER BY sa.display_order SEPARATOR ', ') AS artistName
    FROM playlist_items AS pi
    JOIN songs AS s ON s.song_id = pi.song_id
    LEFT JOIN song_artists AS sa ON sa.song_id = s.song_id
    LEFT JOIN artists AS a ON a.artist_id = sa.artist_id
    WHERE pi.playlist_id = ?
    GROUP BY pi.item_id, pi.playlist_id, pi.song_id, pi.position, pi.added_at, s.title
    ORDER BY pi.position ASC
  `, [playlistId]);
  return rows;
}

export async function addPlaylistItem({ playlistId, songId }) {
  const [existing] = await pool.query(`
    SELECT ${ITEM_ID_COL} AS id FROM ${PLAYLIST_ITEMS_TABLE} WHERE ${ITEM_PLAYLIST_ID_COL} = ? AND ${ITEM_SONG_ID_COL} = ?
  `, [playlistId, songId]);
  if (existing.length > 0) throw new Error("이미 이 플레이리스트에 있는 곡입니다.");

  const [posRows] = await pool.query(`
    SELECT COALESCE(MAX(${ITEM_POSITION_COL}), 0) AS maxPos FROM ${PLAYLIST_ITEMS_TABLE} WHERE ${ITEM_PLAYLIST_ID_COL} = ?
  `, [playlistId]);
  const nextPos = (posRows[0]?.maxPos || 0) + 1;

  const [result] = await pool.query(`
    INSERT INTO ${PLAYLIST_ITEMS_TABLE} (${ITEM_PLAYLIST_ID_COL}, ${ITEM_SONG_ID_COL}, ${ITEM_POSITION_COL}) VALUES (?, ?, ?)
  `, [playlistId, songId, nextPos]);
  return { id: result.insertId, playlistId, songId, position: nextPos };
}

export async function deletePlaylistItem(id) {
  await pool.query(`DELETE FROM ${PLAYLIST_ITEMS_TABLE} WHERE ${ITEM_ID_COL} = ?`, [id]);
}

// --------------------------------------------------------------------
// Charts
// --------------------------------------------------------------------
export async function getCharts() {
  const [rows] = await pool.query(`SELECT * FROM ${CHARTS_TABLE} ORDER BY year DESC, week DESC, \`rank\` ASC`);
  return rows.map((row) => ({
    id: row.chart_id,
    chartType: row.chart_type,
    year: row.year,
    week: row.week,
    rank: row.rank,
    songId: row.song_id,
    weekStartDate: row.week_start_date,
    weekEndDate: row.week_end_date,
  }));
}

// --------------------------------------------------------------------
// Follows & Recommendations
// --------------------------------------------------------------------

// GET /follows (전체 목록용)
export async function getFollows() {
  const [rows] = await pool.query(`
    SELECT follower_id AS followerId, following_id AS followingId, created_at AS createdAt
    FROM ${FOLLOWS_TABLE} ORDER BY created_at DESC
  `);
  return rows;
}

// 유저/아티스트 찾기 헬퍼
export async function findUserByEmail(email) {
  const [rows] = await pool.query("SELECT user_id AS id, email, nickname FROM users WHERE email = ?", [email]);
  return rows[0] || null;
}

export async function findUserByNickname(nickname) {
  const [rows] = await pool.query("SELECT user_id AS id FROM users WHERE nickname = ?", [nickname]);
  return rows[0] || null;
}

export async function findArtistByName(name) {
  // 1. 입력값 정리 (앞뒤 공백 제거)
  const trimmed = name.trim();
  
  // 2. 검색어 정규화 (모두 소문자로, 공백 제거) -> "New Jeans" 입력 시 "newjeans"로 변환
  const searchNorm = trimmed.toLowerCase().replace(/\s+/g, '');

  console.log(`🔎 아티스트 검색 요청: "${name}" (정규화: "${searchNorm}")`);

  // 3. [강력한 검색] 
  // - 이름이 정확히 같거나 (name = ?)
  // - 정규화된 이름이 같거나 (name_norm = ?)
  // - 이름의 일부분이라도 포함되면 (LIKE %)
  const query = `
    SELECT artist_id AS id, name 
    FROM artists 
    WHERE name = ? 
       OR name_norm = ? 
       OR name LIKE ? 
       OR name_norm LIKE ?
    LIMIT 1
  `;
  
  const [rows] = await pool.query(query, [
    trimmed, 
    searchNorm, 
    `%${trimmed}%`, 
    `%${searchNorm}%`
  ]);

  if (rows.length > 0) {
    console.log(`✅ 찾음! ID: ${rows[0].id}, 이름: ${rows[0].name}`);
    return rows[0];
  } else {
    console.log(`❌ DB에서 못 찾음.`);
    return null;
  }
}
// 팔로우 추가
export async function createFollow(followerId, followingId, targetType) {
  await pool.query(
    "INSERT INTO follows (follower_id, following_id, target_type) VALUES (?, ?, ?)",
    [followerId, followingId, targetType]
  );
}

// 팔로우 취소
export async function deleteFollow(followerId, followingId, targetType) {
  const [result] = await pool.query(
    "DELETE FROM follows WHERE follower_id = ? AND following_id = ? AND target_type = ?",
    [followerId, followingId, targetType]
  );
  return result.affectedRows > 0;
}

// 내 팔로우 목록 조회
// 4. 내 팔로우 목록 조회 (List)
// backend/src/store/db.mysql.js

// ... 기존 코드 ...

// ★ [수정] 프론트엔드 호환성을 위해 Alias를 id, name 등으로 변경
export async function getMyFollows(followerId) {
  const query = `
    SELECT 
      f.following_id AS id,           -- following_id -> id (화면 'ID: undefined' 해결)
      f.following_id AS following_id, -- 삭제 API 호출 시 필요할 수 있어 유지
      f.target_type  AS type,         -- target_type -> type (선택 사항)
      f.target_type  AS target_type,  -- 삭제 API 호환용
      f.created_at   AS created_at,
      CASE 
        WHEN f.target_type = 'user' THEN u.nickname 
        WHEN f.target_type = 'artist' THEN a.name 
      END AS name                     -- target_name -> name (화면 표시용)
    FROM follows f
    LEFT JOIN users u ON f.following_id = u.user_id AND f.target_type = 'user'
    LEFT JOIN artists a ON f.following_id = a.artist_id AND f.target_type = 'artist'
    WHERE f.follower_id = ?
    ORDER BY f.created_at DESC
  `;
  const [rows] = await pool.query(query, [followerId]);
  return rows;
}

// ... 기존 코드 ...
// 추천 목록
export async function getRecommendations(myEmail) {
  const [users] = await pool.query(
    "SELECT user_id AS userId, nickname, email FROM users WHERE email != ? ORDER BY created_at DESC LIMIT 5",
    [myEmail || '']
  );
  const [artists] = await pool.query(
    "SELECT artist_id AS artistId, name FROM artists ORDER BY created_at DESC LIMIT 5"
  );
  return { users, artists };
}

// --------------------------------------------------------------------
// Play History
// --------------------------------------------------------------------
export async function getPlayHistory() {
  const [rows] = await pool.query(`
    SELECT ${HISTORY_ID_COL} AS id, user_id AS userId, song_id AS songId, played_at AS playedAt
    FROM ${PLAY_HISTORY_TABLE} ORDER BY played_at DESC
  `);
  return rows;
}

// --------------------------------------------------------------------
// Users
// --------------------------------------------------------------------
export async function getUsers() {
  const [rows] = await pool.query(`
    SELECT ${USER_ID_COL} AS id, email, nickname, created_at AS createdAt, last_login_at AS lastLoginAt
    FROM ${USERS_TABLE} ORDER BY ${USER_ID_COL} ASC
  `);
  return rows;
}