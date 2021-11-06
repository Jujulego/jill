import { LutinServer } from './server';

// Bootstrap
(async () => {
  const server = new LutinServer();
  await server.start();
})();