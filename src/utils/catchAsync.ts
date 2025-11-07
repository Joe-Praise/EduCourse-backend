import { Request, Response, NextFunction } from 'express';

interface AsyncHandler {
  (req: Request, res: Response, next: NextFunction): Promise<any>;
}

const catchAsync = (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res, next).catch(next);
};

export default catchAsync;