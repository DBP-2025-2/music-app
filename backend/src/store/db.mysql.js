// backend/src/store/db.mysql.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * tables:
 * - artists(artist_id, name, name_norm, created_at)
 * - albums(album_id, title, title_norm, artist_main_id, created_at)
 * - songs(song_id, title, title_norm, album_id, is_collab, play_count, created_at)
 * - song_artists(song_id, artist_id, display_order, created_at)
 * - playlists(playlist_id, user_id, name, is_public, created_at, updated_at)
 * - playlist_items(item_id, playlist_id, song_id, position, note, added_at)
 * - charts(chart_id, chart_type, year, week, rank, song_id, week_start_date, week_end_date)
 * - follows(follower_id, following_id, target_type, created_at)
 * - play_history(history_id, user_id, song_id, played_at)
 * - users(user_id, email, password_hash, nickname, created_at, last_login_at)
 */

// === Artists ===
const ARTISTS_TABLE = "artists";
const ARTIST_ID_COL = "artist_id";
const ARTIST_NAME_COL = "name";

// === Albums ===
const ALBUMS_TABLE = "albums";
const ALBUM_ID_COL = "album_id";
const ALBUM_TITLE_COL = "title";
const ALBUM_ARTIST_ID_COL = "artist_main_id"; // 메인 아티스트
const ALBUM_CREATED_AT_COL = "created_at"; // YEAR(created_at) -> year

// === Songs ===
const SONGS_TABLE = "songs";
const SONG_ID_COL = "song_id";
const SONG_TITLE_COL = "title";
const SONG_ALBUM_ID_COL = "album_id";
const SONG_IS_COLLAB_COL = "is_collab";
const SONG_PLAY_COUNT_COL = "play_count";

// === Song_Artists (곡-아티스트 N:M 매핑) ===
const SONG_ARTISTS_TABLE = "song_artists";
const SA_SONG_ID_COL = "song_id";
const SA_ARTIST_ID_COL = "artist_id";
const SA_DISPLAY_ORDER_COL = "display_order";

// === Playlists ===
const PLAYLISTS_TABLE = "playlists";
const PLAYLIST_ID_COL = "playlist_id";
const PLAYLIST_USER_ID_COL = "user_id";
const PLAYLIST_NAME_COL = "name";
const PLAYLIST_IS_PUBLIC_COL = "is_public";

// === Playlist Items ===
const PLAYLIST_ITEMS_TABLE = "playlist_items";
const ITEM_ID_COL = "item_id";
const ITEM_PLAYLIST_ID_COL = "playlist_id";
const ITEM_SONG_ID_COL = "song_id";
const ITEM_POSITION_COL = "position";

// === Charts ===
const CHARTS_TABLE = "charts";
const CHART_ID_COL = "chart_id";

// === Follows ===
const FOLLOWS_TABLE = "follows";

// === Play History ===
const PLAY_HISTORY_TABLE = "play_history";
const HISTORY_ID_COL = "history_id";

// === Users ===
const USERS_TABLE = "users";
const USER_ID_COL = "user_id";

// --------------------------------------------------------------------
// 공통: DB 커넥션 풀
// --------------------------------------------------------------------
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 10,
});

// 연결 테스트용
export async function testConnection() {
  const [rows] = await pool.query("SELECT 1 AS ok");
  return rows[0].ok === 1;
}

// pool export (auth 등 다른 라우트에서 사용 가능)
export { pool };

// --------------------------------------------------------------------
// Artists
// --------------------------------------------------------------------

// GET /artists
export async function getArtists() {
  const [rows] = await pool.query(
    `
    SELECT
      ${ARTIST_ID_COL}   AS id,
      ${ARTIST_NAME_COL} AS name
    FROM ${ARTISTS_TABLE}
    ORDER BY ${ARTIST_ID_COL} DESC
    `
  );
  return rows;
}

// POST /artists
export async function createArtist({ name }) {
  const trimmed = name.trim();
  const norm = trimmed.toLowerCase(); // 단순 정규화

  const [result] = await pool.query(
    `
    INSERT INTO ${ARTISTS_TABLE} (${ARTIST_NAME_COL}, name_norm)
    VALUES (?, ?)
    `,
    [trimmed, norm]
  );

  return {
    id: result.insertId,
    name: trimmed,
  };
}

