import { Request, Response, NextFunction } from 'express';
interface AsyncHandler {
    (req: Request, res: Response, next: NextFunction): Promise<any>;
}
declare const catchAsync: (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => void;
export default catchAsync;
//# sourceMappingURL=catchAsync.d.ts.map