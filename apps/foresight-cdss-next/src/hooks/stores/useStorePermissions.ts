import { useSessionStore } from "@/stores/sessionStore";

export function usePermissions() {
  const permissions = useSessionStore((s) => s.permissions);
  const userRole = useSessionStore((s) => s.userRole);

  const hasPermission = (permission: string) => {
    return permissions.includes(permission) || userRole === "super_admin";
  };

  const hasAnyPermission = (...perms: string[]) => {
    return perms.some((p) => hasPermission(p));
  };

  const hasAllPermissions = (...perms: string[]) => {
    return perms.every((p) => hasPermission(p));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: userRole === "super_admin" || userRole === "org_admin",
  };
}
