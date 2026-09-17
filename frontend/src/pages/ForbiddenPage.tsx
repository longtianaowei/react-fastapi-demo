import { Link } from "react-router-dom";

export function ForbiddenPage() {
  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="forbidden-title">
        <p className="eyebrow">访问受限</p>
        <h1 id="forbidden-title">没有访问权限</h1>
        <p className="subtitle">你的账号暂无权限访问这个页面。</p>
        <Link className="primary-button" to="/users">返回用户管理</Link>
      </section>
    </main>
  );
}