// PATCH /artists/:id
export async function updateArtist(id, { name }) {
  const trimmed = name.trim();
  const norm = trimmed.toLowerCase();

  await pool.query(
    `
    UPDATE ${ARTISTS_TABLE}
    SET ${ARTIST_NAME_COL} = ?, name_norm = ?
    WHERE ${ARTIST_ID_COL} = ?
    `,
    [trimmed, norm, id]
  );

  return { id, name: trimmed };
}

// DELETE /artists/:id
export async function deleteArtist(id) {
  await pool.query(
    `
    DELETE FROM ${ARTISTS_TABLE}
    WHERE ${ARTIST_ID_COL} = ?
    `,
    [id]
  );
}

// --------------------------------------------------------------------
// Albums
// --------------------------------------------------------------------

// GET /albums  (YEAR(created_at)를 year로 사용)
export async function getAlbums() {
  const [rows] = await pool.query(
    `
    SELECT
      ${ALBUM_ID_COL}        AS id,
      ${ALBUM_TITLE_COL}     AS title,
      ${ALBUM_ARTIST_ID_COL} AS artistId,
      YEAR(${ALBUM_CREATED_AT_COL}) AS year
    FROM ${ALBUMS_TABLE}
    ORDER BY ${ALBUM_ID_COL} DESC
    `
  );
  return rows;
}

// POST /albums
export async function createAlbum({ title, artistId }) {
  const trimmed = title.trim();
  const norm = trimmed.toLowerCase();

  const [result] = await pool.query(
    `
    INSERT INTO ${ALBUMS_TABLE}
      (${ALBUM_TITLE_COL}, title_norm, ${ALBUM_ARTIST_ID_COL})
    VALUES (?, ?, ?)
    `,
    [trimmed, norm, artistId]
  );

  return {
    id: result.insertId,
    title: trimmed,
    artistId,
    year: null,
  };
}

// PATCH /albums/:id
export async function updateAlbum(id, { title, artistId }) {
  const trimmed = title.trim();
  const norm = trimmed.toLowerCase();

  await pool.query(
    `
    UPDATE ${ALBUMS_TABLE}
    SET ${ALBUM_TITLE_COL} = ?, title_norm = ?, ${ALBUM_ARTIST_ID_COL} = ?
    WHERE ${ALBUM_ID_COL} = ?
    `,
    [trimmed, norm, artistId, id]
  );

  return { id, title: trimmed, artistId, year: null };
}

// DELETE /albums/:id
export async function deleteAlbum(id) {
  await pool.query(
    `
    DELETE FROM ${ALBUMS_TABLE}
    WHERE ${ALBUM_ID_COL} = ?
    `,
    [id]
  );
}

// --------------------------------------------------------------------
// Songs (+ song_artists 로 메인 아티스트 연결)
// --------------------------------------------------------------------

// GET /songs 또는 /songs?artistId=...&q=...
export async function getSongs({ artistId, q } = {}) {
  const params = [];
  const where = [];

  let query = `
    SELECT 
      s.${SONG_ID_COL}    AS id,
      s.${SONG_TITLE_COL} AS title,
      
      (SELECT name FROM ${ARTISTS_TABLE} a 
       JOIN ${SONG_ARTISTS_TABLE} sa_main ON a.${ARTIST_ID_COL} = sa_main.${SA_ARTIST_ID_COL}
       WHERE sa_main.${SA_SONG_ID_COL} = s.${SONG_ID_COL} 
       ORDER BY sa_main.${SA_DISPLAY_ORDER_COL} ASC LIMIT 1) AS artistName

    FROM ${SONGS_TABLE} s
  `;

  if (artistId) {
    query += ` JOIN ${SONG_ARTISTS_TABLE} sa_filter ON s.${SONG_ID_COL} = sa_filter.${SA_SONG_ID_COL} `;
    where.push(`sa_filter.${SA_ARTIST_ID_COL} = ?`);
    params.push(artistId);
  }

  if (q) {
    where.push(`s.title_norm LIKE ?`);
    params.push(`%${q.toLowerCase()}%`);
  }

  if (where.length > 0) {
    query += ` WHERE ${where.join(" AND ")} `;
  }

  query += ` ORDER BY s.${SONG_ID_COL} DESC`;

  const [rows] = await pool.query(query, params);
  return rows;
}

