import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

import { ForbiddenPage } from "@/pages/ForbiddenPage";
import { LoginPage } from "@/pages/LoginPage";
import { UsersPage } from "@/pages/UsersPage";
import { AuthGuard, GuestGuard } from "@/router/guards/AuthGuard";
import { PermissionGuard } from "@/router/guards/PermissionGuard";
import type { RouteMeta } from "@/types/route-meta";

const routes: RouteObject[] = [
  {
    element: <Outlet />,
    children: [
      {
        element: <GuestGuard />,
        children: [{ path: "/login", element: <LoginPage /> }],
      },
      { path: "/403", element: <ForbiddenPage /> },
      {
        element: <AuthGuard />,
        children: [
          {
            element: <PermissionGuard />,
            children: [
              {
                path: "/users",
                element: <UsersPage />,
                handle: {} satisfies RouteMeta,
              },
            ],
          },
        ],
      },
      { path: "*", element: <Navigate to="/users" replace /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
