import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import { restoreSession } from "@/api/auth";
import { router } from "@/router";
import { useAuthStore } from "@/stores/authStore";
import { SESSION_EXPIRED_EVENT } from "@/utils/request";

function App() {
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const setIsRestoring = useAuthStore((state) => state.setIsRestoring);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setSessionError = useAuthStore((state) => state.setSessionError);
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    const handleSessionExpired = () => {
      if (!active) return;
      clearAuth();
      void queryClient.removeQueries({ predicate: ({ queryKey }) => queryKey[0] === "offset-pagination" });
      setSessionError("会话已失效，请重新登录。");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    restoreSession().then((user) => { if (active) setCurrentUser(user); }).catch(() => { if (active) setCurrentUser(null); }).finally(() => { if (active) setIsRestoring(false); });
    return () => { active = false; window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired); };
  }, [clearAuth, queryClient, setCurrentUser, setIsRestoring, setSessionError]);

  return <RouterProvider router={router} />;
}

export default App;
