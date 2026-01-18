import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { proxy } from 'hono/proxy';
import bundle from './bundle';

interface Env {
  BLOCKNATIVE_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.all('/gasprices/', (c) => {
  const query = c.req.query(); // Get query parameters
  const chainId = query.chainid;
  const confidenceLevels = query.confidenceLevels || '99,95,90';

  return proxy(
    `https://api.blocknative.com/gasprices/blockprices?chainid=${chainId}&confidenceLevels=${confidenceLevels}`,
    {
      ...c.req,
      headers: {
        ...c.req.header(),
        Authorization: env(c).BLOCKNATIVE_API_KEY,
      },
    }
  );
});

app.route('/bundle', bundle);

export default app;
