import Fastify from 'fastify';
import { config } from './config.js';
import { healthRoutes } from './routes/health.js';
import { chainRoutes } from './routes/chain.js';
import { feeRoutes } from './routes/fee.js';
import { txRoutes } from './routes/tx.js';
import { utxoRoutes } from './routes/utxo.js';
import { mempoolRoutes } from './routes/mempool.js';
import { nodeRoutes } from './routes/node.js';
import { walletRoutes } from './routes/wallet.js';
import { balanceRoutes } from './routes/balance.js';
import { apiKeyGuard } from './security/apikey.js';
import { rateLimitPlugin } from './security/rateLimit.js';
import { docsPlugin } from './docs.js';
import { startZMQ } from './zmq.js';

const app = Fastify({ logger: true });

await app.register(rateLimitPlugin);
await app.register(apiKeyGuard);
await app.register(docsPlugin);

await app.register(healthRoutes);
await app.register(chainRoutes);
await app.register(feeRoutes);
await app.register(txRoutes);
await app.register(utxoRoutes);
await app.register(mempoolRoutes);
await app.register(nodeRoutes);
await app.register(walletRoutes);
await app.register(balanceRoutes);

app.setNotFoundHandler((req, reply) => reply.code(404).send({ error: 'Not found' }));

startZMQ(app.log);

app.listen({ port: config.port, host: '0.0.0.0' })
  .then(() => app.log.info(`PEPEW API v${'0.5.1'} listening on :${config.port}`))
  .catch((err) => { app.log.error(err); process.exit(1); });
