import type { StudioRole } from "./session";

export type StudioPermission =
  | "studio:read"
  | "studio:write"
  | "audit:read"
  | "recovery:write";

const ROLE_PERMISSIONS: Record<StudioRole, readonly StudioPermission[]> = {
  owner: ["studio:read", "studio:write", "audit:read", "recovery:write"],
  auditor: ["studio:read", "audit:read"],
};

export function hasPermission(role: StudioRole, permission: StudioPermission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canMutate(role: StudioRole) {
  return hasPermission(role, "studio:write");
}
