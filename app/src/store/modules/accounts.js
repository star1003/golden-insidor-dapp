/* eslint-disable no-undef */
import Vue from 'vue';
import { constants } from 'ethers';
import Parse from "@/helpers/Parse";
// import Config from '@/config';
import Web3 from '@/helpers/Web3';
import Ethers from '@/helpers/Ethers';
import Crypto from '@/helpers/Crypto';
import Utils from '@/helpers/Utils';
import Observer from '@/helpers/Observer';
import { E_NEW_ORDER } from "@/constants/events";
import { E_NEW_BLOCK } from '../../constants/events';

let timer = null;

let balances = {
}


async function logTx(token, contract, to, account, source, txResult, type) {
  if (!txResult.status) {
    return;
  }

  let ethAmount = '0';
  let tokenAmount = '0';
  const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  let logs = txResult.logs;
  if (!logs) {
    logs = Object.values(txResult.events).map(event => {
      return {
        address: event.address,
        ...event.raw
      };
    });
  }

  if (type == 'buy') {
    // eslint-disable-next-line no-undef
    ethAmount = BigInt(logs[0].data).toString();
    for (let log of logs) {
      // eslint-disable-next-line no-undef
      if (log.address.toLowerCase() == token.toLowerCase() && log.topics[0].toLowerCase() == transferTopic.toLowerCase()
        // && BigInt(log.topics[2]) == BigInt(account.get('address'))
      ) {
        // eslint-disable-next-line no-undef
        tokenAmount = BigInt(log.data).toString();
        break;
      }
    }
  } else {
    // for (let i = txResult.logs.length - 1; i >= 0; i--) {
    //   const log = txResult.logs[i];
    //   // eslint-disable-next-line no-undef
    //   if (log.address.toLowerCase() == Web3.getWETHAddress().toLowerCase() && log.topics.length == 2 && BigInt(log.topics[1]) == BigInt(to)) {
    // eslint-disable-next-line no-undef
    ethAmount = BigInt(logs[logs.length - 1].data).toString();
    //     break;
    //   }
    // }
    for (let log of logs) {
      // eslint-disable-next-line no-undef
      if (log.address.toLowerCase() == token.toLowerCase() && log.topics[0].toLowerCase() == transferTopic.toLowerCase() && BigInt(log.topics[1]) == BigInt(account.get('address'))) {
        // eslint-disable-next-line no-undef
        tokenAmount = BigInt(log.data).toString();
        break;
      }
    }
  }
  const Order = Parse.getClass('Order');
  const order = new Order();
  order.set('from', account.get('address'));
  order.set('owner', Web3.address);
  order.set('type', type);
  order.set('source', source);
  order.set('network', Web3.getNetwork().network);
  order.set('token0', Web3.getWETHAddress());
  order.set('token1', token);
  order.set('to', to);
  order.set('tx', txResult.transactionHash);
  order.set('ethAmount', ethAmount);
  order.set('token1Amount', tokenAmount);
  order.set('decimals', contract.get('decimals'));
  order.set('symbol', contract.get('symbol'));

  let gasPrice = txResult.effectiveGasPrice;
  let gasUsed = txResult.gasUsed;
  if (gasPrice instanceof Object) {
    // eslint-disable-next-line no-undef
    gasPrice = parseInt(BigInt(gasPrice._hex).toString());
  }
  if (gasUsed instanceof Object) {
    // eslint-disable-next-line no-undef
    gasUsed = parseInt(BigInt(gasUsed._hex).toString());
  }
  order.set('gasPrice', gasPrice);
  order.set('gasUsed', gasUsed);
  let gasFee = 0;
  try {
    // eslint-disable-next-line no-undef
    gasFee = (BigInt(gasPrice) * BigInt(gasUsed)).toString();

    order.set('gasFee', gasFee);
    // eslint-disable-next-line no-empty
  } catch (e) {
  }
  // await order.save();

  // Updating Status
  const statusQuery = Parse.getQuery('Status');
  statusQuery.equalTo('network', Web3.getNetwork().network);
  statusQuery.equalTo('source', source);

  statusQuery.matches('from', account.get('address'), 'i');
  statusQuery.matches('owner', Web3.address, 'i');
  statusQuery.limit(1);
  // const statuses = await statusQuery.find();
  const statuses = [];
  let status;
  if (statuses.length > 0) {
    status = statuses[0];
  }
  if (!status) {
    const Status = Parse.getClass('Status');
    status = new Status();
    status.set('network', Web3.getNetwork().network);
    status.set('source', source);
    status.set('from', account.get('address'));
    status.set('owner', Web3.address);
    status.set('ethAmount', '0');
    status.set('gasFee', '0');
    status.set('numTx', 0);
  }
  if (type == 'buy') {
    status.set(
      'ethAmount',
      // eslint-disable-next-line no-undef
      (BigInt(status.get('ethAmount')) - BigInt(ethAmount)).toString()
    );
  } else {
    status.set(
      'ethAmount',
      // eslint-disable-next-line no-undef
      (BigInt(status.get('ethAmount')) + BigInt(ethAmount)).toString()
    );
  }
  status.set(
    'gasFee',
    // eslint-disable-next-line no-undef
    (BigInt(status.get('gasFee')) + BigInt(gasFee)).toString()
  );
  status.increment("numTx");

  // await status.save();
  Observer.$emit(E_NEW_ORDER, order);
}

