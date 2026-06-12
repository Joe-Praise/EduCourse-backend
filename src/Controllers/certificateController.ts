import type { Response, NextFunction } from "express";
import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "./handlerFactory.js";
import catchAsync from "../utils/catchAsync.js";
import { Certificate } from "../models/certificateModel.js";
import { CacheEvent } from "../events/cache/cache.events.js";
import type { AuthenticatedRequest } from "./authController.js";

// Import cache events to register listeners
import "../events/cache/certificateCache.events.js";

export const createCertificate = createOne(Certificate, {
  cachePattern: CacheEvent.CERTIFICATE.CREATED,
});

export const getAllCertificates = getAll(Certificate);

export const getCertificate = getOne(Certificate, {
  modelName: "certificate",
  path: "userId courseId",
});

/**
 * GET /api/v1/certificates/me
 * Returns the authenticated user's certificates with the matching course
 * populated (title, slug, imageCover, instructors). Used by the "My
 * Certificates" page.
 */
export const getMyCertificates = catchAsync(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const userId = req.user!._id;
    const docs = await Certificate.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "courseId",
        select: "title slug imageCover instructors",
        populate: { path: "instructors", select: "userId", populate: { path: "userId", select: "name" } },
      });
    res.status(200).json({ status: "success", data: docs });
  },
);

export const updateCertificate = updateOne(Certificate, {
  cachePattern: CacheEvent.CERTIFICATE.UPDATED,
});

export const deleteCertificate = deleteOne(Certificate, {
  cachePattern: CacheEvent.CERTIFICATE.DELETED,
});
