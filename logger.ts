import pino from "pino";

const pi = pino.default;

const logger = pi({
  transport: {
    target: 'pino-pretty'
  }
});
export default logger;