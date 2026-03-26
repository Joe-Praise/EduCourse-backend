import type { Request, Response, NextFunction } from 'express';
import type { Document, Model, PopulateOptions } from 'mongoose';
/**
 * Grade Handler Factory for CRUD operations
 * Provides type-safe, reusable handlers for Mongoose models
 */
interface PopOptions {
    field?: string;
    path?: string;
    select?: string;
    model?: string;
}
interface QueryRequest extends Request {
    query: {
        slug?: string;
        search?: string;
        page?: string;
        limit?: string;
        sort?: string;
        fields?: string;
        [key: string]: any;
    };
}
interface ApiResponse<T = any> {
    status: 'success' | 'error';
    data?: T;
    metaData?: {
        totalPages: number;
        totalDocuments: number;
        page: number;
        count: number;
        limit: number;
    };
    message?: string;
}
/**
 * Soft delete handler
 * Marks document as inactive instead of physical deletion for audit trails
 * @param Model - Mongoose model to operate on
 */
export declare const deleteOne: <T extends Document>(Model: Model<T>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Update handler with validation
 * @param Model - Mongoose model to operate on
 */
export declare const updateOne: <T extends Document>(Model: Model<T>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create handler with duplicate checking
 * @param Model - Mongoose model to operate on
 * @param popOptions - Options for duplicate checking and population
 */
export declare const createOne: <T extends Document>(Model: Model<T>, popOptions?: PopOptions) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get single document handler with population
 * @param Model - Mongoose model to operate on
 * @param popOptions - Population options for related documents
 */
export declare const getOne: <T extends Document>(Model: Model<T>, popOptions?: PopulateOptions) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get all documents handler with advanced filtering and pagination
 * @param Model - Mongoose model to operate on
 */
export declare const getAll: <T extends Document>(Model: Model<T>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 *  Text search handler with scoring
 * @param Model - Mongoose model to operate on (must have text index)
 */
export declare const searchModel: <T extends Document>(Model: Model<T>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Bulk operations handler
 * @param Model - Mongoose model to operate on
 */
export declare const bulkUpdate: <T extends Document>(Model: Model<T>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Analytics handler for document statistics
 * @param Model - Mongoose model to operate on
 */
export declare const getAnalytics: <T extends Document>(Model: Model<T>) => (req: Request, res: Response, next: NextFunction) => void;
export type { PopOptions, QueryRequest, ApiResponse };
//# sourceMappingURL=handlerFactory.d.ts.map