import app from "./app.js";
import path from 'path'
import fs from 'fs';
import https from 'https'

const startHttpServer = () => {
  app.listen(port, '0.0.0.0', async () => {
    console.log(`Server listening on port ${port}`);
  });
};

const port = 3000;
if (process.env.NODE_ENV === 'production') {
  try {
    const options = {
      key: fs.readFileSync(path.resolve('./database/key.pem')),
      cert: fs.readFileSync(path.resolve('./database/cert.pem'))
    };

    https.createServer(options, app).listen(8443, () => {
      console.log('HTTPS server running in production');
    });
  }
  catch (error) {
    console.error('Failed to start HTTPS server:', error);
    startHttpServer();
  }
} else {
  startHttpServer();
}