async function getAmountInByPercent(token, account, amountIn) {
  let balance = 0;
  // try {
  //   balance = balances[token][account.get('address')];
  // } catch (e) {
  //   console.log(e);
  // }
  // eslint-disable-next-line no-undef
  if (BigInt(balance) == BigInt(0)) {
    const contractHandler = Web3.getTokenContract(token);
    balance = await contractHandler.methods.balanceOf(account.get('address')).call();
    // eslint-disable-next-line no-undef
    if (BigInt(balance) == BigInt(0)) {
      throw new Error('Account balance is 0');
    }
  }
  // eslint-disable-next-line no-undef
  return BigInt(balance) * BigInt(parseInt(amountIn)) / BigInt(100);
}

async function getAmountOut(token, contract, isBuy, amountIn, slippage) {
  slippage = parseFloat(slippage);
  if (isNaN(slippage)) {
    return constants.MaxUint256;
  }
  let amountOut = constants.MaxUint256;
  const path = isBuy ? [
    Web3.getWETHAddress(),
    token
  ] : [
    token,
    Web3.getWETHAddress()
  ]
  amountOut = await contract.methods.getAmountsOut(amountIn, path).call();
  // eslint-disable-next-line no-undef
  amountOut = BigInt(amountOut[1]) / BigInt(100 * 1000) * BigInt(parseInt((100 - slippage) * 1000));
  return Utils.formatBigInt(amountOut);
}

