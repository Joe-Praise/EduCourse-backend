import type { Request, Response, NextFunction } from 'express';
/**
 * CRUD operations using factory functions
 */
export declare const createBlog: (req: Request, res: Response, next: NextFunction) => void;
export declare const getBlog: (req: Request, res: Response, next: NextFunction) => void;
export declare const updateBlog: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteBlog: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Configure multer for single image upload
 */
export declare const setCoverImage: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * Atlas search autocomplete for blog titles
 * Provides real-time search suggestions with fuzzy matching
 */
export declare const atlasAutocomplete: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get all blogs with advanced filtering, pagination, and date formatting
 * Supports both slug-based individual queries and list queries
 */
export declare const getAllBlog: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Resize and optimize blog cover images
 * Uses sharp for efficient image processing
 */
export declare const resizePhoto: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Upload and associate blog resources/images
 * Updates blog document with new image filename
 */
export declare const uploadResources: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=blogController.d.ts.map