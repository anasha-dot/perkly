export const STAFF_ROLES = ["cashier", "manager", "business_owner"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

const STAFF_ROLE_SET: ReadonlySet<string> = new Set(STAFF_ROLES);

export function isStaffRole(value: string): value is StaffRole {
  return STAFF_ROLE_SET.has(value);
}

export function canReadOwnUser(actorId: string, requestedUserId: string): boolean {
  return actorId !== "" && actorId === requestedUserId;
}

export function strongestStaffRole(roles: readonly StaffRole[]): StaffRole | null {
  if (roles.includes("business_owner")) {
    return "business_owner";
  }
  if (roles.includes("manager")) {
    return "manager";
  }
  if (roles.includes("cashier")) {
    return "cashier";
  }
  return null;
}

export function canReadBusiness(role: StaffRole | null): boolean {
  return role !== null;
}

export function canInviteStaff(role: StaffRole | null): boolean {
  return role === "business_owner";
}

export function hasAdminAssurance(input: {
  pool: "customer" | "admin" | null;
  granted: boolean;
}): boolean {
  return input.pool === "admin" && input.granted;
}

export function sessionCapabilities(input: {
  role: string;
  pool: "customer" | "admin" | null;
  adminGranted: boolean;
}): string[] {
  if (hasAdminAssurance({ pool: input.pool, granted: input.adminGranted })) {
    return ["administrator"];
  }
  if (input.pool === "admin" || input.role === "admin_pool") {
    return [];
  }
  if (isStaffRole(input.role) || input.role === "customer") {
    return [input.role];
  }
  return [];
}
