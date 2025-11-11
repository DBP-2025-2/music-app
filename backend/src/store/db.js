// backend/src/store/db.js (ESM 전체 교체본)

const nowId = () => Date.now() + Math.floor(Math.random() * 1000);

// --- 임시 데이터(배열) : 반드시 export보다 "위"에 선언 ---
const artists = [
  { id: 1, name: "IU" },
  { id: 2, name: "NewJeans" },
];

const songs = [
  { id: 101, title: "밤편지", artistId: 1 },
  { id: 102, title: "Ditto", artistId: 2 },
];

const albums = [
  { id: 201, title: "Palette", artistId: 1, year: 2017 },
  { id: 202, title: "New Jeans", artistId: 2, year: 2022 },
];

// ✅ 플레이리스트도 위에서 선언해야 함!
const playlists = [{ id: 301, name: "My Favorites" }];

const playlistItems = [
  // { id, playlistId, songId }
];

// --- 유틸 ---
const findArtist = (id) => artists.find((a) => a.id === id) || null;

// --- export default 객체 ---
export default {
  // ========== Artists ==========
  listArtists: () => artists,
  createArtist: (name) => {
    const item = { id: nowId(), name: name.trim() };
    artists.push(item);
    return item;
  },
  updateArtist: (id, name) => {
    const i = artists.findIndex((a) => a.id === id);
    if (i < 0) return null;
    artists[i].name = name.trim();
    return artists[i];
  },
  deleteArtist: (id) => {
    const i = artists.findIndex((a) => a.id === id);
    if (i < 0) return false;
    // 간단 연쇄 정리
    for (let j = songs.length - 1; j >= 0; j--)
      if (songs[j].artistId === id) songs.splice(j, 1);
    for (let j = albums.length - 1; j >= 0; j--)
      if (albums[j].artistId === id) albums.splice(j, 1);
    artists.splice(i, 1);
    return true;
  },
  findArtist, // 라우터에서 사용

  // ========== Songs ==========
  listSongs: ({ artistId } = {}) => {
    let data = songs;
    if (artistId)
      data = data.filter((s) => String(s.artistId) === String(artistId));
    return data;
  },
  createSong: ({ title, artistId }) => {
    const item = {
      id: nowId(),
      title: title.trim(),
      artistId: Number(artistId),
    };
    songs.push(item);
    return item;
  },
  updateSong: (id, { title, artistId }) => {
    const i = songs.findIndex((s) => s.id === id);
    if (i < 0) return null;
    if (title !== undefined) songs[i].title = String(title).trim();
    if (artistId !== undefined) songs[i].artistId = Number(artistId);
    return songs[i];
  },
  deleteSong: (id) => {
    const i = songs.findIndex((s) => s.id === id);
    if (i < 0) return false;
    songs.splice(i, 1);
    return true;
  },

  // ========== Albums ==========
  listAlbums: ({ artistId, year } = {}) => {
    let data = albums;
    if (artistId)
      data = data.filter((a) => String(a.artistId) === String(artistId));
    if (year) data = data.filter((a) => String(a.year) === String(year));
    return data;
  },
  createAlbum: ({ title, artistId, year }) => {
    const item = {
      id: nowId(),
      title: title.trim(),
      artistId: Number(artistId),
      year: year ? Number(year) : null,
    };
    albums.push(item);
    return item;
  },
  updateAlbum: (id, { title, artistId, year }) => {
    const i = albums.findIndex((a) => a.id === id);
    if (i < 0) return null;
    if (title !== undefined) albums[i].title = String(title).trim();
    if (artistId !== undefined) albums[i].artistId = Number(artistId);
    if (year !== undefined) albums[i].year = year === "" ? null : Number(year);
    return albums[i];
  },
  deleteAlbum: (id) => {
    const i = albums.findIndex((a) => a.id === id);
    if (i < 0) return false;
    albums.splice(i, 1);
    return true;
  },

  // ========== Playlists ==========
  listPlaylists: () => playlists,
  createPlaylist: (name) => {
    const item = { id: nowId(), name: name.trim() };
    playlists.push(item);
    return item;
  },
  updatePlaylist: (id, name) => {
    const i = playlists.findIndex((p) => p.id === id);
    if (i < 0) return null;
    playlists[i].name = name.trim();
    return playlists[i];
  },
  deletePlaylist: (id) => {
    const i = playlists.findIndex((p) => p.id === id);
    if (i < 0) return false;
    for (let j = playlistItems.length - 1; j >= 0; j--) {
      if (playlistItems[j].playlistId === id) playlistItems.splice(j, 1);
    }
    playlists.splice(i, 1);
    return true;
  },

  // ========== Playlist Items ==========
  listPlaylistItems: (playlistId) =>
    playlistItems.filter((x) => x.playlistId === playlistId),

  addPlaylistItem: ({ playlistId, songId }) => {
    const p = playlists.find((x) => x.id === playlistId);
    if (!p) return { error: "playlist not found" };
    const s = songs.find((x) => x.id === songId);
    if (!s) return { error: "song not found" };

    const dup = playlistItems.find(
      (x) => x.playlistId === playlistId && x.songId === songId
    );
    if (dup) return { error: "already exists" };

    const item = { id: nowId(), playlistId, songId };
    playlistItems.push(item);
    return { item };
  },

  removePlaylistItem: (itemId) => {
    const i = playlistItems.findIndex((x) => x.id === itemId);
    if (i < 0) return false;
    playlistItems.splice(i, 1);
    return true;
  },
};
