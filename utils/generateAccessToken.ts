import jwt from 'jsonwebtoken';
import { Employee, Admin, JwtPayload } from '../interfaces/internalTypes.js';

export default function generateAccessToken(user: Employee | Admin): string {
  const secret = process.env.TOKEN_SECRET;
  if (!secret) {
    throw new Error('TOKEN_SECRET is not set in environment variables.');
  }

  return jwt.sign({name: user.name} as JwtPayload, secret, { expiresIn: '1800s' });
}