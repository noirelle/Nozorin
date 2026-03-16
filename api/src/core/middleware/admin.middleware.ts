import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.util';

interface AuthRequest extends Request {
    user?: any;
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;

    if (!user || user.userType !== 'admin') {
        return res.status(403).json(errorResponse('Access denied. Admin privileges required.'));
    }

    next();
};
