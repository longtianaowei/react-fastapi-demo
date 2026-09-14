import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createUser, deleteUser, getUsers } from "./api/user";
import type { User } from "./types/user";
import "./styles.css";

type Notice = { type: "success" | "error"; message: string } | null;

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "U";
}

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [form, setForm] = useState({ name: "", email: "" });

  async function load() {
    setIsLoading(true);
    setNotice(null);
    try {
      const response = await getUsers();
      setUsers(response.items);
    } catch {
      setNotice({ type: "error", message: "无法连接到服务，请确认后端已启动。" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    getUsers()
      .then((response) => {
        if (active) setUsers(response.items);
      })
      .catch(() => {
        if (active) setNotice({ type: "error", message: "无法连接到服务，请确认后端已启动。" });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    setIsSaving(true);
    setNotice(null);
    try {
      await createUser({ name: form.name.trim(), email: form.email.trim() });
      setForm({ name: "", email: "" });
      setShowForm(false);
      await load();
      setNotice({ type: "success", message: "用户已添加。" });
    } catch {
      setNotice({ type: "error", message: "添加失败，请稍后重试。" });
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(user: User) {
    if (!window.confirm(`确定删除 ${user.name} 吗？此操作无法撤销。`)) return;

    setDeletingId(user.id);
    setNotice(null);
    try {
      await deleteUser(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setNotice({ type: "success", message: "用户已删除。" });
    } catch {
      setNotice({ type: "error", message: "删除失败，请稍后重试。" });
    } finally {
      setDeletingId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword),
    );
  }, [query, users]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Northstar 首页">
          <span className="brand-mark">N</span>
          <span>Northstar</span>
        </a>
        <nav aria-label="主导航">
          <a className="nav-item active" href="#users">
            <span className="nav-icon" aria-hidden="true">◎</span>
            用户管理
          </a>
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot" />
          系统运行正常
        </div>
      </aside>

      <main className="main" id="top">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">N</span>Northstar</div>
          <div className="account">
            <div className="account-copy"><strong>管理员</strong><span>admin@example.com</span></div>
            <span className="avatar avatar-dark">AD</span>
          </div>
        </header>

        <div className="page" id="users">
          <section className="page-heading">
            <div>
              <p className="eyebrow">工作空间 / 用户</p>
              <h1>用户管理</h1>
              <p className="subtitle">查看、搜索并管理系统中的用户账户。</p>
            </div>
            <button className="primary-button" onClick={() => setShowForm(true)}>
              <span aria-hidden="true">＋</span> 新增用户
            </button>
          </section>

          <section className="stats" aria-label="用户概览">
            <div className="stat-item"><span>用户总数</span><strong>{users.length}</strong><small>当前已录入账户</small></div>
            <div className="stat-item"><span>搜索结果</span><strong>{filteredUsers.length}</strong><small>{query ? "匹配当前关键词" : "显示全部用户"}</small></div>
            <div className="stat-item stat-accent"><span>服务状态</span><strong>{notice?.type === "error" ? "异常" : "正常"}</strong><small><i className="status-dot" /> API 服务</small></div>
          </section>

          {notice && (
            <div className={`notice ${notice.type}`} role="status">
              <span>{notice.type === "success" ? "✓" : "!"}</span>
              {notice.message}
              <button aria-label="关闭提示" onClick={() => setNotice(null)}>×</button>
            </div>
          )}

          <section className="data-panel">
            <div className="panel-toolbar">
              <div>
                <h2>全部用户</h2>
                <p>共 {users.length} 位用户</p>
              </div>
              <label className="search">
                <span aria-hidden="true">⌕</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索姓名或邮箱" aria-label="搜索用户" />
                {query && <button onClick={() => setQuery("")} aria-label="清除搜索">×</button>}
              </label>
            </div>

            <div className="table-wrap">
              {isLoading ? (
                <div className="state"><span className="spinner" /><strong>正在加载用户</strong><p>请稍候片刻</p></div>
              ) : filteredUsers.length === 0 ? (
                <div className="state"><span className="empty-icon">⌕</span><strong>{query ? "没有匹配的用户" : "还没有用户"}</strong><p>{query ? "请尝试其他搜索关键词" : "点击“新增用户”创建第一位用户"}</p></div>
              ) : (
                <table>
                  <thead><tr><th>用户</th><th>邮箱地址</th><th>用户 ID</th><th><span className="sr-only">操作</span></th></tr></thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td><div className="user-cell"><span className="avatar">{initials(user.name)}</span><strong>{user.name}</strong></div></td>
                        <td><a href={`mailto:${user.email}`}>{user.email}</a></td>
                        <td><span className="id-pill">#{String(user.id).padStart(4, "0")}</span></td>
                        <td className="actions"><button className="icon-button danger-button" onClick={() => void remove(user)} disabled={deletingId === user.id} aria-label={`删除 ${user.name}`} title="删除用户">{deletingId === user.id ? <span className="spinner small" /> : "×"}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <div className="modal-header"><div><p className="eyebrow">新建账户</p><h2 id="dialog-title">新增用户</h2></div><button className="icon-button" onClick={() => setShowForm(false)} aria-label="关闭">×</button></div>
            <form onSubmit={add}>
              <label className="field"><span>姓名</span><input autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如：张明" /></label>
              <label className="field"><span>邮箱地址</span><input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@example.com" /></label>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>取消</button><button className="primary-button" disabled={isSaving}>{isSaving && <span className="spinner small" />}创建用户</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
