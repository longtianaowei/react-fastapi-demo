import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { getUsers } from "@/api/user";
import { useAuthStore } from "@/stores/authStore";

export function UsersPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: () => getUsers({ page: 1, page_size: 20 }) });

  return (
    <div className="app-shell">
      <aside className="sidebar"><Link className="brand" to="/users"><span className="brand-mark">N</span><span>Northstar</span></Link><nav><Link className="nav-item active" to="/users"><span className="nav-icon">⌘</span>用户管理</Link></nav><div className="sidebar-footer"><span className="status-dot" />系统运行正常</div></aside>
      <div className="main">
        <header className="topbar"><div className="mobile-brand"><span className="brand-mark">N</span><span>Northstar</span></div><div className="account"><div className="account-copy"><strong>{currentUser?.name}</strong><span>{currentUser?.email}</span><button className="logout-button" onClick={clearAuth}>退出登录</button></div><span className="avatar">{currentUser?.name?.slice(0, 1)}</span></div></header>
        <main className="page"><div className="page-heading"><div><p className="eyebrow">管理工作空间</p><h1>用户管理</h1><p className="subtitle">查看和管理系统中的用户账户。</p></div></div><section className="data-panel"><div className="panel-toolbar"><div><h2>全部用户</h2><p>{usersQuery.data?.total ?? 0} 个用户</p></div></div>{usersQuery.isLoading ? <div className="state"><span className="spinner" /><strong>正在加载用户</strong></div> : usersQuery.isError ? <div className="state"><strong>加载失败</strong><p>请稍后重试。</p></div> : <div className="table-wrap"><table><thead><tr><th>ID</th><th>用户</th><th>邮箱</th></tr></thead><tbody>{usersQuery.data?.items.map((user) => <tr key={user.id}><td><span className="id-pill">#{user.id}</span></td><td><div className="user-cell"><span className="avatar">{user.name.slice(0, 1)}</span><strong>{user.name}</strong></div></td><td>{user.email}</td></tr>)}</tbody></table></div>}</section></main>
      </div>
    </div>
  );
}
