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
/* eslint-disable @typescript-eslint/no-explicit-any */
import sharp from 'sharp';
import catchAsync from '../catchAsync.js';
import AppError from '../appError.js';
/**
 * @deprecated Use the Cloudinary-based `resizePhoto` exported from
 * `src/Controllers/userController.ts`.
 */
export const userResizePhoto = catchAsync(async (req, _res, next) => {
    if (!req.file)
        return next();
    req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/${req.file.filename}`);
    next();
});
/**
 * @deprecated Use the Cloudinary-based `resizePhoto` exported from
 * `src/Controllers/courseController.ts`.
 */
export const courseResizePhoto = catchAsync(async (req, _res, next) => {
    if (!req.file)
        return next();
    req.file.filename = `course-${req.user._id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
        .resize(800, 800)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/course/${req.file.filename}`);
    next();
});
const BLOG_IMAGE_DIMENSIONS = { width: 700, height: 700 };
/**
 * @deprecated Use the Cloudinary-based `resizePhoto` exported from
 * `src/Controllers/blogController.ts`.
 */
export const blogResizePhoto = catchAsync(async (req, _res, next) => {
    if (!req.file)
        return next();
    const timestamp = Date.now();
    const userId = req.user?.id || 'anonymous';
    req.file.filename = `blog-${userId}-${timestamp}.jpeg`;
    try {
        await sharp(req.file.buffer)
            .resize(BLOG_IMAGE_DIMENSIONS.width, BLOG_IMAGE_DIMENSIONS.height, {
            fit: 'cover',
            position: 'center',
        })
            .toFormat('jpeg')
            .jpeg({
            quality: 90,
            progressive: true,
        })
            .toFile(`public/blog/${req.file.filename}`);
        next();
    }
    catch (_error) {
        return next(new AppError('Image processing failed', 500));
    }
});
//# sourceMappingURL=sharpImageUpload.js.map