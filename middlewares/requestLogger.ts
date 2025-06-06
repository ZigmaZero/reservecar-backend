import { NextFunction, Request, Response } from "express";
import logger from "../logger.js";

// Extend Express Request type to include 'log'
declare module 'express-serve-static-core' {
  interface Request {
    log?: typeof logger;
  }
}

export default function requestLogger(req: Request, res: Response, next: NextFunction) {
  req.log = logger.child({ req: { method: req.method, url: req.url } });
  req.log.info(`[${req.method} ${req.url}] - Incoming`);

  res.on('finish', () => {
    req.log!.info(`[${req.method} ${req.url}] - ${res.statusCode}`);
  });

  next();
}