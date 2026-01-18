import io from 'socket.io-client';
import Config from "../config";
const FALLBACK_URL = 'wss://api-v4.zerion.io/';
// const API_KEY = 'zk_dev_3b643b0271ec474eb4ef80a0dc4ba7a4';
const API_KEY = Config.ZERION_API_KEY;
const BASE_URL = FALLBACK_URL;

function verify(request, response) {
  // each value in request payload must be found in response meta
  return Object.keys(request.payload).every(key => {
    const requestValue = request.payload[key];
    const responseMetaValue = response.meta[key];
    if (typeof requestValue === 'object') {
      return JSON.stringify(requestValue) === JSON.stringify(responseMetaValue);
    }
    return responseMetaValue === requestValue;
  });
}

const assetsSocket = {
  namespace: 'assets',
  socket: io(`${BASE_URL}assets`, {
    transports: ['websocket'],
    timeout: 60000,
    query: {
      api_token: API_KEY,
    },
  }),
};

const addressSocket = {
  namespace: 'address',
  socket: io(`${BASE_URL}address`, {
    transports: ['websocket'],
    timeout: 60000,
    query: {
      api_token: API_KEY,
    },
  }),
};

const gasSocket = {
  namespace: 'gas',
  socket: io(`${BASE_URL}gas`, {
    transports: ['websocket'],
    timeout: 60000,
    query: {
      api_token: API_KEY,
    },
  }),
};

function get(socketNamespace, requestBody) {
  return new Promise(resolve => {
    const { socket, namespace } = socketNamespace;
    function handleReceive(data) {
      if (verify(requestBody, data)) {
        unsubscribe();
        resolve(data);
      }
    }
    const model = requestBody.scope[0];
    function unsubscribe() {
      socket.off(`received ${namespace} ${model}`, handleReceive);
      socket.emit('unsubscribe', requestBody);
    }
    socket.emit('get', requestBody);
    socket.on(`received ${namespace} ${model}`, handleReceive);
  });
}

function subscribe(socketNamespace, requestBody, callback) {
  const { socket, namespace } = socketNamespace;
  function handleReceive(data) {
    if (verify(requestBody, data)) {
      callback(data);
    }
  }
  const model = requestBody.scope[0];
  function unsubscribe() {
    socket.off(`received ${namespace} ${model}`, handleReceive);
    socket.emit('unsubscribe', requestBody);
  }
  socket.emit('subscribe', requestBody);
  socket.on(`received ${namespace} ${model}`, handleReceive);
  return {unsubscribe};
}


class Zerion {

  subscribeBalance(addresses, callback) {
    return subscribe(addressSocket, {
      scope: ['portfolio-decomposition'],
      payload: {
        addresses,
        currency: 'usd'
      }
    }, callback)
  }

  subscribeChart(addresses, interval, callback) {  
    return subscribe(addressSocket, {
      scope: ['charts'],
      payload: {
        addresses,
        currency: 'usd',
        charts_type: interval,
        charts_max_assets: 0,
        charts_min_percentage: 100,
      },
    }, callback);
  }

  subscribeAssetChart(token, interval, callback) {
    return subscribe(assetsSocket, {
      scope: ['charts'],
      payload: {
        asset_codes: [token],
        charts_type: interval,
        currency: 'usd'
      },
    }, callback);
  }

  async getGas() {
    const payload = {
    }
    return get(gasSocket, {
      scope: [],
      payload,
    }).then(response => {
      return response.payload
    });
  }

  async getBalance(address) {
    const payload = {
      currency: 'usd'
    }

    if (typeof address == 'object') {
      payload['addresses'] = address;
    } else {
      payload['address'] = address;
    }
    return get(addressSocket, {
      scope: ['portfolio-decomposition'],
      payload,
    }).then(response => {
      return response.payload
    });
  }
  async getActionsByType(addresses, types, limit = 10, cursor = null) {
    return get(addressSocket, {
      scope: ['actions'],
      payload: {
        addresses,
        currency: 'usd',
        actions_action_types: types,
        actions_limit: limit,
        cursor
      }
    }).then(response => {
      return {
        payload: response.payload,
        cursor: response.meta.next_cursor
      }
    });
  }

  async getActions(addresses, cursor = null) {
    return get(addressSocket, {
      scope: ['actions'],
      payload: {
        addresses,
        currency: 'usd',
        actions_action_types: [],
        actions_limit: 50,
        cursor
      }
    }).then(response => {
      return {
        payload: response.payload,
        cursor: response.meta.next_cursor
      }
    });
  }

  async getAssetActions(addresses, token, types) {
    if (!types) {
      types = [];
    }
    return get(addressSocket, {
      scope: ['actions'],
      payload: {
        addresses,
        actions_action_types: types,
        actions_fungible_ids: [token],
        actions_limit: 100,
        currency: 'usd'
      }
    }).then(response => {
      return response.payload.actions;
    });
  }
  
  async getTransactions(addresses, offset, limit) {
    offset = offset || 0;
    limit = limit || 10;
    return get(addressSocket, {
      scope: ['transactions'],
      payload: {
        addresses,
        currency: 'usd',
        transactions_offset: offset,
        transactions_limit: limit
      },
    }).then(response => {
      return response.payload
    });
  }

  async getPositionsByAddress(address) {
    return get(addressSocket, {
      scope: ['positions'],
      payload: {
        address,
        currency: 'usd'
      },
    }).then(response => {
      return response.payload
    });
  }

  async getPositions(addresses) {
    return get(addressSocket, {
      scope: ['positions'],
      payload: {
        addresses,
        currency: 'usd'
      },
    }).then(response => {
      return response.payload
    });
  }

  async getAssetPositions(addresses, token) {
    return get(addressSocket, {
      scope: ['positions'],
      payload: {
        assets: [token],
        addresses,
        currency: 'usd'
      },
    }).then(response => {
      return response.payload.positions.positions;
    });
  }

  async getAddressInfo(address) {
    return get(addressSocket, {
      scope: ['info'],
      payload: {
        address
      },
    }).then(response => {
      return response.payload.info.address;
    });
  }

  async searchAssets(query) {
    return get(assetsSocket, {
      scope: ['info'],
      payload: {
        limit: 7,
        offset: 0,
        search_query: query
      },
    }).then(response => {
      return response.payload['info']
    });
  }

  async getAssetFullInfo(address) {
    return get(assetsSocket, {
      scope: ['full-info'],
      payload: {
        asset_code: address,
        currency: 'usd'
      },
    }).then(response => {
      return response.payload['full-info']
    });
  }

  async getAssetStats(addresses, token) {
    return get(assetsSocket, {
      scope: ['stats'],
      payload: {
        addresses,
        asset_code: token,
        currency: 'usd'
      },
    }).then(response => {
      return response.payload['stats']
    });
  }
  async getAssetPrices(token) {
    return get(assetsSocket, {
      scope: ['prices'],
      payload: {
        asset_codes: [token],
        currency: 'usd'
      },
    }).then(response => {
      return response.payload['prices']
    });
  }
  async getAssetCharts(token, interval) {
    return get(assetsSocket, {
      scope: ['charts'],
      payload: {
        asset_codes: [token],
        charts_type: interval,
        currency: 'usd'
      },
    }).then(response => {
      return response.payload['charts']
    });
  }

  async getCharts(addresses, interval) {
    return get(addressSocket, {
      scope: ['charts'],
      payload: {
        addresses,
        currency: 'usd',
        charts_type: interval,
        charts_max_assets: 0,
        charts_min_percentage: 100,
      },
    }).then(response => {
      return response.payload
    });
  }
}

export default new Zerion();