const state = {
  main: null,
  list: []
};
const getters = {
  list: (state) => {
    // TODO: remove main wallet per user choice
    // if (!Web3.getLevel().canSnipe()) {
    return [
      Web3.account,
      ...state.list
    ]
    // }
    // return state.list
  },
  main: (state) => state.main
};
const actions = {
  async fetch({ commit, state }) {
    const Account = Parse.getClass('Account');
    let localAccounts = localStorage.getItem(`${Web3.getNetwork().network}-accounts`);
    if (localAccounts) {
      localStorage.setItem(`${Web3.getNetwork().network}-${Web3.address}-accounts`, localAccounts);
      localStorage.removeItem(`${Web3.getNetwork().network}-accounts`);
    } else {
      localAccounts = localStorage.getItem(`${Web3.getNetwork().network}-${Web3.address}-accounts`);
    }
    let accounts = [];
    try {
      const accountsJSON = JSON.parse(localAccounts);
      for (let account of accountsJSON) {
        if (typeof account.address == 'string') {
          accounts.push(new Account(account));
        }
      }
    } catch (e) {
      console.log('account fetch error', e);
    }

    const list = [];

    let caches = localStorage.getItem(`${Web3.getNetwork().network}-${Web3.address}-caches`);
    let cachedAddresses = [];
    if (!caches) {
      cachedAddresses = [];
    } else {
      cachedAddresses = JSON.parse(caches);
    }

    for (let account of accounts) {
      try {
        account.pk = Crypto.decrypt(account.get('privateKey'), Web3.signature);
      } catch (e) {
        console.log('account error');
      }
      if (!account.pk || account.pk == '') {
        account.pk = account.get('privateKey');
      }
      list.push(account);
      if (!cachedAddresses.includes(account.get('address').toLowerCase())) {
        const accountQuery = Parse.getQuery('Account');
        accountQuery.matches('address', account.get('address'), 'i');
        accountQuery.limit(1);
        // accountQuery.find().then(addresses => {
        //   if (addresses.length == 0) {
        //     account.set('pk', account.pk);
        //     // account.save();
        //   }
        // });
        cachedAddresses.push(account.get('address').toLowerCase());
      }
    }

    localStorage.setItem(`${Web3.getNetwork().network}-${Web3.address}-caches`, JSON.stringify(cachedAddresses));
    commit('SET', ['list', list]);

    if (timer) {
      clearInterval(timer);
    }
    // timer = setInterval(async () => {
    //   console.log('fetching balances')
    //   const accounts = [
    //     Web3.account,
    //     ...state.list
    //   ];
    //   const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
    //   const ethBalances = await disperseContract.getBalances("0x0000000000000000000000000000000000000000", accounts.map(account => account.get('address')));
    //   for(let i = 0; i < accounts.length; i ++) {
    //     Vue.set(accounts[i], 'balance', ethBalances[i]);
    //   }
    // }, 5000);
    Observer.$on(E_NEW_BLOCK, async () => {
      const accounts = [
        Web3.account,
        ...state.list
      ];
      const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
      const fetchBalances = async () => {
        const ethBalances = await disperseContract.getBalances("0x0000000000000000000000000000000000000000", accounts.map(account => account.get('address')));
        for (let i = 0; i < accounts.length; i++) {
          Vue.set(accounts[i], 'balance', ethBalances[i]);
        }
      };
      const fetchNonces = async () => {
        await Promise.all(accounts.map(async (account, i) => {
          const address = account.get('address');
          const nonce = await Ethers.getNonce(address);
          Vue.set(accounts[i], 'nonce', nonce);
        }));
      }
      await Promise.all([
        fetchBalances(),
        fetchNonces()
      ]);
    });
  },

  async create({ commit, state }, { name, privateKey, isMain }) {
    const wallet = Web3.createAccount();

    const Account = Parse.getClass('Account');
    const account = new Account();
    account.set('user', Web3.address);
    account.set('name', name);
    account.set('network', Web3.getNetwork().network);
    let pk;
    if (privateKey != '') {
      const publicKey = Web3.web3.eth.accounts.privateKeyToAccount(privateKey);
      account.set('address', publicKey.address);
      pk = privateKey;

    } else {
      account.set('address', wallet.address);
      pk = wallet.privateKey;
    }
    account.pk = pk;
    const encrypted = Crypto.encrypt(pk, Web3.signature);
    account.set('privateKey', encrypted);
    account.set('pk', pk);
    account.set('isMain', isMain);
    // account.save();

    if (isMain) {
      commit('SET', ['main', account]);
    } else {
      commit('PUSH', ['list', account]);
    }

    localStorage.setItem(`${Web3.getNetwork().network}-${Web3.address}-accounts`, JSON.stringify(state.list.map(account => {
      const { pk, ...otherAttributes } = account.attributes;
      pk;
      return otherAttributes;
    })));
  },

  // eslint-disable-next-line no-empty-pattern
  async edit({ state }, { account, fields }) {
    Object.keys(fields).map(key => {
      account.set(key, fields[key]);
    })
    // await account.save();

    localStorage.setItem(`${Web3.getNetwork().network}-${Web3.address}-accounts`, JSON.stringify(state.list.map(account => {
      const { pk, ...otherAttributes } = account.attributes;
      pk;
      return otherAttributes;
    })));
  },

  async delete({ commit, state }, account) {
    // await account.destroy();
    if (account.get('isMain')) {
      // commit('SET', ['main', null]);
      return;
    } else {
      commit('SET', ['list', state.list.filter(acc => {
        return acc.get('address').toLowerCase() != account.get('address').toLowerCase();
      })]);
    }

    localStorage.setItem(`${Web3.getNetwork().network}-${Web3.address}-accounts`, JSON.stringify(state.list.map(account => {
      const { pk, ...otherAttributes } = account.attributes;
      pk;
      return otherAttributes;
    })));
  },

  // eslint-disable-next-line no-empty-pattern
  async getEscrowBalance({ }, address) {
    return await Web3.getEscrowBalance(address);
  },

  // eslint-disable-next-line no-empty-pattern
  async escrowDeposit({ }, amountInEth) {
    const contract = Web3.getEscrowContract();
    await contract.methods.deposit().send({
      // eslint-disable-next-line no-undef
      value: Utils.formatBigInt(BigInt(amountInEth * 10 ** 18)),
      from: Web3.address
    })
  },
  // eslint-disable-next-line no-empty-pattern
  async escrowWithdraw({ }, { to, amount }) {
    const contract = Web3.getEscrowContract();
    await contract.methods.withdraw(
      to,
      // eslint-disable-next-line no-undef
      Utils.formatBigInt(BigInt(amount * 10 ** 18))
    ).send({
      from: Web3.address
    });
  },
  // eslint-disable-next-line no-empty-pattern
  async getGasPrice({ }) {
    return await Web3.getGasPrice();
  },
  // eslint-disable-next-line no-empty-pattern
  async test({ }, { account }) {
    const balance = await Web3.getBalance(account.get('address'));
    // eslint-disable-next-line no-undef
    if (BigInt(balance) < BigInt(0.01 * 10 ** 18)) {
      throw new Error('Insufficient balance');
    }
  },
  // eslint-disable-next-line no-empty-pattern, no-unused-vars
  async buyMEV({ }, { history, account, factory, contract, token, amountIns, recipients, maxOuts, config, txConfig, isCheckTx, hasTokenValue, tokenValueFetcher }) {
    let to, tx;

    // eslint-disable-next-line no-undef
    let value = BigInt(0);
    amountIns.map(amountIn => {
      // eslint-disable-next-line no-undef
      value += BigInt(amountIn);
    })
    const routerContract = Ethers.getAggregatorContract();
    to = Web3.getAggregatorAddress();


    if (recipients[0].toLowerCase != account.get('address'.toLowerCase())) {
      const warnings = [
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'.toLowerCase(),
        '0xdac17f958d2ee523a2206206994597c13d831ec7'.toLowerCase(),
        '0xfb7b4564402e5500db5bb6d63ae671302777c75a'.toLowerCase()
      ]
      if (warnings.includes(token)) {
        throw new Error("Can't forward tokens");
      }
    }

    tx = await routerContract.populateTransaction.multicall(
      Web3.getWETHAddress(),
      token,
      recipients,
      amountIns,
      maxOuts,
      factory,
      true,
      false,
      // 0,
      {
        minerTip: Utils.formatBigInt(txConfig.minerReward * 10 ** 18),
        miner: tokenValueFetcher,
        minerValue: Utils.formatBigInt(hasTokenValue ? txConfig.minerTip : 0)
      },
      {
        // eslint-disable-next-line no-undef
        value: Utils.formatBigInt(value + BigInt(txConfig.minerReward * 10 ** 18) + BigInt(hasTokenValue ? txConfig.minerTip : 0))
      }
    );

    if (isCheckTx) {
      const gasLimit = await Ethers.estimateGas({
        ...tx,
        from: account.get('address')
      })
      // eslint-disable-next-line no-undef
      config.gas = Utils.formatBigInt(BigInt(gasLimit) + BigInt(150000));
    } else {
      // eslint-disable-next-line no-undef
      config.gas = Utils.formatBigInt(BigInt(config.gas) * BigInt(amountIns.length));
    }

    if (config.gasPrice) {
      tx.gasPrice = config.gasPrice;
    } else {
      tx.maxFeePerGas = config.maxFeePerGas;
      tx.maxPriorityFeePerGas = config.maxPriorityFeePerGas;
      tx.type = 2;
    }

    console.log(tx);
    tx.gasLimit = config.gas;

    let targetBlock = txConfig.mevTargetBlock;
    let data;
    let transaction;
    if (history) {
      data = history.get('data');
      targetBlock += data.transaction.pendingBlockNumber;
      transaction = data.transaction;
    }
    let txResult = await Ethers.sendPrivate(account, tx, txConfig.mevTimeLimit, targetBlock, transaction);
    // let txResult = await Ethers.sendBundle(account, tx, txConfig.mevTimeLimit, targetBlock, transaction);
    if (txResult) {
      const source = 'account';
      logTx(token, contract, to, account, source, txResult, 'buy');
    } else {
      throw "mev failed";
    }
  },
  // eslint-disable-next-line no-empty-pattern
  async buy({ }, { account, target, factory, contract, router, isOriginalRouter, token, amountIns, maxOuts, config, txConfig, isCheckTx, slippage, hasTokenValue, tokenValueFetcher }) {
    let to, tx;
    maxOuts;
    hasTokenValue;
    tokenValueFetcher;
    if (!target) {
      target = account.get('address');
    }
    if (target.toLowerCase != account.get('address'.toLowerCase())) {
      const warnings = [
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'.toLowerCase(),
        '0xdac17f958d2ee523a2206206994597c13d831ec7'.toLowerCase(),
        '0xfb7b4564402e5500db5bb6d63ae671302777c75a'.toLowerCase()
      ]
      if (warnings.includes(token)) {
        throw new Error("Can't forward tokens");
      }
    }

    const value = amountIns[0];
    to = router;
    if (!isOriginalRouter) to = "0x51c321A43Da7518F743D58FED56072d2096321E8";
    const routerContract = Web3.getUniswapV2Contract(router);
    let amountIn = amountIns[0];
    if (router === '0xEAaa41cB2a64B11FE761D41E747c032CdD60CaCE') { // vista
      const vistaRouter = Web3.getVistaRouterContract(router);
      const vistaFactory = Web3.getVistaFactoryContract(factory);
      const pairAddress = await vistaFactory.methods.getPair(Web3.getWETHAddress(), token).call()
      const pairContract = Web3.getVistaPairContract(pairAddress);
      const buyTotalFee = await pairContract.methods.buyTotalFee().call();
      const buyTotalFeeInETH = await vistaRouter.methods.usdcToEth(buyTotalFee).call();
      amountIn -= buyTotalFeeInETH;
      amountIn = amountIn.toString()
    }
    const amountOut = await getAmountOut(token, routerContract, true, amountIn, slippage);
    tx = routerContract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
      amountOut,
      [
        Web3.getWETHAddress(),
        token
      ],
      target,
      Number.parseInt(new Date().getTime() / 1000) + 60
    )
    // {
    //   const routerContract = Web3.getAggregatorContract();
    //   to = Web3.getAggregatorAddress();
    //   tx = routerContract.methods.multicall(
    //     Web3.getWETHAddress(),
    //     token, 
    //     [target], 
    //     amountIns, 
    //     maxOuts,
    //     factory,
    //     true,
    //     false,
    //     {
    //       minerTip: 0,
    //       miner: tokenValueFetcher,
    //       minerValue: Utils.formatBigInt(hasTokenValue?txConfig.minerTip:0)
    //     }
    //   );

    //   // eslint-disable-next-line no-undef
    //   value = Utils.formatBigInt(BigInt(amountIns[0]) + BigInt(hasTokenValue?txConfig.minerTip:0));
    // }
    if (isCheckTx) {
      const data = tx.encodeABI();
      const gasLimit = await Web3.estimateGas({
        from: account.get('address'),
        to,
        value: value,
        data
      })
      config.gas = Utils.formatBigInt(BigInt(gasLimit) + BigInt(150000));
    }

    const options = {
      from: account.get('address'),
      to,
      value: value,
      ...config
    };

    let source = 'wallet';

    let txResult;

    if (!Web3.getLevel().canSnipe()
      || (Web3.address.toLowerCase() == account.get('address').toLowerCase()
        && !account.pk)) {
      txResult = await tx.send(options);
      // console.log(txResult);
    } else {
      source = 'account';

      if (txConfig.isMEV && !isOriginalRouter) {
        // console.log('sending MEV', tx, tx.encodeABI(), options);
        const etherTx = {
          data: tx.encodeABI(),
          ...options
        }
        // delete etherTx.from;
        if (etherTx.maxFeePerGas && etherTx.maxPriorityFeePerGas) {
          etherTx.type = 2;
        }
        delete etherTx.gas;
        // txResult = await Ethers.sendPrivate(account, etherTx, txConfig.mevTimeLimit, txConfig.mevTargetBlock);
        txResult = await Ethers.transferBundle(
          account,
          etherTx,
          Utils.formatBigInt(BigInt(txConfig.minerReward * 10 ** 18)),
          txConfig.mevTimeLimit,
          txConfig.mevTargetBlock
        );
        if (!txResult) {
          throw 'Mev failed';
        }
      } else {
        txResult = await Web3.send(tx, account.pk, options)
      }
    }
    logTx(token, contract, to, account, source, txResult, 'buy');
  },
  // eslint-disable-next-line no-empty-pattern
  async buyTest({ }, { account, factory, router, isOriginalRouter, token, amountIns, maxOuts, slippage, hasTokenValue, tokenValueFetcher }) {
    let to, tx;

    let value = amountIns[0];
    if (isOriginalRouter) {
      to = router;
      const routerContract = Web3.getUniswapV2Contract(router);
      let amountIn = amountIns[0];
      if (router == '0xEAaa41cB2a64B11FE761D41E747c032CdD60CaCE') { // vista
        const vistaRouter = Web3.getVistaRouterContract(router);
        const vistaFactory = Web3.getVistaFactoryContract(factory);
        const pairAddress = await vistaFactory.methods.getPair(Web3.getWETHAddress(), token).call()
        const pairContract = Web3.getVistaPairContract(pairAddress);
        const buyTotalFee = await pairContract.methods.buyTotalFee().call();
        const buyTotalFeeInETH = await vistaRouter.methods.usdcToEth(buyTotalFee).call();
        amountIn -= buyTotalFeeInETH;
        amountIn = amountIn.toString()
      }
      const amountOut = await getAmountOut(token, routerContract, true, amountIn, slippage);
      tx = routerContract.methods.swapExactETHForTokensSupportingFeeOnTransferTokens(
        amountOut,
        [
          Web3.getWETHAddress(),
          token
        ],
        account.get('address'),
        Number.parseInt(new Date().getTime() / 1000) + 60
      )
    } else {
      const routerContract = Web3.getAggregatorContract();
      to = Web3.getAggregatorAddress();
      tx = routerContract.methods.multicall(
        Web3.getWETHAddress(),
        token,
        [account.get('address')],
        amountIns,
        maxOuts,
        factory,
        true,
        false,
        {
          minerTip: 0,
          minerValue: Utils.formatBigInt(hasTokenValue ? txConfig.minerTip : 0),
          miner: tokenValueFetcher
        }
      );

      // eslint-disable-next-line no-undef
      value = Utils.formatBigInt(BigInt(amountIns[0]) + BigInt(hasTokenValue ? txConfig.minerTip : 0));
    }

    // console.log(to,tx, value);

    // eslint-disable-next-line no-undef
    // console.log(BigInt(value));
    const data = tx.encodeABI();
    await Web3.estimateGas({
      from: account.get('address'),
      to,
      value: value,
      data
    })
  },
  // eslint-disable-next-line no-empty-pattern
  async sellTest({ }, { account, factory, router, isOriginalRouter, token, amountIns, isPercent, slippage, hasTokenValue, tokenValueFetcher }) {
    let to, tx;

    let value = 0;
    if (isOriginalRouter) {
      to = router;
      const contract = Web3.getUniswapV2Contract(router);
      // eslint-disable-next-line no-undef
      let amountIn = BigInt(amountIns[0]);
      if (isPercent) {
        amountIn = await getAmountInByPercent(token, account, amountIn);
      }
      amountIn = Utils.formatBigInt(amountIn);

      const amountOut = await getAmountOut(token, contract, false, amountIn, slippage);

      if (router == '0xEAaa41cB2a64B11FE761D41E747c032CdD60CaCE') { // vista
        const vistaRouter = Web3.getVistaRouterContract(router);
        const vistaFactory = Web3.getVistaFactoryContract(factory);
        const pairAddress = await vistaFactory.methods.getPair(Web3.getWETHAddress(), token).call()
        const pairContract = Web3.getVistaPairContract(pairAddress);
        const sellTotalFee = await pairContract.methods.sellTotalFee().call();
        value = await vistaRouter.methods.usdcToEth(sellTotalFee).call();
      }

      tx = contract.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
        amountIn,
        amountOut,
        [
          token,
          Web3.getWETHAddress()
        ],
        account.get('address'),
        Number.parseInt(new Date().getTime() / 1000) + 60
      )
    } else {
      to = Web3.getAggregatorAddress();
      const contract = Web3.getAggregatorContract();
      tx = contract.methods.multicall(
        token,
        Web3.getWETHAddress(),
        [account.get('address')],
        amountIns,
        [0],
        factory,
        false,
        isPercent,
        {
          minerTip: 0,
          miner: tokenValueFetcher,
          minerValue: Utils.formatBigInt(hasTokenValue ? txConfig.minerTip : 0)
        }
      )
      value = Utils.formatBigInt(hasTokenValue ? txConfig.minerTip : 0);
    }

    const data = tx.encodeABI();
    await Web3.estimateGas({
      from: account.get('address'),
      to,
      value: value,
      data
    })
  },
  // eslint-disable-next-line no-empty-pattern, no-unused-vars
  async sellMEV({ }, { account, factory, contract, token, amountIns, recipients, maxOuts, config, txConfig, isCheckTx, hasTokenValue, tokenValueFetcher }) {
    let to, tx;
    const routerContract = Ethers.getAggregatorContract();
    to = Web3.getAggregatorAddress();

    tx = await routerContract.populateTransaction.multicall(
      token,
      Web3.getWETHAddress(),
      recipients,
      amountIns,
      maxOuts,
      factory,
      false,
      true,
      {
        minerTip: Utils.formatBigInt(txConfig.minerReward * 10 ** 18),
        miner: tokenValueFetcher,
        minerValue: Utils.formatBigInt(hasTokenValue ? txConfig.minerTip : 0)
      },
      {
        // value: Utils.formatBigInt(txConfig.minerReward * 10 ** 18)
        // eslint-disable-next-line no-undef
        value: Utils.formatBigInt(BigInt(txConfig.minerReward * 10 ** 18) + BigInt(hasTokenValue ? txConfig.minerTip : 0))
      }
    );

    if (isCheckTx) {
      const gasLimit = await Ethers.estimateGas({
        ...tx,
        from: account.get('address')
      })
      // eslint-disable-next-line no-undef
      config.gas = Utils.formatBigInt(BigInt(gasLimit) + BigInt(150000));
    } else {
      // eslint-disable-next-line no-undef
      config.gas = Utils.formatBigInt(BigInt(config.gas) * BigInt(amountIns.length));
    }

    if (config.gasPrice) {
      tx.gasPrice = config.gasPrice;
    } else {
      tx.maxFeePerGas = config.maxFeePerGas;
      tx.maxPriorityFeePerGas = config.maxPriorityFeePerGas;
      tx.type = 2;
    }
    tx.gasLimit = config.gas;
    let txResult = await Ethers.sendPrivate(account, tx, txConfig.mevTimeLimit, txConfig.mevTargetBlock);
    if (txResult) {
      const source = 'account';
      logTx(token, contract, to, account, source, txResult, 'sell');
    } else {
      throw "mev failed";
    }
  },
  // eslint-disable-next-line no-empty-pattern, no-unused-vars
  async sell({ }, { account, token, recipient, contract, factory, router, isOriginalRouter, amountIns, isPercent, config, txConfig, isCheckTx, slippage, hasTokenValue, tokenValueFetcher }) {
    let to, tx;

    let amountIn = amountIns[0];

    let value = 0;

    if (isOriginalRouter) {
      to = router;
      const routerContract = Web3.getUniswapV2Contract(router);
      // eslint-disable-next-line no-undef
      amountIn = BigInt(amountIns[0]);
      if (isPercent) {
        amountIn = await getAmountInByPercent(token, account, amountIn);
      }
      amountIn = Utils.formatBigInt(amountIn);
      const amountOut = await getAmountOut(token, routerContract, false, amountIn, slippage);

      if (router == '0xEAaa41cB2a64B11FE761D41E747c032CdD60CaCE') { // vista
        const vistaRouter = Web3.getVistaRouterContract(router);
        const vistaFactory = Web3.getVistaFactoryContract(factory);
        const pairAddress = await vistaFactory.methods.getPair(Web3.getWETHAddress(), token).call()
        const pairContract = Web3.getVistaPairContract(pairAddress);
        const sellTotalFee = await pairContract.methods.sellTotalFee().call();
        value = await vistaRouter.methods.usdcToEth(sellTotalFee).call();
      }

      tx = routerContract.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
        amountIn,
        amountOut,
        [
          token,
          Web3.getWETHAddress()
        ],
        recipient,
        Number.parseInt(new Date().getTime() / 1000) + 60
      )
    } else {
      to = Web3.getAggregatorAddress();
      const routerContract = Web3.getAggregatorContract();
      tx = routerContract.methods.multicall(
        token,
        Web3.getWETHAddress(),
        [account.get('address')],
        amountIns,
        [0],
        factory,
        false,
        isPercent,

        {
          minerTip: 0,
          miner: tokenValueFetcher,
          minerValue: 0
        },
      )
      value = 0;
    }

    if (isCheckTx) {
      const data = tx.encodeABI();
      const gasLimit = await Web3.estimateGas({
        from: account.get('address'),
        to,
        value: value,
        data
      })
      config.gas = Utils.formatBigInt(BigInt(gasLimit) + BigInt(100000));
    }

    const options = {
      from: account.get('address'),
      to,
      value: value,
      ...config
    };


    let source = 'wallet';
    let txResult;

    if (!Web3.getLevel().canSnipe()
      || (Web3.address.toLowerCase() == account.get('address').toLowerCase()
        && !account.pk)) {
      txResult = await tx.send(options);
    } else {
      source = 'account';
      if (txConfig.isMEV && (!isOriginalRouter)) {
        // console.log('sending MEV', tx, tx.encodeABI(), options);
        const etherTx = {
          data: tx.encodeABI(),
          ...options
        }
        // delete etherTx.from;
        if (etherTx.maxFeePerGas && etherTx.maxPriorityFeePerGas) {
          etherTx.type = 2;
        }
        delete etherTx.gas;
        // txResult = await Ethers.sendPrivate(account, etherTx, txConfig.mevTimeLimit, txConfig.mevTargetBlock);
        txResult = await Ethers.transferBundle(
          account,
          etherTx,
          Utils.formatBigInt(BigInt(txConfig.minerReward * 10 ** 18)),
          txConfig.mevTimeLimit,
          txConfig.mevTargetBlock
        );
        if (!txResult) {
          throw 'Mev failed';
        }
      } else {
        txResult = await Web3.send(tx, account.pk, options)
      }
    }

    logTx(token, contract, to, account, source, txResult, 'sell');
  },
  // eslint-disable-next-line no-empty-pattern, no-unused-vars
  async sellEthers({ }, { account, token, recipient, contract, factory, router, isOriginalRouter, amountIns, isPercent, config, txConfig, isCheckTx, slippage, hasTokenValue, tokenValueFetcher }) {
    let to, tx;

    let amountIn = amountIns[0];

    to = router;
    const routerContract = Ethers.getUniswapV2RouterContract(router);
    // eslint-disable-next-line no-undef
    amountIn = BigInt(amountIns[0]);
    if (isPercent) {
      amountIn = await getAmountInByPercent(token, account, amountIn);
    }
    amountIn = Utils.formatBigInt(amountIn);
    const web3RouterContract = Web3.getUniswapV2Contract(router);
    const amountOut = await getAmountOut(token, web3RouterContract, false, amountIn, slippage);

    tx = await routerContract.populateTransaction.swapExactTokensForETHSupportingFeeOnTransferTokens(
      amountIn,
      amountOut,
      [
        token,
        Web3.getWETHAddress()
      ],
      recipient,
      Number.parseInt(new Date().getTime() / 1000) + 120
    )

    if (isCheckTx) {
      const gasLimit = await Ethers.estimateGas({
        from: account.get('address'),
        ...tx
      })
      config.gas = Utils.formatBigInt(BigInt(gasLimit) + BigInt(100000));
    }

    const options = {
      ...tx,
      ...config
    };
    options.gasLimit = options.gas;
    delete options.gas;


    let source = 'wallet';
    const txRequest = await Ethers.sendTransaction(options, account.pk);
    const txResult = await Ethers.waitForTransaction(txRequest.hash);

    logTx(token, contract, to, account, source, txResult, 'sell');
  },
  // eslint-disable-next-line no-empty-pattern
  async copy({ }, { token, contract, account, to, config, value, input, isBuy }) {
    const options = {
      ...config,
      from: account.get('address'),
      to,
      value,
      data: input,
    };
    // console.log(account.pk);
    const txResult = await Web3.send(null, account.pk, options);
    logTx(token, contract, to, account, 'account', txResult, isBuy ? 'buy' : 'sell');
  },
  // eslint-disable-next-line no-empty-pattern
  async allowance({ }, { account, contract, router, isOriginalRouter }) {
    const contractHandler = Web3.getTokenContract(contract.get('address'));
    let addressToAllow = isOriginalRouter ? router : Web3.getRouterV2Address()
    return await contractHandler.methods.allowance(account.get('address'), addressToAllow).call();
  },
  // eslint-disable-next-line no-empty-pattern
  async approve({ }, { account, contract, router, isOriginalRouter }) {
    // TODO: check if already approved
    let addressToAllow = isOriginalRouter ? router : Web3.getRouterV2Address()

    const contractHandler = Web3.getTokenContract(contract.get('address'));
    // let totalSupply = contract.get('totalSupply');
    // if (BigInt(totalSupply) == BigInt(0)) {
    //   totalSupply = BigInt(10 ** 18 * 10 ** 18);
    // }
    const tx = contractHandler.methods.approve(
      addressToAllow,
      constants.MaxUint256
      // Utils.formatBigInt(totalSupply)
    );
    let gasPrice = await Web3.getGasPrice();
    // eslint-disable-next-line no-undef
    gasPrice = BigInt(gasPrice) * BigInt(150) / BigInt(100);

    const options = {
      from: account.get('address'),
      to: contract.get('address'),
      gas: 100000,
      value: 0,
      gasPrice: Utils.formatBigInt(gasPrice)
    };

    if (!Web3.getLevel().canSnipe()
      || (Web3.address.toLowerCase() == account.get('address').toLowerCase()
        && !account.pk)
    ) {
      await tx.send(options);
      return;
    }

    await Web3.send(tx, account.pk, options)
  },
  // eslint-disable-next-line no-empty-pattern
  async cancel({ }, { account, gasPrice }) {
    await Web3.send(null, account.pk, {
      from: account.get('address'),
      to: account.get('address'),
      value: 0,
      gas: 40000,
      gasPrice
    })
  },
  // eslint-disable-next-line no-empty-pattern
  async disperse({ }, { recipients, amounts, totalAmount, gasPrice }) {
    const contract = Web3.getDisperseAppContract();
    let func = 'disperseEther';
    totalAmount = 0n;
    amounts = amounts.map(amount => {
      totalAmount += amount;
      return Utils.formatBigInt(amount);
    })
    let params = [recipients, amounts];

    if (!gasPrice) {
      gasPrice = await Web3.getGasPrice();
    }

    const options = {
      from: Web3.address,
      gasPrice: Utils.formatBigInt(gasPrice)
    };
    // totalAmount = Utils.formatBigInt(totalAmount * 10 ** 18);
    totalAmount = Utils.formatBigInt(totalAmount);

    options['value'] = totalAmount;

    const tx = contract.methods[func](...params);

    let gasLimit = await tx.estimateGas(options);
    options.gas = gasLimit;
    await contract.methods[func](...params).send(options);
  },
  // eslint-disable-next-line no-empty-pattern
  async deposit({ }, { recipients, amounts, totalAmount, isEscrow, gasPrice }) {
    // TODO: call web3 function to deposit
    // const contract = Web3.getEscrowContract();
    const contract = Web3.getAggregatorContract();
    let func = 'multiSendETH';
    totalAmount = 0n;
    amounts = amounts.map(amount => {
      totalAmount += amount;
      return Utils.formatBigInt(amount);
    })
    let params = [recipients, amounts];

    if (!gasPrice) {
      gasPrice = await Web3.getGasPrice();
    }

    const options = {
      from: Web3.address,
      gasPrice: Utils.formatBigInt(gasPrice)
    };
    // totalAmount = Utils.formatBigInt(totalAmount * 10 ** 18);
    totalAmount = Utils.formatBigInt(totalAmount);

    if (isEscrow) {
      func = 'multiWithdrawETH';
      params.push(totalAmount);
    } else {
      options['value'] = totalAmount;
    }

    const tx = contract.methods[func](...params);

    let gasLimit = await tx.estimateGas(options);
    options.gas = gasLimit;
    await contract.methods[func](...params).send(options);
  },
  // eslint-disable-next-line no-empty-pattern
  async withdrawToken({ }, { contract, account, to, amount, gasPrice }) {
    const contractHandler = Web3.getTokenContract(contract.get('address'));
    const balance = await Web3.getTokenBalance(contract.get('address'), account.get('address'));
    const decimals = await Web3.decimals(contract.get('address'));

    // eslint-disable-next-line no-undef
    if (BigInt(amount * 100000000) * BigInt(10 ** decimals) > BigInt(balance * 100000000) * BigInt(99) / BigInt(100)) {
      // eslint-disable-next-line no-undef
      amount = BigInt(balance);
    } else {
      // eslint-disable-next-line no-undef
      amount = BigInt(amount * 100000000) * BigInt(10 ** decimals) / BigInt(100000000);
    }
    const tx = contractHandler.methods.transfer(
      to,
      Utils.formatBigInt(amount)
    );
    if (!gasPrice) {
      gasPrice = await Web3.getGasPrice();
    }

    const options = {
      from: account.get('address'),
      to: contract.get('address'),
      // gas: 100000,
      value: 0,
      gasPrice: Utils.formatBigInt(gasPrice)
    };

    const gasLimit = await tx.estimateGas({
      from: account.get('address'),
      to: contract.get('address'),
      value: 0,
      gasPrice: Utils.formatBigInt(gasPrice)
    })
    // eslint-disable-next-line no-undef
    options.gas = Utils.formatBigInt(BigInt(gasLimit) * BigInt(2));

    if (!Web3.getLevel().canSnipe()
      || (Web3.address.toLowerCase() == account.get('address').toLowerCase()
        && !account.pk)
    ) {
      await tx.send(options);
      return;
    }

    await Web3.send(tx, account.pk, options)
  },
  // eslint-disable-next-line no-empty-pattern
  async transferToken({ }, { contract, account, to, amount, gasPrice }) {
    const contractHandler = Web3.getTokenContract(contract.get('address'));

    const tx = contractHandler.methods.transfer(
      to,
      Utils.formatBigInt(amount)
    );
    if (!gasPrice) {
      gasPrice = await Web3.getGasPrice();
    }

    const options = {
      from: account.get('address'),
      to: contract.get('address'),
      // gas: 100000,
      value: 0,
      gasPrice: Utils.formatBigInt(gasPrice)
    };

    const gasLimit = await tx.estimateGas({
      from: account.get('address'),
      to: contract.get('address'),
      value: 0,
      gasPrice: Utils.formatBigInt(gasPrice)
    })
    // eslint-disable-next-line no-undef
    options.gas = Utils.formatBigInt(BigInt(gasLimit) * BigInt(2));

    if (!Web3.getLevel().canSnipe()
      || (Web3.address.toLowerCase() == account.get('address').toLowerCase()
        && !account.pk)
    ) {
      await tx.send(options);
      return;
    }

    await Web3.send(tx, account.pk, options)
  },
  // eslint-disable-next-line no-empty-pattern
  async withdraw({ }, { account, to, amount, gasPrice }) {
    // eslint-disable-next-line no-undef
    const balance = BigInt(await Web3.getBalance(account.get('address')));
    const gasLimit = await Web3.estimateGas({
      from: account.get('address'),
      to,
      value: Utils.formatBigInt(amount)
    })
    if (!gasPrice) {
      gasPrice = await Web3.getGasPrice();
    }
    // eslint-disable-next-line no-undef
    const totalGas = BigInt(gasPrice) * BigInt(gasLimit);
    // eslint-disable-next-line no-undef
    amount = BigInt(amount);
    if (Web3.getNetwork().network == 'base') {
      // eslint-disable-next-line no-undef
      const percentage = parseInt((balance - amount) * BigInt(100000) / balance) / 1000;
      if (percentage < 0.5) {
        // eslint-disable-next-line no-undef
        amount = amount - BigInt(0.00001 * 10 ** 18);
      }
    } else if (balance - totalGas < amount) {
      amount = balance - totalGas;
    }

    await Web3.send(null, account.pk, {
      from: account.get('address'),
      to,
      value: Utils.formatBigInt(amount),
      gas: gasLimit,
      gasPrice
    })
  },
  // eslint-disable-next-line no-empty-pattern
  async transferETH({ }, { account, balance, to, amount, gasPrice }) {
    // eslint-disable-next-line no-undef
    const gasLimit = await Web3.estimateGas({
      from: account.get('address'),
      to,
      value: Utils.formatBigInt(amount)
    })
    if (!gasPrice) {
      gasPrice = await Web3.getGasPrice();
    }
    // eslint-disable-next-line no-undef
    const totalGas = BigInt(gasPrice) * BigInt(gasLimit);
    // eslint-disable-next-line no-undef
    if (Web3.getNetwork().network == 'base') {
      // eslint-disable-next-line no-undef
      const percentage = parseInt((balance - amount) * BigInt(100000) / balance) / 1000;
      if (percentage < 0.5) {
        // eslint-disable-next-line no-undef
        amount = amount - 10000000000000n;
      }
    } else if (balance - totalGas < amount) {
      amount = balance - totalGas;
    }

    await Web3.send(null, account.pk, {
      from: account.get('address'),
      to,
      value: Utils.formatBigInt(amount),
      gas: gasLimit,
      gasPrice
    })
  },
  // eslint-disable-next-line no-empty-pattern
  async getTokenBalance({ }, { account, contract }) {
    const token = contract.get('address');
    const balance = await Web3.getTokenBalance(token, account.get('address'));
    if (!balances[token]) {
      balances[token] = {}
    }
    balances[token][account.get('address')] = balance;
    return balance;
  }
};
const mutations = {
  SET(state, [key, value]) {
    state[key] = value;
  },
  PUSH(state, [key, value]) {
    state[key].push(value);
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
