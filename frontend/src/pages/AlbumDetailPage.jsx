// frontend/src/pages/AlbumDetailPage.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchJson } from "../lib/http";
import { API } from "../lib/api";

export default function AlbumDetailPage() {
    const { id } = useParams(); // URL에서 앨범 ID 가져오기
    const [album, setAlbum] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        try {
            setLoading(true);
            const [albumData, tracksData] = await Promise.all([
                fetchJson(`${API}/albums/${id}`),       // 앨범 정보
                fetchJson(`${API}/albums/${id}/tracks`) // 수록곡
            ]);
            setAlbum(albumData);
            setTracks(tracksData);
        } catch (e) {
            alert("앨범 정보를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }

    // 재생 핸들러
    async function handlePlay(songId, title) {
        try {
            await fetchJson(`${API}/play-history`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ song_id: songId }),
            });
            alert(`🎵 '${title}' 재생 시작!`);
        } catch (err) {
            alert("오류 발생");
        }
    }

    if (loading) return <div style={{ padding: 20 }}>로딩 중...</div>;
    if (!album) return <div style={{ padding: 20 }}>앨범이 없습니다.</div>;

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
            {/* 앨범 헤더 정보 */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "30px", alignItems: "center" }}>
                <div style={{
                    width: "120px", height: "120px",
                    backgroundColor: "#ddd", borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "2rem"
                }}>
                    💿
                </div>
                <div>
                    <h1 style={{ margin: "0 0 10px 0" }}>{album.title}</h1>
                    <p style={{ margin: 0, color: "#666", fontSize: "1.1rem" }}>
                        {album.artistName} · {album.year}
                    </p>
                </div>
            </div>

            {/* 수록곡 리스트 */}
            <div className="card" style={{ padding: 20, backgroundColor: "white", borderRadius: 12 }}>
                <h3 style={{ marginTop: 0, borderBottom: "1px solid #eee", paddingBottom: 10 }}>
                    수록곡 <span style={{ fontSize: "0.9rem", color: "#888" }}>{tracks.length}곡</span>
                </h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {tracks.map((track, idx) => (
                        <li key={track.id} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "12px 0", borderBottom: "1px solid #f9f9f9"
                        }}>
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <span style={{ width: "30px", color: "#ccc", textAlign: "center" }}>{idx + 1}</span>
                                <div>
                                    <strong style={{ fontSize: "1rem" }}>{track.title}</strong>
                                    <div style={{ fontSize: "0.85rem", color: "#888" }}>{track.artistName}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => handlePlay(track.id, track.title)}
                                style={{
                                    border: "none", background: "#ff4757", color: "white",
                                    borderRadius: "20px", padding: "5px 15px", cursor: "pointer"
                                }}
                            >
                                ▶ 재생
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}