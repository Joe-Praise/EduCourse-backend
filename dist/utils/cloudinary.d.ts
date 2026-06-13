import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
interface UploadParams {
    buffer: Buffer;
    publicId: string;
}
export declare const uploadBufferToCloudinary: ({ buffer, publicId }: UploadParams) => Promise<UploadApiResponse>;
export default cloudinary;
//# sourceMappingURL=cloudinary.d.ts.map