import { Navigate, Outlet, useMatches } from "react-router-dom";

import { usePermissions } from "@/hooks/usePermission";
import type { RouteMeta } from "@/types/route-meta";

export function PermissionGuard() {
  const matches = useMatches();
  const { hasAnyPermission, hasAllPermissions } = usePermissions();
  const meta = [...matches].reverse().find((match) => match.handle)?.handle as RouteMeta | undefined;
  const required = meta?.permissions ?? [];

  if (required.length > 0) {
    const allowed = meta?.requireAll ? hasAllPermissions(required) : hasAnyPermission(required);
    if (!allowed) return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
