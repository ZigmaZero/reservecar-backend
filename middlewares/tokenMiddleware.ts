import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

export default function tokenMiddleware(req: Request, res: Response, next: NextFunction) {
    // Extract token from 'admin-token' cookie
    const token = req.cookies['admin_token'];

    if (token) {
        // Attach it to the Authorization header as a Bearer token
        req.headers.authorization = `Bearer ${token}`;
        logger.info(`Token middleware: Token attached to Authorization header`);
    }
    else {
        logger.warn('Token middleware: No token found in cookies');
    }

    next(); // Proceed to the next middleware/route handler
};