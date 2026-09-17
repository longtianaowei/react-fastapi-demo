import { useAuthStore } from "@/stores/authStore";

export function usePermission(permission: string) {
  const currentUser = useAuthStore((state) => state.currentUser);
  return currentUser?.permissions?.includes(permission) ?? false;
}

export function usePermissions() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const permissions = currentUser?.permissions ?? [];

  return {
    permissions,
    hasPermission: (permission: string) => permissions.includes(permission),
    hasAnyPermission: (required: string[]) => required.some((permission) => permissions.includes(permission)),
    hasAllPermissions: (required: string[]) => required.every((permission) => permissions.includes(permission)),
  };
}
