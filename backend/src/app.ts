import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { SlabLockStore } from './services/db.js';
import { RelayerSigner } from './services/relayer.js';
import { registerNfcRoutes } from './routes/nfc.js';
import { registerGradingRoutes } from './routes/grading.js';

export interface BuildAppOptions {
  store?: SlabLockStore;
  relayer?: RelayerSigner;
  masterKeyHex?: string;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: '*' });
  await app.register(multipart);
  await app.register(rateLimit, {
    max: 30,
    timeWindow: '1 minute'
  });

  const masterKeyHex =
    options.masterKeyHex ??
    process.env.NTAG_MASTER_KEY ??
    '00112233445566778899AABBCCDDEEFF';

  const store = options.store ?? new SlabLockStore(masterKeyHex);
  const relayer = options.relayer ?? new RelayerSigner();

  app.get('/', async () => ({
    status: 'OK',
    service: 'SlabLock Cryptographic Relay API',
    frontendUrl: 'http://localhost:8081'
  }));

  app.get('/health', async () => ({
    status: 'OK',
    service: 'SlabLock Cryptographic Relay API',
    frontendUrl: 'http://localhost:8081'
  }));

  await registerNfcRoutes(app, { store, relayer, masterKeyHex });
  await registerGradingRoutes(app, { store, masterKeyHex });

  return app;
}
