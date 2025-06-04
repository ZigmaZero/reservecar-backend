import {Request} from 'express';
import { Admin, Employee } from './dbTypes';

export default interface AuthenticatedRequest extends Request {
  payload?: string;
  admin?: Admin;
  employee?: Employee;
}