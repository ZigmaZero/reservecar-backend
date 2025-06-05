import {Request} from 'express';
import { Admin, Employee } from './internalTypes';

export default interface AuthenticatedRequest extends Request {
  payload?: string;
  admin?: Admin;
  employee?: Employee;
}