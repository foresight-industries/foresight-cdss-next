import { useSessionStore } from "@/stores/sessionStore";

export function usePermissions() {
  const permissions = useSessionStore((s) => s.permissions);
  const teamMember = useSessionStore((s) => s.teamMember);

  const hasPermission = (permission: string) => {
    return (
      permissions.includes(permission) || teamMember?.role === "super_admin"
    );
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
    isAdmin:
      teamMember?.role === "super_admin" || teamMember?.role === "org_admin",
  };
}
