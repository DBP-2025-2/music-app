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
 * - playlists(playlist_id, user_id, name, is_public, created_at, updated_at, note)
 * - playlist_items(item_id, playlist_id, song_id, position, note, added_at)
 * - charts(chart_id, chart_type, year, week, rank, song_id, week_start_date, week_end_date)
 * - follows(follower_id, following_id, target_type, created_at)
 * - play_history(history_id, user_id, song_id, played_at)
 * - users(user_id, email, password_hash, nickname, created_at, last_login_at)
 * - likes(like_id, user_id, song_id, created_at)
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

// 🔥 확장된 Artists 목록 (팔로워 수, 차트 집계, 대표곡, 곡 좋아요 기반)
export async function getArtists() {
  const [rows] = await pool.query(
    `
    WITH song_stats AS (
      SELECT
        s.${SONG_ID_COL}                AS song_id,
        s.${SONG_TITLE_COL}             AS title,
        sa.${SA_ARTIST_ID_COL}          AS artist_id,
        COALESCE(l.total_likes, 0)      AS total_likes,
        COALESCE(c.weeks_on_chart, 0)   AS weeks_on_chart,
        ROW_NUMBER() OVER (
          PARTITION BY sa.${SA_ARTIST_ID_COL}
          ORDER BY
            COALESCE(l.total_likes, 0)    DESC,  -- 1순위: 좋아요 많은 순
            COALESCE(c.weeks_on_chart, 0) DESC,  -- 2순위: 차트 주 수 많은 순
            s.${SONG_ID_COL}             ASC    -- 3순위: song_id 작은 순
        ) AS rn
      FROM ${SONGS_TABLE} s
      JOIN ${SONG_ARTISTS_TABLE} sa
        ON sa.${SA_SONG_ID_COL} = s.${SONG_ID_COL}
       AND (sa.${SA_DISPLAY_ORDER_COL} = 1 OR sa.${SA_DISPLAY_ORDER_COL} IS NULL)

      -- 곡별 총 좋아요 수
      LEFT JOIN (
        SELECT
          song_id,
          COUNT(DISTINCT like_id) AS total_likes
        FROM likes
        GROUP BY song_id
      ) l
        ON l.song_id = s.${SONG_ID_COL}

      -- 곡별 차트 인 주 수
      LEFT JOIN (
        SELECT
          song_id,
          COUNT(*) AS weeks_on_chart
        FROM ${CHARTS_TABLE}
        GROUP BY song_id
      ) c
        ON c.song_id = s.${SONG_ID_COL}
    )

    SELECT
      a.${ARTIST_ID_COL}         AS id,
      a.${ARTIST_NAME_COL}       AS name,

      -- 팔로워 수
      COALESCE(f.followers, 0)   AS followCount,

      -- 아티스트 전체 차트 인 주 수, TOP10 진입 횟수
      COALESCE(ca.chart_weeks, 0)       AS chartWeeks,
      COALESCE(ca.top10_appearances, 0) AS top10Appearances,

      -- 대표곡 제목
      ss.title                   AS repSongTitle

    FROM ${ARTISTS_TABLE} a

    -- 아티스트별 차트 집계 (주 수 / TOP10 횟수)
    LEFT JOIN (
      SELECT
        sa.${SA_ARTIST_ID_COL} AS artist_id,
        COUNT(DISTINCT CONCAT(c.year, '-', c.week)) AS chart_weeks,
        SUM(CASE WHEN c.rank <= 10 THEN 1 ELSE 0 END) AS top10_appearances
      FROM ${CHARTS_TABLE} c
      JOIN ${SONGS_TABLE} s
        ON s.${SONG_ID_COL} = c.song_id
      JOIN ${SONG_ARTISTS_TABLE} sa
        ON sa.${SA_SONG_ID_COL} = s.${SONG_ID_COL}
       AND (sa.${SA_DISPLAY_ORDER_COL} = 1 OR sa.${SA_DISPLAY_ORDER_COL} IS NULL)
      GROUP BY sa.${SA_ARTIST_ID_COL}
    ) ca
      ON ca.artist_id = a.${ARTIST_ID_COL}

    -- 아티스트 팔로워 수
    LEFT JOIN (
      SELECT
        following_id,
        COUNT(DISTINCT follower_id) AS followers
      FROM ${FOLLOWS_TABLE}
      WHERE target_type = 'artist'
      GROUP BY following_id
    ) f
      ON f.following_id = a.${ARTIST_ID_COL}

    -- 대표곡(아티스트별 1위 곡) 조인
    LEFT JOIN song_stats ss
      ON ss.artist_id = a.${ARTIST_ID_COL}
     AND ss.rn = 1

    ORDER BY a.${ARTIST_ID_COL} DESC
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

// GET /albums  (YEAR(created_at)를 year로 사용, 아티스트 이름 포함)
export async function getAlbums() {
  const [rows] = await pool.query(
    `
    SELECT
      al.${ALBUM_ID_COL}     AS id,
      al.${ALBUM_TITLE_COL}  AS title,
      al.${ALBUM_CREATED_AT_COL} AS created_at,
      al.${ALBUM_ARTIST_ID_COL} AS artistId,
      ar.${ARTIST_NAME_COL}  AS artist_name,
      YEAR(al.${ALBUM_CREATED_AT_COL}) AS year
    FROM ${ALBUMS_TABLE} al
    LEFT JOIN ${ARTISTS_TABLE} ar
      ON ar.${ARTIST_ID_COL} = al.${ALBUM_ARTIST_ID_COL}
    ORDER BY al.${ALBUM_CREATED_AT_COL} DESC, al.${ALBUM_ID_COL} DESC
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

// 🔥 확장된 GET /songs (좋아요/유저 좋아요 여부 + artistName 포함)
// GET /songs 또는 /songs?artistId=...&q=...
export async function getSongs({ artistId, q, userId } = {}) {
  const params = [];
  const where = [];

  // 1번째 파라미터: 현재 로그인 유저 id (없으면 null)
  params.push(userId ?? null);

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
      s.${SONG_ID_COL}              AS id,
      s.${SONG_TITLE_COL}           AS title,
      sa.${SA_ARTIST_ID_COL}        AS artistId,
      a.${ARTIST_NAME_COL}          AS artistName,

      -- 곡별 총 좋아요 수
      COALESCE(COUNT(DISTINCT l.like_id), 0) AS total_likes,

      -- 현재 유저가 좋아요 눌렀는지 (0/1)
      MAX(CASE WHEN l.user_id = ? THEN 1 ELSE 0 END) AS user_liked

    FROM ${SONGS_TABLE} s
    LEFT JOIN ${SONG_ARTISTS_TABLE} sa
      ON s.${SONG_ID_COL} = sa.${SA_SONG_ID_COL}
     AND (sa.${SA_DISPLAY_ORDER_COL} = 1 OR sa.${SA_DISPLAY_ORDER_COL} IS NULL)

    LEFT JOIN ${ARTISTS_TABLE} a
      ON a.${ARTIST_ID_COL} = sa.${SA_ARTIST_ID_COL}

    LEFT JOIN likes l
      ON l.song_id = s.${SONG_ID_COL}

    ${whereClause}

    GROUP BY
      s.${SONG_ID_COL},
      s.${SONG_TITLE_COL},
      sa.${SA_ARTIST_ID_COL},
      a.${ARTIST_NAME_COL}

    ORDER BY s.${SONG_ID_COL} DESC
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

// GET /playlists  → 내 플레이리스트 (노트 포함, 곡 수 포함)
export async function getPlaylists(userId) {
  const [rows] = await pool.query(
    `
    SELECT
      p.${PLAYLIST_ID_COL}          AS id,
      p.${PLAYLIST_USER_ID_COL}     AS user_id,
      p.${PLAYLIST_NAME_COL}        AS name,
      p.${PLAYLIST_IS_PUBLIC_COL}   AS isPublic,
      p.note                        AS note,
      p.created_at                  AS created_at,
      p.updated_at                  AS updated_at,
      COUNT(pi.${ITEM_ID_COL})      AS song_count
    FROM ${PLAYLISTS_TABLE} p
    LEFT JOIN ${PLAYLIST_ITEMS_TABLE} pi
      ON pi.${ITEM_PLAYLIST_ID_COL} = p.${PLAYLIST_ID_COL}
    WHERE p.${PLAYLIST_USER_ID_COL} = ?
    GROUP BY p.${PLAYLIST_ID_COL}
    ORDER BY p.created_at DESC, p.${PLAYLIST_ID_COL} DESC
    `,
    [userId]
  );

  return rows;
}

// POST /playlists
export async function createPlaylist({
  userId,
  name,
  isPublic = true,
  note = "",
}) {
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

// 제목/가수 이름으로 검색 (플레이리스트/검색 페이지에서 사용)
// 🔥 두 버전 합친 것: 제목 + 아티스트 이름 검색, 앨범 제목도 포함
export async function searchSongs({ q, userId } = {}) {
  const like = `%${q}%`;

  const [rows] = await pool.query(
    `
    SELECT
      s.song_id AS id,
      s.title,
      -- 아티스트 이름(대표/공동 포함)
      GROUP_CONCAT(
        DISTINCT a.name
        ORDER BY sa.display_order
        SEPARATOR ', '
      ) AS artistName,
      -- 앨범 제목
      al.title AS album_title
    FROM songs AS s
    LEFT JOIN albums AS al
      ON al.album_id = s.album_id
    LEFT JOIN song_artists AS sa
      ON sa.song_id = s.song_id
    LEFT JOIN artists AS a
      ON a.artist_id = sa.artist_id
    WHERE s.title LIKE ? OR a.name LIKE ?
    GROUP BY s.song_id, s.title, al.title
    ORDER BY s.song_id ASC
    `,
    [like, like]
  );

  return rows;
}

// 🔍 아티스트 검색
export async function searchArtists({ q }) {
  const like = `%${q}%`;

  const [rows] = await pool.query(
    `
    SELECT
      a.artist_id AS id,
      a.name      AS name,
      COALESCE(f.followCount, 0) AS followCount
    FROM artists a
    LEFT JOIN (
      SELECT
        following_id AS artist_id,
        COUNT(*)     AS followCount
      FROM follows
      WHERE target_type = 'artist'
      GROUP BY following_id
    ) f
      ON f.artist_id = a.artist_id
    WHERE a.name LIKE ? OR a.name_norm LIKE ?
    ORDER BY a.name_norm ASC, a.artist_id ASC
    `,
    [like, like]
  );

  return rows;
}

// 🔍 앨범 검색
export async function searchAlbums({ q }) {
  const like = `%${q}%`;

  const [rows] = await pool.query(
    `
    SELECT
      al.${ALBUM_ID_COL}       AS id,
      al.${ALBUM_TITLE_COL}    AS title,
      al.${ALBUM_CREATED_AT_COL} AS created_at,
      al.${ALBUM_ARTIST_ID_COL} AS artistId,
      ar.${ARTIST_NAME_COL}    AS artist_name,
      YEAR(al.${ALBUM_CREATED_AT_COL}) AS year
    FROM ${ALBUMS_TABLE} al
    LEFT JOIN ${ARTISTS_TABLE} ar
      ON ar.${ARTIST_ID_COL} = al.${ALBUM_ARTIST_ID_COL}
    WHERE al.${ALBUM_TITLE_COL} LIKE ? OR ar.${ARTIST_NAME_COL} LIKE ?
    ORDER BY al.${ALBUM_CREATED_AT_COL} DESC, al.${ALBUM_ID_COL} DESC
    `,
    [like, like]
  );

  return rows;
}

// 🔥 공개 플레이리스트 검색 (viewerId 기준 내 팔로우 여부 포함)
export async function searchPublicPlaylists({ q, viewerId }) {
  const params = [];
  let where = `WHERE p.${PLAYLIST_IS_PUBLIC_COL} = 1`;

  if (q && q.trim()) {
    where += ` AND (p.${PLAYLIST_NAME_COL} LIKE ? OR p.note LIKE ?)`;
    const like = `%${q.trim()}%`;
    params.push(like, like);
  }

  // viewerId param (없으면 null)
  params.push(viewerId ?? null);

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

// 🔥 팔로우 수 기준 상위 공개 플레이리스트 (viewerId 포함)
export async function getPopularPublicPlaylists({
  limit = 50,
  viewerId,
} = {}) {
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
    [viewerId ?? null, limit]
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
        -- 가수 이름 (여러 명이면 ', '로 합치기)
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
  const [rows] = await pool.query(
    `
    SELECT *
    FROM ${CHARTS_TABLE}
    ORDER BY year DESC, week DESC, \`rank\` ASC
    `
  );

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

// GET /songs/:id/charts - 특정 노래의 차트 기록 (chartRank alias 사용)
export async function getSongCharts(songId) {
  const [rows] = await pool.query(
    `
    SELECT
      chart_id AS id,
      chart_type AS chartType,
      year,
      week,
      \`rank\` AS chartRank,
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

    const placeholders = chartPeriods
      .map(() => "(c.year = ? AND c.week = ?)")
      .join(" OR ");
    const params = [];
    chartPeriods.forEach((period) => {
      params.push(period.year, period.week);
    });
    params.push(songId);

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

// GET /songs/popular - 차트에 가장 많이 오른 인기곡들
export async function getPopularSongs(limit = 10) {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        s.song_id AS id,
        s.title,
        a.name AS artistName,
        COUNT(*) AS chartCount
      FROM ${CHARTS_TABLE} c
      JOIN ${SONGS_TABLE} s ON c.song_id = s.song_id
      LEFT JOIN ${SONG_ARTISTS_TABLE} sa ON s.song_id = sa.song_id AND sa.display_order = 1
      LEFT JOIN ${ARTISTS_TABLE} a ON sa.artist_id = a.artist_id
      GROUP BY s.song_id, s.title, a.name
      ORDER BY chartCount DESC, s.song_id DESC
      LIMIT ?
      `,
      [limit]
    );
    return rows;
  } catch (error) {
    console.error(`❌ [getPopularSongs] Error:`, error.message);
    throw error;
  }
}

// --------------------------------------------------------------------
// Follows
// --------------------------------------------------------------------

// GET /follows (단순 전체 목록)
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

// 🔥 내 팔로우 목록 (user / artist / playlist + playlist owner_id 포함)
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
      
      -- 플레이리스트일 경우 작성자(owner) ID
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

// 추천 목록 (간단)
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
      
      -- 내가 팔로우했는지 여부
      MAX(CASE WHEN my_f.follower_id IS NOT NULL THEN 1 ELSE 0 END) AS isFollowed

    FROM ${PLAYLISTS_TABLE} p
    JOIN ${USERS_TABLE} u ON u.${USER_ID_COL} = p.${PLAYLIST_USER_ID_COL}
    LEFT JOIN ${PLAYLIST_ITEMS_TABLE} pi ON pi.${ITEM_PLAYLIST_ID_COL} = p.${PLAYLIST_ID_COL}
    LEFT JOIN (
      SELECT following_id, COUNT(*) as followers
      FROM follows WHERE target_type = 'playlist' GROUP BY following_id
    ) f ON f.following_id = p.${PLAYLIST_ID_COL}
    
    LEFT JOIN follows my_f 
      ON my_f.following_id = p.${PLAYLIST_ID_COL} 
      AND my_f.follower_id = ? 
      AND my_f.target_type = 'playlist'

    WHERE p.${PLAYLIST_USER_ID_COL} = ? AND p.${PLAYLIST_IS_PUBLIC_COL} = 1
    GROUP BY p.${PLAYLIST_ID_COL}
    ORDER BY p.${PLAYLIST_ID_COL} DESC
    `,
    [viewerId ?? null, userId]
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

    await conn.query(
      "INSERT INTO play_history (user_id, song_id) VALUES (?, ?)",
      [userId, songId]
    );

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
// Users
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

// --------------------------------------------------------------------
// Album 상세용 (상세 페이지)
// --------------------------------------------------------------------

// 1. 앨범 상세 정보 조회 (제목, 가수명, 연도 등)
export async function getAlbumById(albumId) {
  const [rows] = await pool.query(
    `
    SELECT 
      al.${ALBUM_ID_COL}    AS id,
      al.${ALBUM_TITLE_COL} AS title,
      YEAR(al.${ALBUM_CREATED_AT_COL}) AS year,
      ar.name               AS artistName
    FROM ${ALBUMS_TABLE} al
    LEFT JOIN ${ARTISTS_TABLE} ar ON al.${ALBUM_ARTIST_ID_COL} = ar.${ARTIST_ID_COL}
    WHERE al.${ALBUM_ID_COL} = ?
    `,
    [albumId]
  );
  return rows[0] || null;
}

// 2. 앨범 수록곡 조회
export async function getAlbumTracks(albumId) {
  const [rows] = await pool.query(
    `
    SELECT 
      s.${SONG_ID_COL}    AS id,
      s.${SONG_TITLE_COL} AS title,
      (SELECT GROUP_CONCAT(a.name SEPARATOR ', ')
       FROM ${SONG_ARTISTS_TABLE} sa
       JOIN ${ARTISTS_TABLE} a ON sa.${SA_ARTIST_ID_COL} = a.${ARTIST_ID_COL}
       WHERE sa.${SA_SONG_ID_COL} = s.${SONG_ID_COL}
       ORDER BY sa.${SA_DISPLAY_ORDER_COL} ASC) AS artistName
    FROM ${SONGS_TABLE} s
    WHERE s.${SONG_ALBUM_ID_COL} = ?
    ORDER BY s.${SONG_ID_COL} ASC
    `,
    [albumId]
  );
  return rows;
}
