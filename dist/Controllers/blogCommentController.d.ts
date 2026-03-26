import type { Request, Response, NextFunction } from 'express';
/**
 * Blog Comment Controller
 * Handles CRUD operations for blog comments with nested routing support
 */
interface BlogCommentRequest extends Request {
    params: {
        blogId?: string;
        id?: string;
    };
    body: {
        blogId?: string;
        userId?: string;
        [key: string]: any;
    };
    user?: {
        _id: string;
        [key: string]: any;
    };
}
/**
 * Middleware to set blog and user IDs for nested routes
 * @param req - Request object
 * @param res - Response object
 * @param next - Next function
 */
export declare const setBlogId: (req: BlogCommentRequest, res: Response, next: NextFunction) => void;
/**
 * Get all blog comments with filtering and pagination
 * Supports nested routes and date formatting
 */
export declare const getAllBlogComments: (req: Request, res: Response, next: NextFunction) => void;
export declare const createBlogComment: (req: Request, res: Response, next: NextFunction) => void;
export declare const getBlogComment: (req: Request, res: Response, next: NextFunction) => void;
export declare const updateBlogComment: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteBlogComment: (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=blogCommentController.d.ts.map