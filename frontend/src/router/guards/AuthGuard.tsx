import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthStore } from "@/stores/authStore";

export function AuthGuard() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const location = useLocation();

  if (isRestoring) {
    return <main className="auth-page"><div className="auth-loading"><span className="spinner" /><strong>正在恢复会话</strong><p>请稍候...</p></div></main>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function GuestGuard() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isRestoring = useAuthStore((state) => state.isRestoring);

  if (isRestoring) {
    return <main className="auth-page"><div className="auth-loading"><span className="spinner" /><strong>正在恢复会话</strong><p>请稍候...</p></div></main>;
  }

  return currentUser ? <Navigate to="/users" replace /> : <Outlet />;
}