// POST /songs ({ title, artistId })
export async function createSong({ title, artistId }) {
  const trimmed = title.trim();
  const norm = trimmed.toLowerCase();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [songResult] = await conn.query(
      `
      INSERT INTO ${SONGS_TABLE}
        (${SONG_TITLE_COL}, title_norm, ${SONG_ALBUM_ID_COL}, ${SONG_IS_COLLAB_COL}, ${SONG_PLAY_COUNT_COL})
      VALUES (?, ?, NULL, 0, 0)
      `,
      [trimmed, norm]
    );
    const songId = songResult.insertId;

    await conn.query(
      `
      INSERT INTO ${SONG_ARTISTS_TABLE}
        (${SA_SONG_ID_COL}, ${SA_ARTIST_ID_COL}, ${SA_DISPLAY_ORDER_COL})
      VALUES (?, ?, 1)
      `,
      [songId, artistId]
    );

    await conn.commit();

    return { id: songId, title: trimmed, artistId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// PATCH /songs/:id
export async function updateSong(id, { title, artistId }) {
  const trimmed = title.trim();
  const norm = trimmed.toLowerCase();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `
      UPDATE ${SONGS_TABLE}
      SET ${SONG_TITLE_COL} = ?, title_norm = ?
      WHERE ${SONG_ID_COL} = ?
      `,
      [trimmed, norm, id]
    );

    const [rows] = await conn.query(
      `
      SELECT ${SA_SONG_ID_COL}
      FROM ${SONG_ARTISTS_TABLE}
      WHERE ${SA_SONG_ID_COL} = ?
        AND (${SA_DISPLAY_ORDER_COL} = 1 OR ${SA_DISPLAY_ORDER_COL} IS NULL)
      `,
      [id]
    );

    if (rows.length > 0) {
      await conn.query(
        `
        UPDATE ${SONG_ARTISTS_TABLE}
        SET ${SA_ARTIST_ID_COL} = ?
        WHERE ${SA_SONG_ID_COL} = ?
          AND (${SA_DISPLAY_ORDER_COL} = 1 OR ${SA_DISPLAY_ORDER_COL} IS NULL)
        `,
        [artistId, id]
      );
    } else {
      await conn.query(
        `
        INSERT INTO ${SONG_ARTISTS_TABLE}
          (${SA_SONG_ID_COL}, ${SA_ARTIST_ID_COL}, ${SA_DISPLAY_ORDER_COL})
        VALUES (?, ?, 1)
        `,
        [id, artistId]
      );
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

// DELETE /songs/:id
export async function deleteSong(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `
      DELETE FROM ${SONG_ARTISTS_TABLE}
      WHERE ${SA_SONG_ID_COL} = ?
      `,
      [id]
    );

    await conn.query(
      `
      DELETE FROM ${SONGS_TABLE}
      WHERE ${SONG_ID_COL} = ?
      `,
      [id]
    );

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


// GET /playlists  → 내 플레이리스트
export async function getPlaylists(userId) {
  const [rows] = await pool.query(
    `
    SELECT
      ${PLAYLIST_ID_COL}   AS id,
      ${PLAYLIST_NAME_COL} AS name,
      ${PLAYLIST_IS_PUBLIC_COL} AS isPublic,
      note                 AS note
    FROM ${PLAYLISTS_TABLE}
    WHERE ${PLAYLIST_USER_ID_COL} = ?
    ORDER BY ${PLAYLIST_ID_COL} DESC
    `,
    [userId]
  );
  return rows;
}

// POST /playlists
export async function createPlaylist({ userId, name, isPublic = true, note = "" }) {
  const [result] = await pool.query(
    `
    INSERT INTO ${PLAYLISTS_TABLE}
      (${PLAYLIST_USER_ID_COL}, ${PLAYLIST_NAME_COL}, ${PLAYLIST_IS_PUBLIC_COL}, note)
    VALUES (?, ?, ?, ?)
    `,
    [userId, name, isPublic ? 1 : 0, note]
  );

  return {
    id: result.insertId,
    name,
    isPublic,
    note,
  };
}

// PATCH /playlists/:id  (이름 + 소개글까지 수정 가능하게)
export async function updatePlaylist(id, { name, note, isPublic }) {
  await pool.query(
    `
    UPDATE ${PLAYLISTS_TABLE}
    SET
      ${PLAYLIST_NAME_COL}   = ?,
      note                   = ?,
      ${PLAYLIST_IS_PUBLIC_COL} = ?
    WHERE ${PLAYLIST_ID_COL} = ?
    `,
    [name, note ?? "", isPublic ? 1 : 0, id]
  );

  return { id, name, note, isPublic };
}

// 제목/가수 이름으로 검색 (플레이리스트 검색에서 사용)
export async function searchSongs({ q }) {
  const like = `%${q}%`;

  const [rows] = await pool.query(
    `
    SELECT
      s.song_id AS id,
      s.title,
      GROUP_CONCAT(
        DISTINCT a.name
        ORDER BY sa.display_order
        SEPARATOR ', '
      ) AS artistName
    FROM songs AS s
    LEFT JOIN song_artists AS sa
      ON sa.song_id = s.song_id
    LEFT JOIN artists AS a
      ON a.artist_id = sa.artist_id
    WHERE s.title LIKE ? OR a.name LIKE ?
    GROUP BY s.song_id, s.title
    ORDER BY s.song_id ASC
    `,
    [like, like]
  );

  return rows;
}


export async function searchPublicPlaylists({ q, viewerId }) {
  const params = [];
  let where = `WHERE p.${PLAYLIST_IS_PUBLIC_COL} = 1`;

  if (q && q.trim()) {
    where += ` AND (p.${PLAYLIST_NAME_COL} LIKE ? OR p.note LIKE ?)`;
    const like = `%${q.trim()}%`;
    params.push(like, like);
  }

  // viewerId 파라미터 추가
  params.push(viewerId);

  const [rows] = await pool.query(
    `
    SELECT
      p.${PLAYLIST_ID_COL}      AS id,
      p.${PLAYLIST_NAME_COL}    AS name,
      p.note                    AS note,
      u.nickname                AS ownerNickname,
      COUNT(DISTINCT pi.${ITEM_ID_COL}) AS trackCount,
      COALESCE(f.followers, 0)  AS followerCount,
      
      -- 내 팔로우 여부 확인
      MAX(CASE WHEN my_f.follower_id IS NOT NULL THEN 1 ELSE 0 END) AS isFollowed

    FROM ${PLAYLISTS_TABLE} p
    JOIN ${USERS_TABLE} u ON u.${USER_ID_COL} = p.${PLAYLIST_USER_ID_COL}
    LEFT JOIN ${PLAYLIST_ITEMS_TABLE} pi ON pi.${ITEM_PLAYLIST_ID_COL} = p.${PLAYLIST_ID_COL}
    
    -- 전체 팔로워 수 집계
    LEFT JOIN (
      SELECT following_id, COUNT(*) as followers
      FROM ${FOLLOWS_TABLE} WHERE target_type = 'playlist' GROUP BY following_id
    ) f ON f.following_id = p.${PLAYLIST_ID_COL}

    -- 내 팔로우 정보 조인
    LEFT JOIN ${FOLLOWS_TABLE} my_f 
      ON my_f.following_id = p.${PLAYLIST_ID_COL} 
      AND my_f.target_type = 'playlist'
      AND my_f.follower_id = ?

    ${where}
    GROUP BY p.${PLAYLIST_ID_COL}
    ORDER BY p.${PLAYLIST_ID_COL} DESC
    `,
    params
  );

  return rows;
}

// 팔로우 수 기준 상위 공개 플레이리스트
export async function getPopularPublicPlaylists({ limit = 50, viewerId } = {}) {
  const [rows] = await pool.query(
    `
    SELECT
      p.${PLAYLIST_ID_COL}      AS id,
      p.${PLAYLIST_NAME_COL}    AS name,
      p.note                    AS note,
      u.nickname                AS ownerNickname,
      COUNT(DISTINCT pi.${ITEM_ID_COL}) AS trackCount,
      COALESCE(f.followers, 0)  AS followerCount,

      -- 내 팔로우 여부 확인
      MAX(CASE WHEN my_f.follower_id IS NOT NULL THEN 1 ELSE 0 END) AS isFollowed

    FROM ${PLAYLISTS_TABLE} p
    JOIN ${USERS_TABLE} u ON u.${USER_ID_COL} = p.${PLAYLIST_USER_ID_COL}
    LEFT JOIN ${PLAYLIST_ITEMS_TABLE} pi ON pi.${ITEM_PLAYLIST_ID_COL} = p.${PLAYLIST_ID_COL}
    
    LEFT JOIN (
      SELECT following_id, COUNT(*) as followers
      FROM ${FOLLOWS_TABLE} WHERE target_type = 'playlist' GROUP BY following_id
    ) f ON f.following_id = p.${PLAYLIST_ID_COL}

    -- 내 팔로우 정보 조인
    LEFT JOIN ${FOLLOWS_TABLE} my_f 
      ON my_f.following_id = p.${PLAYLIST_ID_COL} 
      AND my_f.target_type = 'playlist'
      AND my_f.follower_id = ?

    WHERE p.${PLAYLIST_IS_PUBLIC_COL} = 1
    GROUP BY p.${PLAYLIST_ID_COL}
    ORDER BY followerCount DESC, p.${PLAYLIST_ID_COL} DESC
    LIMIT ?
    `,
    [viewerId, limit]
  );

  return rows;
}

// DELETE /playlists/:id
export async function deletePlaylist(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      `
      DELETE FROM ${PLAYLIST_ITEMS_TABLE}
      WHERE ${ITEM_PLAYLIST_ID_COL} = ?
      `,
      [id]
    );

    await conn.query(
      `
      DELETE FROM ${PLAYLISTS_TABLE}
      WHERE ${PLAYLIST_ID_COL} = ?
      `,
      [id]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// --------------------------------------------------------------------
// Playlist Items
// --------------------------------------------------------------------

// GET /playlists/:id/items

export async function getPlaylistItems(playlistId) {
  const [rows] = await pool.query(
    `
      SELECT
        pi.item_id                                                     AS id,
        pi.playlist_id,
        pi.song_id                                                     AS songId,
        pi.position,
        pi.added_at,
        s.title                                                        AS songTitle,
        -- 🔽 가수 이름 (여러 명이면 ', '로 합치기)
        GROUP_CONCAT(DISTINCT a.name ORDER BY sa.display_order SEPARATOR ', ')
          AS artistName
      FROM playlist_items AS pi
      JOIN songs AS s
        ON s.song_id = pi.song_id
      LEFT JOIN song_artists AS sa
        ON sa.song_id = s.song_id
      LEFT JOIN artists AS a
        ON a.artist_id = sa.artist_id
      WHERE pi.playlist_id = ?
      GROUP BY
        pi.item_id,
        pi.playlist_id,
        pi.song_id,
        pi.position,
        pi.added_at,
        s.title
      ORDER BY pi.position ASC
    `,
    [playlistId]
  );

  return rows;
}

// POST /playlists/:id/items
export async function addPlaylistItem({ playlistId, songId }) {
  const [existing] = await pool.query(
    `
    SELECT ${ITEM_ID_COL} AS id
    FROM ${PLAYLIST_ITEMS_TABLE}
    WHERE ${ITEM_PLAYLIST_ID_COL} = ? AND ${ITEM_SONG_ID_COL} = ?
    `,
    [playlistId, songId]
  );
  if (existing.length > 0) {
    throw new Error("이미 이 플레이리스트에 있는 곡입니다.");
  }

  const [posRows] = await pool.query(
    `
    SELECT COALESCE(MAX(${ITEM_POSITION_COL}), 0) AS maxPos
    FROM ${PLAYLIST_ITEMS_TABLE}
    WHERE ${ITEM_PLAYLIST_ID_COL} = ?
    `,
    [playlistId]
  );
  const nextPos = (posRows[0]?.maxPos || 0) + 1;

  const [result] = await pool.query(
    `
    INSERT INTO ${PLAYLIST_ITEMS_TABLE}
      (${ITEM_PLAYLIST_ID_COL}, ${ITEM_SONG_ID_COL}, ${ITEM_POSITION_COL})
    VALUES (?, ?, ?)
    `,
    [playlistId, songId, nextPos]
  );

  return {
    id: result.insertId,
    playlistId,
    songId,
    position: nextPos,
  };
}

// DELETE /playlists/:playlistId/items/:itemId
export async function deletePlaylistItem(id) {
  await pool.query(
    `
    DELETE FROM ${PLAYLIST_ITEMS_TABLE}
    WHERE ${ITEM_ID_COL} = ?
    `,
    [id]
  );
}

// --------------------------------------------------------------------
// Charts  (READ-ONLY)
// --------------------------------------------------------------------

// GET /charts
export async function getCharts() {
  // 1) SQL은 그냥 * 으로 다 가져오고
  const [rows] = await pool.query(
    `
    SELECT *
    FROM ${CHARTS_TABLE}
    ORDER BY year DESC, week DESC, \`rank\` ASC
    `
  );

  // 2) 자바스크립트 쪽에서 필요한 이름으로 바꿔서 리턴
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

// GET /songs/:id/charts - 특정 노래의 차트 기록
export async function getSongCharts(songId) {
  const [rows] = await pool.query(
    `
    SELECT
      chart_id AS id,
      chart_type AS chartType,
      year,
      week,
      \`rank\` AS rank,
      week_start_date AS weekStartDate,
      week_end_date AS weekEndDate
    FROM ${CHARTS_TABLE}
    WHERE song_id = ?
    ORDER BY year DESC, week DESC
    `,
    [songId]
  );

  return rows;
}

// GET /songs/:id/recommendations - 특정 노래와 같은 차트 기간에 올랐던 곡들 추천
export async function getRecommendedSongs(songId) {
  try {
    // 1) 해당 곡이 올랐던 차트 기간들 조회
    const [chartPeriods] = await pool.query(
      `
      SELECT DISTINCT year, week
      FROM ${CHARTS_TABLE}
      WHERE song_id = ?
      LIMIT 5
      `,
      [songId]
    );

    if (chartPeriods.length === 0) {
      return [];
    }

    // 2) 같은 차트 기간에 올랐던 다른 곡들 조회
    const placeholders = chartPeriods.map(() => "(c.year = ? AND c.week = ?)").join(" OR ");
    const params = [];
    chartPeriods.forEach((period) => {
      params.push(period.year, period.week);
    });
    params.push(songId); // WHERE song_id != ?

    const [recommendedRows] = await pool.query(
      `
      SELECT DISTINCT
        s.song_id AS id,
        s.title,
        a.name AS artistName,
        COUNT(DISTINCT (c.year * 100 + c.week)) AS chartCount
      FROM ${CHARTS_TABLE} c
      JOIN ${SONGS_TABLE} s ON c.song_id = s.song_id
      LEFT JOIN ${SONG_ARTISTS_TABLE} sa ON s.song_id = sa.song_id
      LEFT JOIN ${ARTISTS_TABLE} a ON sa.artist_id = a.artist_id
      WHERE (${placeholders})
      AND c.song_id != ?
      GROUP BY s.song_id, s.title, a.name
      ORDER BY chartCount DESC, s.song_id DESC
      LIMIT 10
      `,
      params
    );

    return recommendedRows;
  } catch (error) {
    console.error(`❌ [getRecommendedSongs] Error:`, error.message);
    throw error;
  }
}

// --------------------------------------------------------------------
// Follows  (READ-ONLY 목록용)
// --------------------------------------------------------------------

// GET /follows
export async function getFollows() {
  const [rows] = await pool.query(`
    SELECT follower_id AS followerId, following_id AS followingId, created_at AS createdAt
    FROM ${FOLLOWS_TABLE} ORDER BY created_at DESC
  `);
  return rows;
}

// 유저/아티스트 찾기 헬퍼
export async function findUserByEmail(email) {
  const [rows] = await pool.query(
    "SELECT user_id AS id, email, nickname FROM users WHERE email = ?",
    [email]
  );
  return rows[0] || null;
}

export async function findUserByNickname(nickname) {
  const [rows] = await pool.query(
    "SELECT user_id AS id FROM users WHERE nickname = ?",
    [nickname]
  );
  return rows[0] || null;
}

// 검색 기능 (LIKE) 적용됨
export async function findArtistByName(name) {
  const trimmed = name.trim();
  const searchNorm = trimmed.toLowerCase().replace(/\s+/g, "");

  const [exactRows] = await pool.query(
    "SELECT artist_id AS id, name FROM artists WHERE name = ? OR name_norm = ?",
    [trimmed, searchNorm]
  );
  if (exactRows.length > 0) return exactRows[0];

  const [likeRows] = await pool.query(
    "SELECT artist_id AS id, name FROM artists WHERE name LIKE ? OR name_norm LIKE ? LIMIT 1",
    [`%${trimmed}%`, `%${searchNorm}%`]
  );

  return likeRows[0] || null;
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

export async function getMyFollows(followerId) {
  const query = `
    SELECT 
      f.following_id AS following_id,
      f.target_type  AS target_type,
      f.created_at   AS created_at,
      CASE 
        WHEN f.target_type = 'user' THEN u.nickname 
        WHEN f.target_type = 'artist' THEN a.name 
        WHEN f.target_type = 'playlist' THEN p.name 
      END AS target_name,
      
      -- 🔹 플레이리스트일 경우 작성자(owner) ID가 필요함 (클릭 시 이동 위해)
      CASE
        WHEN f.target_type = 'playlist' THEN p.user_id
        ELSE NULL
      END AS owner_id

    FROM follows f
    LEFT JOIN users u ON f.following_id = u.user_id AND f.target_type = 'user'
    LEFT JOIN artists a ON f.following_id = a.artist_id AND f.target_type = 'artist'
    LEFT JOIN playlists p ON f.following_id = p.playlist_id AND f.target_type = 'playlist'
    WHERE f.follower_id = ?
    ORDER BY f.created_at DESC
  `;
  const [rows] = await pool.query(query, [followerId]);
  return rows;
}

// 추천 목록
export async function getRecommendations(myEmail) {
  const [users] = await pool.query(
    "SELECT user_id AS userId, nickname, email FROM users WHERE email != ? ORDER BY created_at DESC LIMIT 5",
    [myEmail || ""]
  );
  const [artists] = await pool.query(
    "SELECT artist_id AS artistId, name FROM artists ORDER BY created_at DESC LIMIT 5"
  );
  return { users, artists };
}

// [backend/src/store/db.mysql.js] 맨 아래에 추가

// 🔍 팔로우 대상 검색 (유저+아티스트)
export async function searchFollowTargets(keyword) {
  const like = `%${keyword}%`;
  
  const [users] = await pool.query(
    `SELECT user_id as id, nickname as name, 'user' as type 
     FROM users 
     WHERE nickname LIKE ? 
     LIMIT 5`,
    [like]
  );

  const [artists] = await pool.query(
    `SELECT artist_id as id, name, 'artist' as type 
     FROM artists 
     WHERE name LIKE ? 
     LIMIT 5`,
    [like]
  );

  return [...users, ...artists];
}

// --------------------------------------------------------------------
// Play History (READ-ONLY)
// --------------------------------------------------------------------

// 검색용 모든 노래 가져오기 (가수 이름 포함)
export async function getAllSongsForHistory() {
  const [rows] = await pool.query(`
    SELECT 
      s.song_id AS song_id, 
      s.title, 
      a.name AS artist 
    FROM songs s
    JOIN song_artists sa ON s.song_id = sa.song_id AND (sa.display_order = 1 OR sa.display_order IS NULL)
    JOIN artists a ON sa.artist_id = a.artist_id
    ORDER BY s.title ASC
  `);
  return rows;
}

// 재생 기록 저장 + 조회수 증가 (트랜잭션)
export async function addPlayHistory(userId, songId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 기록 저장
    await conn.query(
      "INSERT INTO play_history (user_id, song_id) VALUES (?, ?)",
      [userId, songId]
    );

    // 조회수 증가
    await conn.query(
      "UPDATE songs SET play_count = play_count + 1 WHERE song_id = ?",
      [songId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// 내 재생 기록 조회 (최신순 20개)
export async function getMyPlayHistory(userId) {
  const [rows] = await pool.query(
    `
    SELECT 
      h.played_at, 
      s.title, 
      a.name AS artist_name
    FROM play_history h
    JOIN songs s ON h.song_id = s.song_id
    JOIN song_artists sa ON s.song_id = sa.song_id AND (sa.display_order = 1 OR sa.display_order IS NULL)
    JOIN artists a ON sa.artist_id = a.artist_id
    WHERE h.user_id = ?
    ORDER BY h.played_at DESC
    LIMIT 20
  `,
    [userId]
  );
  return rows;
}

// --------------------------------------------------------------------
// Users (READ-ONLY)
// --------------------------------------------------------------------

// GET /users
export async function getUsers() {
  const [rows] = await pool.query(
    `
    SELECT
      ${USER_ID_COL}   AS id,
      email,
      nickname,
      created_at    AS createdAt,
      last_login_at AS lastLoginAt
    FROM ${USERS_TABLE}
    ORDER BY ${USER_ID_COL} ASC
    `
  );
  return rows;
}

// PATCH /users/:id - 닉네임 변경
export async function updateUser(userId, { nickname }) {
  const trimmed = nickname ? nickname.trim() : null;

  const [result] = await pool.query(
    `
    UPDATE ${USERS_TABLE}
    SET nickname = ?
    WHERE ${USER_ID_COL} = ?
    `,
    [trimmed, userId]
  );

  if (result.affectedRows === 0) {
    throw new Error("User not found");
  }

  // 업데이트된 사용자 정보 반환
  const [rows] = await pool.query(
    `
    SELECT
      ${USER_ID_COL}   AS id,
      email,
      nickname,
      created_at    AS createdAt,
      last_login_at AS lastLoginAt
    FROM ${USERS_TABLE}
    WHERE ${USER_ID_COL} = ?
    `,
    [userId]
  );

  return rows[0];
}

// PATCH /users/:id/password - 비밀번호 변경
export async function updateUserPassword(userId, { newPasswordHash }) {
  const [result] = await pool.query(
    `
    UPDATE ${USERS_TABLE}
    SET password_hash = ?
    WHERE ${USER_ID_COL} = ?
    `,
    [newPasswordHash, userId]
  );

  if (result.affectedRows === 0) {
    throw new Error("User not found");
  }

  return { id: userId, message: "비밀번호가 변경되었습니다." };
}

// GET password_hash 조회 (비밀번호 확인용)
export async function getUserPasswordHash(userId) {
  const [rows] = await pool.query(
    `
    SELECT password_hash
    FROM ${USERS_TABLE}
    WHERE ${USER_ID_COL} = ?
    `,
    [userId]
  );

  if (rows.length === 0) {
    throw new Error("User not found");
  }

  return rows[0].password_hash;
}

// === 플레이리스트 팔로우 여부 체크 ===
export async function checkFollow(followerId, followingId, targetType) {
  const [rows] = await pool.query(
    "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ? AND target_type = ?",
    [followerId, followingId, targetType]
  );
  return rows.length > 0;
}

// === 특정 유저의 공개 플레이리스트 조회 (UserPage용) ===
export async function getPublicPlaylistsByUserId(userId, viewerId) {
  const [rows] = await pool.query(
    `
    SELECT
      p.${PLAYLIST_ID_COL}      AS id,
      p.${PLAYLIST_NAME_COL}    AS name,
      p.note                    AS note,
      u.nickname                AS ownerNickname,
      COUNT(DISTINCT pi.${ITEM_ID_COL}) AS trackCount,
      COALESCE(f.followers, 0)  AS followerCount,
      
      -- 🔹 [추가] 내가 팔로우했는지 여부 (1이면 true, 0이면 false)
      MAX(CASE WHEN my_f.follower_id IS NOT NULL THEN 1 ELSE 0 END) AS isFollowed

    FROM ${PLAYLISTS_TABLE} p
    JOIN ${USERS_TABLE} u ON u.${USER_ID_COL} = p.${PLAYLIST_USER_ID_COL}
    LEFT JOIN ${PLAYLIST_ITEMS_TABLE} pi ON pi.${ITEM_PLAYLIST_ID_COL} = p.${PLAYLIST_ID_COL}
    LEFT JOIN (
      SELECT following_id, COUNT(*) as followers
      FROM follows WHERE target_type = 'playlist' GROUP BY following_id
    ) f ON f.following_id = p.${PLAYLIST_ID_COL}
    
    -- 🔹 [추가] 내 팔로우 정보 확인용 조인
    LEFT JOIN follows my_f 
      ON my_f.following_id = p.${PLAYLIST_ID_COL} 
      AND my_f.follower_id = ? 
      AND my_f.target_type = 'playlist'

    WHERE p.${PLAYLIST_USER_ID_COL} = ? AND p.${PLAYLIST_IS_PUBLIC_COL} = 1
    GROUP BY p.${PLAYLIST_ID_COL}
    ORDER BY p.${PLAYLIST_ID_COL} DESC
    `,
    [viewerId, userId] 
  );
  return rows;
}

export async function getPlaylistOwnerId(playlistId) {
  const [rows] = await pool.query(
    `SELECT ${PLAYLIST_USER_ID_COL} AS userId FROM ${PLAYLISTS_TABLE} WHERE ${PLAYLIST_ID_COL} = ?`,
    [playlistId]
  );
  return rows[0]?.userId || null;
}