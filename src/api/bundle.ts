import { type Context, Hono } from 'hono';
import { env } from 'hono/adapter';
import { keccak256, toHex, type Account, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

interface Env {
  AUTH_ACCOUNT_SEED: string;
  BLOCKRAZOR_API_KEY: string;
  MERKLE_API_KEY: string;
}

enum CHAIN_IDS {
  ETH = 1,
  BSC = 56,
  BASE = 8453,
}

let id = 0;
let authAccount: Account | undefined = undefined;
let builders: string[] = [];
let blockRazorApiKey: string | undefined = undefined;
let merkleApiKey: string | undefined = undefined;

const app = new Hono<{ Bindings: Env }>();

const loadEnv = async (
  c: Context<{
    Bindings: Env;
  }>
) => {
  if (!authAccount)
    authAccount = privateKeyToAccount(
      keccak256(toHex(env(c).AUTH_ACCOUNT_SEED))
    );
  if (!blockRazorApiKey) blockRazorApiKey = env(c).BLOCKRAZOR_API_KEY;
  if (!merkleApiKey) merkleApiKey = env(c).MERKLE_API_KEY;
};

const loadBuilders = async () => {
  if (builders.length === 0 || id >= 1000) {
    const builderList = await axios.get(
      'https://raw.githubusercontent.com/flashbots/dowg/main/builder-registrations.json'
    );
    builders = builderList.data
      .map((builder: { name: string }) => builder.name)
      .filter((name: string) => name.toLowerCase() !== 'bobthebuilder');
    id = 0;
  }
};
app.post('/send/:chainId', async (c) => {
  const chainId = Number(c.req.param('chainId'));
  try {
    await Promise.all([
      loadEnv(c),
      ...(chainId === CHAIN_IDS.ETH ? [loadBuilders()] : []),
    ]);
    const { txs, latestBlockNumber } = await c.req.json();
    console.log('bundles :>> ', txs);
    console.log('latestBlockNumber :>> ', latestBlockNumber);
    const [simulation, result] = await Promise.all([
      (async () => {
        return callBundle(
          chainId,
          txs[txs.length - 1],
          latestBlockNumber + txs.length
        );
      })(),
      Promise.all(
        txs.map(async (bundle: Hex[], index: number) => {
          return await sendBundle(
            chainId,
            bundle,
            latestBlockNumber + index + 1
          );
        })
      ),
    ]);
    console.log('simulation :>> ', simulation);
    if ('error' in simulation) {
      return c.json({
        success: false,
        error: `Simulation failed. ${simulation.error}`,
        result: simulation,
      });
    }
    for (let i = 0; i < simulation.results.length; i++) {
      const result = simulation.results[i];
      if (result.revert !== undefined) {
        return c.json({
          success: false,
          error: `Simulation failed. tx #${i} reverted.`,
          result: simulation,
        });
      }
    }
    const failedTxIndex = simulation.results.findIndex(
      (r: any) => 'error' in r
    );
    if (failedTxIndex >= 0) {
      return c.json({
        success: false,
        error: `Simulation failed. tx #${failedTxIndex} reverted.`,
        result: simulation,
      });
    }
    return c.json({ success: true, result });
  } catch (e: any) {
    console.log(e);
    return c.json({ success: false, error: e.message });
  }
});

app.post('/cancel/:chainId', async (c) => {
  const chainId = Number(c.req.param('chainId'));
  try {
    await loadEnv(c);
    const { replacementUuids } = await c.req.json();
    await Promise.all(
      replacementUuids.map((uuid: string) => cancelBundle(chainId, uuid))
    );
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message });
  }
});

const callBundle = async (chainId: number, txs: Hex[], blockNumber: number) => {
  if (chainId === CHAIN_IDS.ETH)
    return await sendFlashbotsRequest('eth_callBundle', [
      {
        txs,
        blockNumber: toHex(blockNumber),
        stateBlockNumber: 'latest',
      },
    ]);
  if (chainId === CHAIN_IDS.BSC)
    return await sendBlockrazorRequest('eth_callBundle', [
      {
        txs,
        blockNumber: blockNumber,
      },
    ]);
};

