import jwt from 'jsonwebtoken';
import { JwtPayload } from '../interfaces/internalTypes.js';
import { AdminExternal, EmployeeExternal } from '../interfaces/externalTypes.js';

export default function generateAccessToken(user: EmployeeExternal | AdminExternal): string {
  const secret = process.env.TOKEN_SECRET;
  if (!secret) {
    throw new Error('TOKEN_SECRET is not set in environment variables.');
  }

  return jwt.sign({ id: user.id, name: user.name} as JwtPayload, secret, { expiresIn: '1800s' });
}