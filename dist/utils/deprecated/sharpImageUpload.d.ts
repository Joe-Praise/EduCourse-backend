/**
 * @deprecated Local-disk image upload handlers using Sharp.
 *
 * Preserved verbatim from the original userController / courseController /
 * blogController implementations so they can be lifted into another project
 * that prefers local-disk storage over a CDN.
 *
 * NOT wired into any route. The active uploaders use Cloudinary via
 * `src/utils/cloudinary.ts`.
 *
 * Known caveats if you copy this elsewhere:
 *   1. Sharp's `.toFile(path)` does NOT create missing directories — the
 *      target folders (`public/img`, `public/course`, `public/blog`) must
 *      exist before the first request, or you must `fs.mkdirSync(..., { recursive: true })`
 *      on server boot.
 *   2. The relative `public/<dir>/...` path resolves against `process.cwd()`,
 *      which may differ between dev (project root) and prod (compiled `dist/`).
 *      Prefer `path.join(process.cwd(), 'public', '<dir>')` in production code.
 *   3. Files written here are not served by `app.use(express.static(...))`
 *      unless the static mount points at the same resolved directory.
 */
import type { Request, Response, NextFunction } from 'express';
/**
 * @deprecated Use the Cloudinary-based `resizePhoto` exported from
 * `src/Controllers/userController.ts`.
 */
export declare const userResizePhoto: (req: Request, res: Response, next: NextFunction) => void;
/**
 * @deprecated Use the Cloudinary-based `resizePhoto` exported from
 * `src/Controllers/courseController.ts`.
 */
export declare const courseResizePhoto: (req: Request, res: Response, next: NextFunction) => void;
/**
 * @deprecated Use the Cloudinary-based `resizePhoto` exported from
 * `src/Controllers/blogController.ts`.
 */
export declare const blogResizePhoto: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=sharpImageUpload.d.ts.map