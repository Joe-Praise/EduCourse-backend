import type { Request, Response, NextFunction } from 'express';
interface MongoError extends Error {
    path?: string;
    value?: any;
    keyValue?: Record<string, any>;
    errors?: Record<string, {
        message: string;
    }>;
    code?: number;
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
}
declare const _default: (err: MongoError, req: Request, res: Response, next: NextFunction) => void;
export default _default;
//# sourceMappingURL=errorController.d.ts.map