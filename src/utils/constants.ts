
export const roles = ["user", "instructor", "admin"] as const;
export type RoleType = (typeof roles)[number];

// Permission Matrix - Define what each role can do to each resource
export const PERMISSION_MATRIX: Record<string, Record<string, RoleType[]>> = {
  'courses': {
    'read': ['user', 'instructor', 'admin'],
    'create': ['instructor', 'admin'],
    'update': ['instructor', 'admin'],
    'delete': ['admin'],
    'publish': ['instructor', 'admin'],
    'archive': ['admin']
  },
  'users': {
    'read': ['admin'],
    'create': ['admin'],
    'update': ['admin'],
    'delete': ['admin'],
    'promote': ['admin']
  },
  'lessons': {
    'read': ['user', 'instructor', 'admin'],
    'create': ['instructor', 'admin'],
    'update': ['instructor', 'admin'],
    'delete': ['instructor', 'admin']
  },
  'reports': {
    'read': ['admin'],
    'generate': ['admin'],
    'export': ['admin']
  },
  'reviews': {
    'read': ['user', 'instructor', 'admin'],
    'create': ['user', 'instructor', 'admin'],
    'update': ['admin'], // Only admins can edit reviews
    'delete': ['admin']
  }
} as const;