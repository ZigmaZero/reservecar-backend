import { NextFunction, Request, Response } from "express";
import logger from "../logger.js";

export default function errorLogger(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
}