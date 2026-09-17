import { useState } from "react";
import type { FormEvent } from "react";

import { login, me } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";

export function LoginPage() {
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const sessionError = useAuthStore((state) => state.sessionError);
  const setSessionError = useAuthStore((state) => state.setSessionError);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoggingIn(true);
    setError("");
    setSessionError("");
    try {
      await login(email.trim(), password);
      setCurrentUser(await me());
      setEmail("");
      setPassword("");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败，请稍后重试。");
    } finally {
      setIsLoggingIn(false);
    }
  }

  const displayError = error || sessionError;

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-brand"><span className="brand-mark">N</span><span>Northstar</span></div>
        <p className="eyebrow">管理工作空间</p><h1 id="login-title">欢迎回来</h1><p className="subtitle">登录后继续管理系统用户。</p>
        {displayError && <div className="notice error" role="alert"><span>!</span>{displayError}</div>}
        <form className="login-form" onSubmit={onSubmit}>
          <label className="field"><span>邮箱地址</span><input autoFocus required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></label>
          <label className="field"><span>密码</span><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="输入登录密码" /></label>
          <button className="primary-button login-button" disabled={isLoggingIn}>{isLoggingIn && <span className="spinner small" />}{isLoggingIn ? "正在登录" : "登录"}</button>
        </form>
      </section>
    </main>
  );
}
