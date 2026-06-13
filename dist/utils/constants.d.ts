export declare const roles: readonly ["user", "instructor", "admin"];
export type RoleType = (typeof roles)[number];
export declare const PERMISSION_MATRIX: Record<string, Record<string, RoleType[]>>;
//# sourceMappingURL=constants.d.ts.map