import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import AuthenticatedRequest from '../interfaces/authenticatedRequest.js';
import { JwtPayload } from '../interfaces/internalTypes.js';
import logger from '../logger.js';

export default function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) 
  {
    res.sendStatus(401);
    return;
  }

  const secret = process.env.TOKEN_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'TOKEN_SECRET is not set in environment variables.' });
    return;
  }

  jwt.verify(token, secret, (err: jwt.VerifyErrors | null, user: string | jwt.JwtPayload | undefined) => {
    if (err)
    {
      logger.error("Token verification failed:", err);
      res.sendStatus(403);
      return;
    }
    req.payload = user as JwtPayload;
    next();
  });
}