
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
    'update': ['admin'],
    'delete': ['admin']
  },
  'enrollments': {
    'read': ['user', 'instructor', 'admin'],
    'create': ['user', 'instructor', 'admin'],
    'delete': ['admin'],
  },
  'wishlist': {
    'read': ['user', 'instructor', 'admin'],
    'create': ['user', 'instructor', 'admin'],
    'delete': ['user', 'instructor', 'admin'],
  },
  'notifications': {
    'read': ['user', 'instructor', 'admin'],
    'update': ['user', 'instructor', 'admin'],
    'delete': ['user', 'instructor', 'admin'],
  },
  'earnings': {
    'read': ['instructor', 'admin'],
  },
  'analytics': {
    'read': ['instructor', 'admin'],
  },
  'ai': {
    'generate': ['user', 'instructor', 'admin'],
    'moderate': ['admin'],
  },
  'platform': {
    'read': ['user', 'instructor', 'admin'],
  },
  'streak': {
    'read': ['user', 'instructor', 'admin'],
  },
  'badges': {
    'read': ['user', 'instructor', 'admin'],
  },
} as const;