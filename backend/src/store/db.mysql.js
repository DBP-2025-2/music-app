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

  // 아티스트 기준 필터
  if (artistId) {
    where.push(`sa.${SA_ARTIST_ID_COL} = ?`);
    params.push(artistId);
  }

  // 제목 검색 (title_norm 사용, 소문자로 비교)
  if (q) {
    where.push(`s.title_norm LIKE ?`);
    params.push(`%${q.toLowerCase()}%`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `
    SELECT
      s.${SONG_ID_COL}    AS id,
      s.${SONG_TITLE_COL} AS title,
      sa.${SA_ARTIST_ID_COL} AS artistId
    FROM ${SONGS_TABLE} s
    LEFT JOIN ${SONG_ARTISTS_TABLE} sa
      ON s.${SONG_ID_COL} = sa.${SA_SONG_ID_COL}
     AND (sa.${SA_DISPLAY_ORDER_COL} = 1 OR sa.${SA_DISPLAY_ORDER_COL} IS NULL)
    ${whereClause}
    ORDER BY s.${SONG_ID_COL} DESC
    LIMIT 50
    `,
    params
  );

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

// 지금은 로그인 기능이 없으니까, 임시로 user_id=1, is_public=1 사용
const DEFAULT_USER_ID = 1;

// GET /playlists
export async function getPlaylists() {
  const [rows] = await pool.query(
    `
    SELECT
      ${PLAYLIST_ID_COL}   AS id,
      ${PLAYLIST_NAME_COL} AS name
    FROM ${PLAYLISTS_TABLE}
    ORDER BY ${PLAYLIST_ID_COL} DESC
    `
  );
  return rows;
}

// POST /playlists
export async function createPlaylist({ name }) {
  const [result] = await pool.query(
    `
    INSERT INTO ${PLAYLISTS_TABLE}
      (${PLAYLIST_USER_ID_COL}, ${PLAYLIST_NAME_COL}, ${PLAYLIST_IS_PUBLIC_COL})
    VALUES (?, ?, 1)
    `,
    [DEFAULT_USER_ID, name]
  );

  return { id: result.insertId, name };
}

// PATCH /playlists/:id
export async function updatePlaylist(id, { name }) {
  await pool.query(
    `
    UPDATE ${PLAYLISTS_TABLE}
    SET ${PLAYLIST_NAME_COL} = ?
    WHERE ${PLAYLIST_ID_COL} = ?
    `,
    [name, id]
  );

  return { id, name };
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
      i.${ITEM_ID_COL}          AS id,
      i.${ITEM_PLAYLIST_ID_COL} AS playlistId,
      i.${ITEM_SONG_ID_COL}     AS songId,
      i.${ITEM_POSITION_COL}    AS position,
      s.${SONG_TITLE_COL}       AS songTitle
    FROM ${PLAYLIST_ITEMS_TABLE} i
    JOIN ${SONGS_TABLE} s
      ON i.${ITEM_SONG_ID_COL} = s.${SONG_ID_COL}
    WHERE i.${ITEM_PLAYLIST_ID_COL} = ?
    ORDER BY i.${ITEM_POSITION_COL} ASC, i.${ITEM_ID_COL} ASC
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

// --------------------------------------------------------------------
// Follows  (READ-ONLY 목록용)
// --------------------------------------------------------------------

// GET /follows
export async function getFollows() {
  const [rows] = await pool.query(`
    SELECT
      follower_id  AS followerId,
      following_id AS followingId,
      created_at   AS createdAt
    FROM follows
    ORDER BY created_at DESC
  `);
  return rows;
}

// --------------------------------------------------------------------
// Play History (READ-ONLY)
// --------------------------------------------------------------------

// GET /play-history
export async function getPlayHistory() {
  const [rows] = await pool.query(
    `
    SELECT
      ${HISTORY_ID_COL} AS id,
      user_id           AS userId,
      song_id           AS songId,
      played_at         AS playedAt
    FROM ${PLAY_HISTORY_TABLE}
    ORDER BY played_at DESC
    `
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
