import { Hono } from 'hono';
import { cors } from 'hono/cors';
import api from './api';

interface Env {
  WC_PROJECT_ID: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/health', (c) => c.text('Worker is working.'));

app.use('*', cors()); // This adds CORS headers to all responses

app.route('/api', api);

app.all('/rpc/:chainId', async (c) => {
  // const rpcUrl = "https://mempool.merkle.io/rpc/eth/pk_mbs_f29d60e8e18734b53eff9f093b4d0078?mempool_boost";
  const rpcUrl = "https://eth.rpc.blxrbdn.com";
  // `https://rpc.walletconnect.org/v1/?chainId=eip155%3A${chainId}&projectId=${
  //   env(c).WC_PROJECT_ID
  // }`,
  // "https://eth.rpc.blxrbdn.com",
  // "https://mempool.merkle.io/rpc/eth/pk_mbs_f29d60e8e18734b53eff9f093b4d0078",
  // "https://rpc.golden2dm.com/v1/mainnet",
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    body = null;
  }

  // If not a batch, just proxy as usual
  if (!Array.isArray(body)) {
    const resp = await fetch(rpcUrl, {
      method: c.req.method,
      headers: {
        ...c.req.header(),
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await resp.text();
    return new Response(data, {
      status: resp.status,
      headers: { 'content-type': resp.headers.get('content-type') || 'application/json' },
    });
  }

  // If batch, split into chunks of 100
  const batches = [];
  for (let i = 0; i < body.length; i += 100) {
    batches.push(body.slice(i, i + 100));
  }

  // Fetch each batch and collect results
  const results = await Promise.all(
    batches.map(async (batch) => {
      const resp = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          ...c.req.header(),
          'content-type': 'application/json',
        },
        body: JSON.stringify(batch),
      });
      return resp.json();
    })
  );

  // Flatten the results (since each batch returns an array)
  const merged = results.flat();

  return c.json(merged);
});

export default app;
