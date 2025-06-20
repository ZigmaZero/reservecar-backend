import pino from "pino";
import path from "path";

const logPath = path.resolve("database/server.log");

const pi = pino.default;

const logger = pi({
  transport: {
    // target: 'pino-pretty'
    target: 'pino/file',
    options: { destination: logPath }
  }
});
export default logger;