import { FastifyPluginAsync } from 'fastify';
import { RPC } from '../rpc.js';
import { getCache, setCache } from '../cache.js';

export const utxoRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/addr/:address/utxos', async (req, reply) => {
    const { address } = req.params as { address: string };
    const q = req.query as any;
    const importAddr = q?.import === '1' || q?.import === 'true';
    const rescan = q?.rescan === '1' || q?.rescan === 'true';

    const ck = `utxos:${address}`;
    const height = await RPC.getBlockCount().catch(() => undefined);
    if (height) reply.header('x-block-height', String(height));

    const cached = getCache<any[]>(ck);
    if (cached) return { utxos: cached, cached: true, source: 'cache' };

    try {
      const ai = await RPC.getAddressUtxos(address);
      if (ai && Array.isArray(ai)) {
        setCache(ck, ai, 10_000);
        return { utxos: ai, cached: false, source: 'addressindex' };
      }
    } catch {}

    if (importAddr) {
      try { await RPC.importAddress(address, '', rescan); } catch {}
    }

    try {
      const lus = await RPC.listUnspent(0, 9999999, [address]);
      if (Array.isArray(lus) && lus.length) {
        const mapped = lus.map((u: any) => ({
          address,
          txid: u.txid,
          outputIndex: u.vout,
          script: u.scriptPubKey,
          satoshis: Math.round(Number(u.amount) * 1e8),
          height: u.confirmations ? (height ? (height - u.confirmations + 1) : null) : null
        }));
        setCache(ck, mapped, 5_000);
        return { utxos: mapped, cached: false, source: 'listunspent' };
      }
    } catch {}

    return { utxos: [], note: 'no address index; use ?import=1 to add as watch-only (rescan=1 for historical, heavy), or reindex with addressindex=1' };
  });
};
