import logger from "../logger.js";

export default function errorLogger(err, req, res, next) {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal Server Error' });
}