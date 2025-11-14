export const CacheEvent = {
  INVALIDATE: "cache:invalidate",
  UPDATED: "cache:updated",
  CLEARED: "cache:cleared",

  COURSE: {
    CREATED: "cache:course:created",
    UPDATED: "cache:course:updated",
    DELETED: "cache:course:deleted",
  },
  BLOG: {
    CREATED: "cache:blog:created",
    UPDATED: "cache:blog:updated",
    DELETED: "cache:blog:deleted",
  },
  CATEGORY: {
    CREATED: "cache:category:created",
    UPDATED: "cache:category:updated",
    DELETED: "cache:category:deleted",
  },
  INSTRUCTOR: {
    CREATED: "cache:instructor:created",
    UPDATED: "cache:instructor:updated",
    DELETED: "cache:instructor:deleted",
  },
  REVIEW: {
    CREATED: "cache:review:created",
    UPDATED: "cache:review:updated",
    DELETED: "cache:review:deleted",
  },
  MODULE: {
    CREATED: "cache:module:created",
    UPDATED: "cache:module:updated",
    DELETED: "cache:module:deleted",
  },
  LESSON: {
    CREATED: "cache:lesson:created",
    UPDATED: "cache:lesson:updated",
    DELETED: "cache:lesson:deleted",
  },
  USER: {
    UPDATED: "cache:user:updated",
  },
} as const;
