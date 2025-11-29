
import { useEffect, useState } from "react";
import { API } from "../lib/api";
import { fetchJson } from "../lib/http";

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editNickname, setEditNickname] = useState("");
  const [saving, setSaving] = useState(false);

  // 비밀번호 변경 모달
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson(`${API}/users`);
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleEdit = (user) => {
    setEditId(user.id);
    setEditNickname(user.nickname || "");
  };

  const handleSave = async (userId) => {
    try {
      setSaving(true);
      const updated = await fetchJson(`${API}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: editNickname }),
      });
      setRows(rows.map((u) => (u.id === userId ? updated : u)));
      setEditId(null);
      setEditNickname("");
    } catch (err) {
      alert(err.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditId(null);
    setEditNickname("");
  };

  const handleOpenPasswordModal = (userId) => {
    setPasswordUserId(userId);
    setPasswordModalOpen(true);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSavePassword = async () => {
    if (!oldPassword.trim()) {
      alert("기존 비밀번호를 입력하세요.");
      return;
    }
    if (!newPassword.trim()) {
      alert("새 비밀번호를 입력하세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 6) {
      alert("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    try {
      setPasswordSaving(true);
      await fetchJson(`${API}/users/${passwordUserId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      alert("비밀번호가 성공적으로 변경되었습니다.");
      setPasswordModalOpen(false);
      setPasswordUserId(null);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      alert(err.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleClosePasswordModal = () => {
    setPasswordModalOpen(false);
    setPasswordUserId(null);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <section className="card">
      <div className="card-header">
        <div className="card-title">
          <span>🙋‍♀️</span>
          <span>
            Users <span className="card-badge">{rows.length.toString()}</span>
          </span>
        </div>
      </div>

      {loading && <p className="text-muted">불러오는 중...</p>}
      {error && (
        <p className="text-error">
          ⚠️ Error: <span>{error}</span>
        </p>
      )}

      <ul className="list">
        {rows.map((u) => (
          <li key={u.id} className="list-item">
            {editId === u.id ? (
              <div style={{ display: "flex", gap: 8, width: "100%" }}>
                <input
                  type="text"
                  className="field-input"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder="닉네임 입력"
                  style={{ flex: 1 }}
                />
                <button
                  className="btn primary"
                  onClick={() => handleSave(u.id)}
                  disabled={saving}
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
                <button
                  className="btn muted"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  취소
                </button>
              </div>
            ) : (
              <>
                <div style={{ flex: 1 }}>
                  <span>
                    <span className="text-muted">#{u.id} </span>
                    <strong>{u.nickname || u.email}</strong>
                    {u.nickname && (
                      <span className="text-muted"> ({u.email})</span>
                    )}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="text-muted">
                    가입: {u.createdAt && u.createdAt.substring(0, 10)}
                  </span>
                  <button className="btn ghost" onClick={() => handleEdit(u)}>
                    ✏️ 수정
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => handleOpenPasswordModal(u.id)}
                  >
                    🔒 비밀번호
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {/* 비밀번호 변경 모달 */}
      {passwordModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>🔒 비밀번호 변경</h3>

            <div style={{ marginBottom: 12 }}>
              <label className="field-label">기존 비밀번호</label>
              <input
                type="password"
                className="field-input"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="기존 비밀번호 입력"
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="field-label">새 비밀번호</label>
              <input
                type="password"
                className="field-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 입력 (최소 6자)"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="field-label">비밀번호 확인</label>
              <input
                type="password"
                className="field-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 확인"
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn primary"
                onClick={handleSavePassword}
                disabled={passwordSaving}
                style={{ flex: 1 }}
              >
                {passwordSaving ? "변경 중..." : "변경"}
              </button>
              <button
                className="btn muted"
                onClick={handleClosePasswordModal}
                disabled={passwordSaving}
                style={{ flex: 1 }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
