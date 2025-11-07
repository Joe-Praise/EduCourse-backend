export const CacheEvent = {
  INVALIDATE: "cache:invalidate",
  UPDATED: "cache:updated",
  CLEARED: "cache:cleared",

  COURSE: {
    CREATED: "cache:course:created",
    UPDATED: "cache:course:updated",
    DELETED: "cache:course:deleted",
  },
  USER: {
    UPDATED: "cache:user:updated",
  },
} as const;
