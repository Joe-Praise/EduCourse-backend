import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import AppError from './appError.js';
let configured = false;
const ensureConfigured = () => {
    if (configured)
        return;
    const url = process.env.CLOUDINARY_URL;
    if (!url) {
        throw new AppError('CLOUDINARY_URL is not set in config.env. Format: cloudinary://<api_key>:<api_secret>@<cloud_name>', 500);
    }
    // Parse explicitly — the SDK auto-reads CLOUDINARY_URL at module load time,
    // which is before dotenv runs when using tsx (ESM imports are hoisted in CJS output).
    const match = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (!match) {
        throw new AppError('CLOUDINARY_URL format is invalid. Expected: cloudinary://<api_key>:<api_secret>@<cloud_name>', 500);
    }
    cloudinary.config({
        api_key: match[1],
        api_secret: match[2],
        cloud_name: match[3],
        secure: true,
    });
    configured = true;
};
export const uploadBufferToCloudinary = ({ buffer, publicId }) => {
    ensureConfigured();
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
            public_id: publicId,
            overwrite: true,
            invalidate: true,
            resource_type: 'image',
        }, (err, result) => {
            if (err || !result) {
                return reject(new AppError(err?.message ?? 'Cloudinary upload failed', 500));
            }
            resolve(result);
        });
        Readable.from(buffer).pipe(stream);
    });
};
export default cloudinary;
//# sourceMappingURL=cloudinary.js.map