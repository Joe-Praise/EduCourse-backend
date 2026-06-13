import type { Request, Response, NextFunction } from 'express';
import '../events/cache/wishlistCache.events.js';
export declare const addToWishlist: (req: Request, res: Response, next: NextFunction) => void;
export declare const removeFromWishlist: (req: Request, res: Response, next: NextFunction) => void;
export declare const getWishlistByUser: (req: Request, res: Response, next: NextFunction) => void;
export declare const checkWishlist: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=wishlistController.d.ts.map