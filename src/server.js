require('dotenv').config();
const { app } = require('./app');
const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  console.log(`Auth API running at http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/docs`);
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
