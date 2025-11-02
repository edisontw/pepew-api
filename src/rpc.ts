import { config } from './config.js';
import { request } from 'undici';

let rpcId = 0;
async function rpcCall<T = any>(method: string, params: any[] = []): Promise<T> {
  const body = { jsonrpc: '2.0', id: ++rpcId, method, params };
  const auth = Buffer.from(`${config.rpcUser}:${config.rpcPass}`).toString('base64');

  const res = await request(config.rpcUrl, {
    method: 'POST',
    headersTimeout: 5000,
    bodyTimeout: 15000,
    headers: {
      'content-type': 'application/json',
      'authorization': `Basic ${auth}`
    },
    body: JSON.stringify(body)
  });

  if (res.statusCode != 200) {
    const text = await res.body.text();
    throw new Error(`RPC HTTP ${res.statusCode}: ${text}`);
  }
  const json: any = await res.body.json();
  if (json.error) throw new Error(`RPC ${method} error: ${JSON.stringify(json.error)}`);
  return json.result as T;
}

export const RPC = {
  call: rpcCall,
  getBlockCount: () => rpcCall<number>('getblockcount'),
  estimateSmartFee: (confTarget = 6) => rpcCall<any>('estimatesmartfee', [confTarget]),
  sendRawTransaction: (hex: string) => rpcCall<string>('sendrawtransaction', [hex]),
  getRawTransactionVerbose: (txid: string) => rpcCall<any>('getrawtransaction', [txid, 1]),
  getAddressUtxos: (address: string) =>
    rpcCall<any>('getaddressutxos', [{ addresses: [address] }]).catch(() => null),
  getAddressBalance: (address: string) =>
    rpcCall<any>('getaddressbalance', [{ addresses: [address] }]).catch(() => null),
  getMempoolInfo: () => rpcCall<any>('getmempoolinfo'),
  listUnspent: (minconf = 0, maxconf = 9999999, addresses?: string[]) =>
    addresses && addresses.length
      ? rpcCall<any>('listunspent', [minconf, maxconf, addresses])
      : rpcCall<any>('listunspent', [minconf, maxconf]),
  importAddress: (address: string, label = '', rescan = false) =>
    rpcCall<any>('importaddress', [address, label, rescan])
};
