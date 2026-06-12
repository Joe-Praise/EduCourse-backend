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
    CREATED: "cache:user:created",
    UPDATED: "cache:user:updated",
    DELETED: "cache:user:deleted",
  },
  CERTIFICATE: {
    CREATED: "cache:certificate:created",
    UPDATED: "cache:certificate:updated",
    DELETED: "cache:certificate:deleted",
  },
  TAG: {
    CREATED: "cache:tag:created",
    UPDATED: "cache:tag:updated",
    DELETED: "cache:tag:deleted",
  },
  BLOG_COMMENT: {
    CREATED: "cache:blogcomment:created",
    UPDATED: "cache:blogcomment:updated",
    DELETED: "cache:blogcomment:deleted",
  },
  COMPLETED_COURSE: {
    CREATED: "cache:completedcourse:created",
    DELETED: "cache:completedcourse:deleted",
  },
  LINK: {
    CREATED: "cache:link:created",
    UPDATED: "cache:link:updated",
    DELETED: "cache:link:deleted",
  },
  ENROLLMENT: {
    CREATED: "cache:enrollment:created",
    UPDATED: "cache:enrollment:updated",
    DELETED: "cache:enrollment:deleted",
  },
  WISHLIST: {
    CREATED: "cache:wishlist:created",
    DELETED: "cache:wishlist:deleted",
  },
  NOTIFICATION: {
    CREATED: "cache:notification:created",
    UPDATED: "cache:notification:updated",
    DELETED: "cache:notification:deleted",
  },
  INSTRUCTOR_EARNING: {
    CREATED: "cache:instructorearning:created",
    UPDATED: "cache:instructorearning:updated",
  },
} as const;
