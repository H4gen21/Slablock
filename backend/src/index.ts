import 'dotenv/config';
import { buildApp } from './app.js';

async function start() {
  if (process.env.DEV_BYPASS_CMAC === undefined) {
    process.env.DEV_BYPASS_CMAC = 'true';
  }
  const app = await buildApp();
  const preferredPort = Number(process.env.PORT || 4000);
  await app.listen({ port: preferredPort, host: '0.0.0.0' });
  console.log(`SlabLock Cryptographic Relay running at http://localhost:${preferredPort}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
