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
  req.log.info({ msg: 'Incoming request' });

  res.on('finish', () => {
    req.log!.info({ res: { statusCode: res.statusCode } }, 'Response sent');
  });

  next();
}