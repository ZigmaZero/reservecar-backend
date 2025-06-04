import logger from "../logger.js";

export default function requestLogger(req, res, next) {
  req.log = logger.child({ req: { method: req.method, url: req.url } });
  req.log.info({ msg: 'Incoming request' });

  res.on('finish', () => {
    req.log.info({ res: { statusCode: res.statusCode } }, 'Response sent');
  });

  next();
}