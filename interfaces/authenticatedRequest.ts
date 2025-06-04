import {Request} from 'express';
import { Admin, Employee } from './dbTypes';

export default interface AuthenticatedRequest extends Request {
  payload?: any;
  admin?: Admin;
  employee?: Employee;
}