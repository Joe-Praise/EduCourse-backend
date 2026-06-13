import type { Request, Response, NextFunction } from 'express';
import { type Query } from 'mongoose';
/**
 * Grade Handler Factory for CRUD operations
 * Provides type-safe, reusable handlers for Mongoose models
 */
interface MongooseModel {
    findByIdAndUpdate(id: any, update: any, options?: any): Promise<any>;
    findByIdAndDelete?(id: any): Promise<any>;
    findById(id: any, projection?: any, options?: any): Promise<any>;
    create(doc: any): Promise<any>;
    find(filter?: any): Query<any[], any>;
    findOne(filter?: any): Promise<any>;
    populate?(docs: any, options: any): Promise<any>;
    [key: string]: any;
}
interface PopOptions {
    field?: string;
    path?: string;
    select?: string;
    model?: string;
    cachePattern?: string;
    modelName?: string;
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
export declare const deleteOne: (Model: MongooseModel, popOptions?: PopOptions) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Update handler with validation
 * @param Model - Mongoose model to operate on
 */
export declare const updateOne: (Model: MongooseModel, popOptions?: PopOptions) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Create handler with duplicate checking
 * @param Model - Mongoose model to operate on
 * @param popOptions - Options for duplicate checking and population
 */
export declare const createOne: (Model: MongooseModel, popOptions?: PopOptions) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get single document handler with population
 * @param Model - Mongoose model to operate on
 * @param popOptions - Population options for related documents
 */
export declare const getOne: (Model: MongooseModel, popOptions?: PopOptions) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Get all documents handler with advanced filtering and pagination
 * @param Model - Mongoose model to operate on
 */
export declare const getAll: (Model: MongooseModel) => (req: Request, res: Response, next: NextFunction) => void;
/**
 *  Text search handler with scoring
 * @param Model - Mongoose model to operate on (must have text index)
 */
export declare const searchModel: (Model: MongooseModel) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Bulk operations handler
 * @param Model - Mongoose model to operate on
 */
export declare const bulkUpdate: (Model: MongooseModel) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Analytics handler for document statistics
 * @param Model - Mongoose model to operate on
 */
export declare const getAnalytics: (Model: MongooseModel) => (req: Request, res: Response, next: NextFunction) => void;
export type { PopOptions, QueryRequest, ApiResponse };
//# sourceMappingURL=handlerFactory.d.ts.map