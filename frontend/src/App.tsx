import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useAuthStore } from "./stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { login, logout, me, restoreSession } from "./api/auth";
import { ScrollContainer } from "./components/ScrollContainer";
import { useOffsetPagination } from "./hooks/useOffsetPagination";
import { createUser, deleteUser, getUsers } from "./api/user";
import type { User } from "./types/user";
import request, { SESSION_EXPIRED_EVENT } from "./utils/request";
import "./styles.css";

type Notice = { type: "success" | "error"; message: string } | null;

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "U";
}

function App() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const setIsRestoring = useAuthStore((state) => state.setIsRestoring);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [query, setQuery] = useState("");
  const queryClient = useQueryClient();
  const {
    items: users,
    total,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useOffsetPagination<User>({
    fetchPage: getUsers,
    enabled: Boolean(currentUser),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [streamText, setStreamText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    let active = true;

    const handleSessionExpired = () => {
      if (!active) return;
      clearAuth();
      void queryClient.removeQueries({ predicate: ({ queryKey }) => queryKey[0] === "offset-pagination" });
      setShowForm(false);
      setLoginError("会话已失效，请重新登录。");
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    restoreSession()
      .then((user) => {
        if (active) setCurrentUser(user);
      })
      .catch(() => {
        if (active) setCurrentUser(null);
      })
      .finally(() => {
        if (active) setIsRestoring(false);
      });

    return () => {
      active = false;
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [clearAuth, queryClient, setCurrentUser, setIsRestoring]);

  useEffect(() => {
    if (currentUser) {
      queueMicrotask(() => void queryClient.invalidateQueries({ predicate: ({ queryKey }) => queryKey[0] === "offset-pagination" }));
    }
  }, [currentUser, queryClient]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      await login(loginForm.email.trim(), loginForm.password);
      const user = await me();
      setCurrentUser(user);
      setLoginForm({ email: "", password: "" });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "登录失败，请稍后重试。");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function signOut() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      clearAuth();
      void queryClient.removeQueries({ predicate: ({ queryKey }) => queryKey[0] === "offset-pagination" });
      setNotice(null);
      setShowForm(false);
      setIsLoggingOut(false);
    }
  }

  async function runStream() {
    setStreamText("");
    setIsStreaming(true);

    try {
      await request.stream("/sse/demo", {
        onMessage(data, event) {
          if (event === "done") return;
          setStreamText((current) => current + data);
        },
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "流式输出失败。",
      });
    } finally {
      setIsStreaming(false);
    }
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) return;

    setIsSaving(true);
    setNotice(null);
    try {
      await createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setForm({ name: "", email: "", password: "" });
      setShowForm(false);
      await queryClient.invalidateQueries({ predicate: ({ queryKey }) => queryKey[0] === "offset-pagination" });
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
      await queryClient.invalidateQueries({ predicate: ({ queryKey }) => queryKey[0] === "offset-pagination" });
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

  if (isRestoring) {
    return (
      <main className="auth-page">
        <div className="auth-card auth-loading" role="status">
          <span className="spinner" />
          <strong>正在恢复会话</strong>
          <p>请稍候片刻</p>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="auth-page">
        <section className="auth-card" aria-labelledby="login-title">
          <div className="auth-brand"><span className="brand-mark">N</span><span>Northstar</span></div>
          <p className="eyebrow">管理工作空间</p>
          <h1 id="login-title">欢迎回来</h1>
          <p className="subtitle">登录后继续管理系统用户。</p>
          {loginError && <div className="notice error" role="alert"><span>!</span>{loginError}</div>}
          <form className="login-form" onSubmit={signIn}>
            <label className="field"><span>邮箱地址</span><input autoFocus required type="email" autoComplete="email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} placeholder="name@example.com" /></label>
            <label className="field"><span>密码</span><input required type="password" autoComplete="current-password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} placeholder="输入登录密码" /></label>
            <button className="primary-button login-button" disabled={isLoggingIn}>{isLoggingIn && <span className="spinner small" />}{isLoggingIn ? "正在登录" : "登录"}</button>
          </form>
        </section>
      </main>
    );
  }

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
            <div className="account-copy"><strong>{currentUser.name}</strong><span>{currentUser.email}</span></div>
            <span className="avatar avatar-dark">{initials(currentUser.name)}</span>
            <button className="logout-button" onClick={() => void signOut()} disabled={isLoggingOut}>{isLoggingOut ? "退出中" : "退出"}</button>
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

          <section className="stream-demo" aria-labelledby="stream-title">
            <div>
              <p className="eyebrow">AI / Streaming</p>
              <h2 id="stream-title">SSE 流式输出</h2>
              <p className="subtitle">内容会随着服务器推送逐段显示，模拟 AI 打字机效果。</p>
            </div>
            <div className="stream-output" aria-live="polite">
              {streamText || (isStreaming ? "正在生成…" : "点击按钮开始体验")}
              {isStreaming && <span className="typing-cursor" aria-hidden="true" />}
            </div>
            <button className="primary-button" onClick={() => void runStream()} disabled={isStreaming}>
              {isStreaming ? "生成中" : "开始流式输出"}
            </button>
          </section>

          <section className="stats" aria-label="用户概览">
            <div className="stat-item"><span>用户总数</span><strong>{total}</strong><small>当前已录入账户</small></div>
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

            <ScrollContainer
              className="table-wrap"
              hasMore={Boolean(hasNextPage)}
              isLoading={isFetchingNextPage}
              onLoadMore={() => void fetchNextPage()}
            >
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
            </ScrollContainer>
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
              <label className="field"><span>密码</span><input required type="password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="至少 8 位" /></label>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>取消</button><button className="primary-button" disabled={isSaving}>{isSaving && <span className="spinner small" />}创建用户</button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
