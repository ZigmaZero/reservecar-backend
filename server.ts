import app from "./app.js";
import logger from './logger.js';
const port = 3000;

app.listen(port, '0.0.0.0', async () => {
  logger.info(`Server listening on port ${port}`);
});