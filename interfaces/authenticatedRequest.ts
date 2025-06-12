import {Request} from 'express';
import { Admin, Employee, JwtPayload } from './internalTypes';

export default interface AuthenticatedRequest extends Request {
  payload?: JwtPayload;
  admin?: Admin;
  employee?: Employee;
}