const sendBundle = async (chainId: number, txs: Hex[], blockNumber: number) => {
  const replacementUuid = uuidv4();
  if (chainId === CHAIN_IDS.ETH) {
    const result = await Promise.all([
      sendFlashbotsRequest('eth_sendBundle', [
        {
          txs,
          blockNumber: toHex(blockNumber),
          builders,
          replacementUuid,
        },
      ]),
      sendQuasarRequest('eth_sendBundle', [
        {
          txs,
          blockNumber: toHex(blockNumber),
          replacementUuid,
        },
      ]),
      sendMerkleRequest('eth_sendBundle', [
        {
          txs,
          blockNumber: toHex(blockNumber),
        },
      ]),
      sendBeaverBuildRequest('eth_sendBundle', [
        {
          txs,
          blockNumber: toHex(blockNumber),
          builderNetRefundAddress: authAccount
            ? authAccount.address
            : undefined,
        },
      ]),
      sendTitanBuilderRequest('eth_sendBundle', [
        {
          txs,
          blockNumber: toHex(blockNumber),
        },
      ]),
    ]);
    return {
      result,
      replacementUuid,
    };
  }
  if (chainId === CHAIN_IDS.BSC)
    return {
      ...(await sendMerkleRequest('eth_sendBundle', [
        {
          txs,
          blockNumber: toHex(blockNumber),
          replacementUuid,
        },
      ])),
      replacementUuid,
    };
};

const cancelBundle = async (chainId: number, replacementUuid: string) => {
  if (chainId === CHAIN_IDS.ETH)
    return await sendFlashbotsRequest('eth_cancelBundle', [
      {
        replacementUuid,
      },
    ]);
  if (chainId === CHAIN_IDS.BSC)
    return await sendMerkleRequest('eth_cancelBundle', [
      {
        replacementUuid,
      },
    ]);
};

const sendFlashbotsRequest = async (method: string, params: any) => {
  if (!authAccount) throw new Error('Auth account is not set');
  const payload = {
    jsonrpc: '2.0',
    id,
    method,
    params,
  };

  const signature = `${authAccount.address.toLowerCase()}:${await authAccount.signMessage?.(
    {
      message: keccak256(toHex(JSON.stringify(payload))),
    }
  )}`;
  return await sendJsonRpcRequest('https://relay.flashbots.net', payload, {
    headers: {
      'X-Flashbots-Signature': signature,
    },
  });
};

const sendQuasarRequest = async (method: string, params: any) => {
  if (!authAccount) throw new Error('Auth account is not set');
  const payload = {
    jsonrpc: '2.0',
    id,
    method,
    params,
  };

  const signature = `${authAccount.address.toLowerCase()}:${await authAccount.signMessage?.(
    {
      message: keccak256(toHex(JSON.stringify(payload))),
    }
  )}`;
  return await sendJsonRpcRequest('https://rpc.quasar.win', payload, {
    headers: {
      'X-Flashbots-Signature': signature,
    },
  });
};

const sendBeaverBuildRequest = async (method: string, params: any) => {
  return await sendJsonRpcRequest('https://rpc.beaverbuild.org/', {
    method,
    params,
  });
};

const sendTitanBuilderRequest = async (method: string, params: any) => {
  return await sendJsonRpcRequest('https://rpc.titanbuilder.xyz/', {
    method,
    params,
  });
};

const sendMerkleRequest = async (
  method: string,
  params: any,
  chainId: number = 1
) => {
  if (chainId !== 1 && chainId !== 56) throw new Error('Invalid chain id');
  const chain = chainId === 1 ? 'eth' : 'bsc';
  if (merkleApiKey === undefined) throw new Error('Merkle API key is not set');
  return await sendJsonRpcRequest(
    `https://mempool.merkle.io/rpc/${chain}/${merkleApiKey}?no_revert`,
    {
      method,
      params,
    }
  );
};

const sendBlockrazorRequest = async (method: string, params: any) => {
  return await sendJsonRpcRequest(
    'https://rpc.blockrazor.builders',
    {
      method,
      params,
    },
    {
      headers: {
        Authorization: blockRazorApiKey,
      },
    }
  );
};

const sendJsonRpcRequest = async (
  rpcUrl: string,
  payload: any,
  config?: any
) => {
  try {
    const response = await axios.post(
      rpcUrl,
      {
        jsonrpc: '2.0',
        id: id++,
        ...payload,
      },
      config
    );
    console.log(payload.method, payload, response.data);
    if ('error' in response.data) {
      return { error: response.data.error.message };
    }
    return response.data.result;
  } catch (e: any) {
    return { error: e.message };
  }
};

export default app;
