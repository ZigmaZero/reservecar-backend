import {Request} from 'express';
import { Admin, Employee, JwtPayload } from './internalTypes.js';

export default interface AuthenticatedRequest extends Request {
  payload?: JwtPayload;
  admin?: Admin;
  employee?: Employee;
}