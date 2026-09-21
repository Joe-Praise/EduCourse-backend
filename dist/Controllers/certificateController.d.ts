import type { Response, NextFunction } from "express";
import "../events/cache/certificateCache.events.js";
export declare const createCertificate: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const getAllCertificates: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const getCertificate: (req: import("express").Request, res: Response, next: NextFunction) => void;
/**
 * GET /api/v1/certificates/me
 * Returns the authenticated user's certificates with the matching course
 * populated (title, slug, imageCover, instructors). Used by the "My
 * Certificates" page.
 */
export declare const getMyCertificates: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const updateCertificate: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const deleteCertificate: (req: import("express").Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=certificateController.d.ts.map