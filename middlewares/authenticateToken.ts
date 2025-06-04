import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import AuthenticatedRequest from '../interfaces/authenticatedRequest';

export default function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  const secret = process.env.TOKEN_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'TOKEN_SECRET is not set in environment variables.' });
  }

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.payload = user;
    next();
  });
}