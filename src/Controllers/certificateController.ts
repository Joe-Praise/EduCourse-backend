import {
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
} from "./handlerFactory.js";
import { Certificate } from "../models/certificateModel.js";
import { CacheEvent } from "../events/cache/cache.events.js";

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

export const updateCertificate = updateOne(Certificate, {
  cachePattern: CacheEvent.CERTIFICATE.UPDATED,
});

export const deleteCertificate = deleteOne(Certificate, {
  cachePattern: CacheEvent.CERTIFICATE.DELETED,
});
