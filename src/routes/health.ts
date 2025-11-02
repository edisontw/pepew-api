import { FastifyPluginAsync } from 'fastify';
import { RPC } from '../rpc.js';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async (_, reply) => {
    try {
      const height = await RPC.getBlockCount();
      reply.header('x-block-height', String(height));
      return { ok: true, height };
    } catch (e: any) {
      reply.code(500);
      return { ok: false, error: e.message };
    }
  });
};
