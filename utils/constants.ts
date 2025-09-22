
export const roles = ["user", "instructor", "admin"] as const;
export type RoleType = (typeof roles)[number];