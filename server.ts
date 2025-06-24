import app from "./app.js";
const port = 3000;

app.listen(port, '0.0.0.0', async () => {
  console.log(`Server listening on port ${port}`);
});