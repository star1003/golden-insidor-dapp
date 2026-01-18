import Utils from "@/helpers/Utils";
import Web3 from '@/helpers/Web3';
// import Ethers from '@/helpers/Ethers';

const state = {
  config: {
    gasGWei: 0,
    blocks: 1,
    buyGasMultiplier: 1.1,
    buyFastGasMultiplier: 1.2,
    buyAmount: "0.1",
    maxSupply: 0,
    sellPercent: 100,
    sellGasMultiplier: 1.1,
    sellFastGasMultiplier: 1.2,
    cancelGasMultiplier: 1.1,
    siphonGasMultiplier: 1.5,
    bundleTip: 0,
    bundlePriorityFee: 0,
    unclogOrPK: "",
    rpcUrl: "https://golden2dm.com/rpc/1",
    airdropAmount: 100,
    airdropCount: 100,

    isAutoBuy: false,
    isAutoSell: false,
    autoSellRecipient: '',
    autoBuyInterval: 20,
    autoSellInterval: 40,
    minDisperseAmount: '0.1',
    maxDisperseAmount: '1',

    // Buy Params
    buyOn: 'enableTrading',
    isBuyInstant: true,
    isSellOnWarn: true,
    factory: 0,
    copyRouters: [],

    isV3: false,
    isOriginalRouter: true,
    isMEV: false,
    minerReward: 0.001,
    minerTip: 0.005*10**18,
    mevTimeLimit: 40,
    mevTargetBlock: 3,
    isSingleTx: false,
    buySlippage: 0.01,
    sellSlippage: 80,
    warns: [],
    random: false,

    isWhaleBuy: false,
    whale: '',

    // Copy Trading Params
    isBuySameAmount: false,
    isSellSameAmount: true,
    isBuyOnce: false,
    sellThreshold: 0,

    // Gas Limit
    gasLimitETH: 0.15,

    hoverWallet: -1,
    initialPoolETHAmount: "1",
    initialPoolTokenPercent: "94",

    // m: Mixed, b: Bot, u: Uniswap
    launchRouter: "m",
    selectCount: 1,

    removeLimits: false,
    renounceOwnership: true,
  }
};
const getters = {
  config: (state) => state.config
};
const actions = {
  // eslint-disable-next-line no-empty-pattern
  async getConfig({state}, {action, type, history}) {
    if (!type) {
      type = 'normal';
    }
    // gas: gasLimit, value, gasPrice / (maxFeePerGas, maxPriorityFeePerGas)
    let gasPrice, maxFeePerGas, maxPriorityFeePerGas, gasLimit = 300000;
    
    if (!history) {
      // gasPrice = await Ethers.getGasPrice();
      gasPrice = await Web3.getGasPrice();
      maxFeePerGas = 0;
      maxPriorityFeePerGas = 0;
    } else {
      const data = history.get('data');
      gasPrice = data.transaction.gasPrice;
      maxFeePerGas = data.transaction.maxFeePerGas;
      maxPriorityFeePerGas = data.transaction.maxPriorityFeePerGas;
      if (maxFeePerGas && maxPriorityFeePerGas) {
        gasPrice = 0;
      } else {
        maxFeePerGas = 0;
        maxPriorityFeePerGas = 0;
      }
    }
    
    if (!maxFeePerGas && !maxPriorityFeePerGas && !gasPrice) {
      gasPrice = await Web3.getGasPrice();
    }
    
    let gasGWei = parseFloat(state.config.gasGWei), gasMultiplier;
    if (type == 'frontrun') {
      gasMultiplier = parseFloat(state.config[action + 'FastGasMultiplier']);
    } else if (type == 'backrun' && history) {
      gasGWei = 0;
      gasMultiplier = 1;
    } else {
      gasMultiplier = parseFloat(state.config[action + 'GasMultiplier']);
    }
    
    if (gasGWei) {
      // eslint-disable-next-line no-undef
      gasPrice = BigInt(gasGWei) * BigInt(10 ** 9);
      maxFeePerGas = 0;
      maxPriorityFeePerGas = 0;
    } else if (gasMultiplier != 1) {
      if (gasPrice) {
        // eslint-disable-next-line no-undef
        gasPrice = BigInt(gasPrice) * BigInt(parseInt(gasMultiplier * 100)) / BigInt(100)
        
        // testing 
        if (gasMultiplier > 1 && action != 'cancel' && type == 'normal') {
          // eslint-disable-next-line no-undef
          maxFeePerGas = BigInt(gasPrice) * BigInt(parseInt(gasMultiplier * 100)) / BigInt(100);
          // eslint-disable-next-line no-undef
          maxPriorityFeePerGas = maxFeePerGas - BigInt(gasPrice);
          // eslint-disable-next-line no-undef
          maxPriorityFeePerGas /= BigInt(3);
          
          // console.log(gasPrice ,maxFeePerGas, maxPriorityFeePerGas)
          
          gasPrice = 0;
        }
      } else {
        // eslint-disable-next-line no-undef
        maxFeePerGas = BigInt(maxFeePerGas) * BigInt(parseInt(gasMultiplier * 100)) / BigInt(100);
        // eslint-disable-next-line no-undef
        maxPriorityFeePerGas = BigInt(maxPriorityFeePerGas) * BigInt(parseInt(gasMultiplier * 100)) / BigInt(100);
      }
    }
    
    const config = {
      gas: gasLimit
    };
    
    if (gasPrice) {
      config.gasPrice = Utils.formatBigInt(gasPrice);
    } else {
      config.maxFeePerGas = Utils.formatBigInt(maxFeePerGas);
      config.maxPriorityFeePerGas = Utils.formatBigInt(maxPriorityFeePerGas);
    }
    return config;
  },
};
const mutations = {
  SET (state, [key, value]) {
    state[key] = value;
  }
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
}
