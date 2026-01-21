import Web3 from "web3";
import Vue from 'vue';
import Ethers from './Ethers';
import WalletConnectProvider from "@walletconnect/web3-provider";
const { utils } = import("ethers");

import Web3Modal from "web3modal";

import Parse from './Parse';
import Observer from "./Observer";
import store from "../store/index";
import { E_ACCOUNT_CHANGED, E_NEW_BLOCK, E_LOGIN, E_REJECT_SIGN, E_CHAIN_CHANGED } from "../constants/events";
import Config from "../config";
import Utils from "./Utils";

import ABI from "../constants/abi";

class Web3Helper {
  constructor() {
    this.web3 = null;
    this.account = {};
    this.address = null;
    this.balance = 0;
    this.blockNumber = 0;
    this.timer = null;
    this.provider = null;
    this.subscription = null;
    this.chainId = null;
    this.sniperBalance = Utils.formatBigInt(0);
    this.sniperEthValue = Utils.formatBigInt(0);

    this.contracts = {};
    this.abis = {};
  }

  createAccount() {
    return this.web3.eth.accounts.create();
  }

  getLevel() {
    const funcs = {};
    funcs.canSnipe = () => {
      return true;
    }

    funcs.canCopyTrade = () => {
      return true;
    }

    funcs.canUseAccount = () => {
      return true;
    }

    funcs.canSeeDetails = () => {
      return true;
    }

    funcs.canWatch = () => {
      return true;
    }

    funcs.canSetTpSl = () => {
      return true;
    }
    funcs.address = this.address;
    return funcs;
  }
  // eslint-disable-next-line no-unused-vars
  canUseDapp(account) {
    // const whitelist = [
    //   // '0x614DA9A1733ecc63031b6F4C88Fafde247d72F73',
    //   // '0x5889aa06e6540eaCECd3544248af09CaCA17aEa2',
    //   // '0x245D0FE81411FDc7Cec82A55099FAF4D35407B96',
    //   // '0x8E20Fa125d65C404Ab9CC3Be1140772C04943489',
    //   // '0x15c7817FaDbC192909D8339Ce101A14cccD67Ce7',
    //   // '0xBE682feC52C0a19c20eBfD64c54D44ECE69eE42D',
    //   // '0xb548e3Dd23236F7C227F12Ca75Ac52766B206c81',
    //   // '0x124B46c81eF976Bf904941B98D72e4e118E47392',
    //   // '0x63608970D148491Dd494B2529C3cD233eb955229',
    //   '0xE9C142bA64f07338E86069713c2FB6BCB1087252',
    //   '0x12f45b75bcE61B15495D158e19152B8Fda1862Ce',
    //   '0xa11862326d9391F19CCA45705A9ED8DA958d2D26',
    //   '0x51238816D687387065945cf15Ee362DaFB9ac327', // MAESTRO
    //   '0x63608970D148491Dd494B2529C3cD233eb955229', // DEV
    //   '0x84861b7cceb622db057d0c55430e0a7955ed0ecb', // Manhui
    //   '0xe8da23625c939c8f8423645a7de0a449df846cc2', // Manhui
    //   '0xbec42ced654c8bf1b0c26de46a81b29c1893ffad', // Hetape
    //   '0x4edffc1a1a36256c5fe2d070589a7fa4a7ad52e6', // PEIN
    //   '0x681f537842609da902ad3e71b140bf93975b1c69', // Dr
    //   '0xDe179fD33ac45a534Db916cD5b364A4228601583', // Dr
    //   '0x20ba9e51293137a6476896a2d6c0c68cd619d607', // Mahh
    //   '0xb1AFCc4b3CbFa10d39E05ff5FFe51905B7C8b899', // NEW
    //   '0xb1E1F33035dF4E7CDa9A82f6fe3b58730bEd4069', // 8/20
    //   '0x0D8171702566CFEE7c588C320cBb235bA664E620', // 8/26
    //   '0x77A5E996963f15385856fC161e6910297afd3463', // 9/4
    //   '0xaD9ABdc7F1cd2C6D4FB71985299729A2eAdCebb5', // 9/16
    //   '0x0Fe5EAb68360e92B12B39C2C024DA6563aa8E460', // 10/7
    //   '0x780040ec3351F02603168953F230D28F55e46821', // 10/14
    //   '0xdDdcC026D990a163e490b7F252EcCf024842845c', // 10/24
    //   '0xb5df251621dCD73935769aF777c584D7699fBdD2', // 11/18
    //   '0x5e8be397EC5d3301b0bcB2196fFf3EBc5F5f15C3', // 12/18
    //   '0x99E1f37F42BC01B2d3fb35c8Ba9BF708cE68B572', // 1/2/2026
    // ].map(x => x.toLowerCase());
    // if (whitelist.includes(account.toLowerCase()))
    //   return true;
    // return false;
    return true;
  }

  async init() {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          // infuraId: Config.INFURA_ID, // required
          rpc: {
            [Config.CHAIN_ID]: Config.RPC_URL
          },
        },
      }
    };

    const web3Modal = new Web3Modal({
      cacheProvider: true,
      providerOptions // required
    });

    const provider = await web3Modal.connect();

    this.provider = provider;
    this.web3 = new Web3(provider);

    this.initObserver();

    const accounts = await this.web3.eth.getAccounts();

    const connectedAccount = accounts[0];
    if (!this.canUseDapp(connectedAccount)) {
      throw new Error('Not whitelisted');
    }

    // Subscribe to accounts change
    provider.on("accountsChanged", (accounts) => {
      // console.log('Account changed', accounts);
      window.location.reload();
      Observer.$emit(E_ACCOUNT_CHANGED, accounts);
    });

    // Subscribe to chainId change
    provider.on("chainChanged", async (chainId) => {
      // console.log('Chain Changed', chainId);
      // eslint-disable-next-line no-undef
      if (BigInt(chainId) != BigInt(Config.CHAIN_ID)) {
        this.switchNetwork();
      }

      window.location.reload();
      this.chainId = parseInt(chainId);
      Observer.$emit(E_CHAIN_CHANGED, accounts);
    });

    // Subscribe to provider connection
    provider.on("connect", (info) => {
      console.log('Chain Connected', info.chainId);
    });

    // Subscribe to provider disconnection
    provider.on("disconnect", (error) => {
      console.log('Wallet Disconnected', error.code, error.message);
    });

    Observer.$emit(E_ACCOUNT_CHANGED, accounts);
  }

  async switchNetwork() {
    // eslint-disable-next-line no-undef
    const chainId = '0x' + BigInt(Config.CHAIN_ID).toString(16);
    if (this.isNetworkRequest) {
      return;
    }
    this.isNetworkRequest = true;
    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (switchError) {
      // console.log('Switch Network Error', switchError);
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await this.provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId,
              // chainName: Config.CHAIN_NAME,
              // nativeCurrency: {
              //   name: 'Bunny Chain',
              //   symbol: 'BNC', // 2-6 characters long
              //   decimals: 18
              // },
              // blockExplorerUrls: ['https://explorer.bunnychain.network'],
              // rpcUrls: [Config.RPC_URL],
            }],
          });
        } catch (addError) {
          // handle "add" error
          // console.log('Add Network Error', addError);
        }
      }
      // handle other "switch" errors
    }
    this.isNetworkRequest = false;
  }

  initObserver() {
    Observer.$off(E_ACCOUNT_CHANGED);

    Observer.$on(E_ACCOUNT_CHANGED, async (accounts) => {
      this.address = accounts[0];
      this.chainId = parseInt(await this.web3.eth.net.getId())

      try {
        // let msg = 'insidor_dapp';
        // if(this.address.toLowerCase() == '0xb1E1F33035dF4E7CDa9A82f6fe3b58730bEd4069'.toLowerCase())
        let msg = window.location.hostname;
        if ([
          '0xbec42ced654c8bf1b0c26de46a81b29c1893ffad',
        ]
          .map(x => x.toLowerCase()).indexOf(this.address.toLowerCase()) >= 0)
          msg = 'insidor_dapp';
        const signature = await this.web3.eth.personal.sign(msg, accounts[0]);
        this.signature = signature;
      } catch (e) {
        console.log(e);
        Observer.$emit(E_REJECT_SIGN);
        return;
      }

      this.balance = 0;
      await this.initAccount();
      this.switchNetwork()
    })

    // Observer.$on(E_LOGIN, (account) => {
    //   this.account = account;
    //   this.address = account.get('address');
    //   this.balance = 0;
    //   Parse.getUserClass().logIn(this.address, Config.PARSE_DEFAULT_PASSWORD);
    //   store.commit('SET', ['account', account]);
    //   this.initTimer();
    // })
  }

  initTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    const handler = () => {
      this.updateBalance();
    };
    handler();
    // TODO: call setInterval if needed
    // this.timer = setInterval(handler, 5000);
  }

  async initAccount() {
    // localStorage.clear();
    localStorage.removeItem('Parse/sniper/currentUser');
    localStorage.removeItem('Parse/sniper/installationId');
    Parse.init(false);
    console.log('initing ethers');
    await Ethers.init();
    const User = Parse.getUserClass();
    const user = new User({
      address: this.address.toLowerCase(),
    });
    // console.log('Init Account', this.address);
    // const User = Parse.getUserClass();
    // const query = Parse.getQuery(User);
    // query.equalTo('address', this.address.toLowerCase());
    // let user = await query.find();
    // if (user.length == 0) {
    //   user = new User({
    //     address: this.address.toLowerCase(),
    //     username: this.address.toLowerCase(),
    //     password: Config.PARSE_DEFAULT_PASSWORD
    //   });
    //   await user.save();
    // } else {
    //   user = user[0];
    // }

    // Subscribe to new blocks
    // this.web3.eth.clearSubscriptions();
    // this.subscription = this.web3.eth.subscribe('newBlockHeaders', function(error, result){
    //   if (!error) {
    //     this.blockNumber = result.number;
    //     Observer.$emit(E_NEW_BLOCK, result.number);
    //     Observer.$emit('newblockupdate', result.number);
    //     return;
    //   }
    //   console.error(error);
    // })
    // .on("connected", function(subscriptionId){
    //   console.log('connected', subscriptionId);
    // })
    // .on("data", function(blockHeader){
    //   console.log('block data', blockHeader);
    // })
    // .on("error", console.error);

    // // unsubscribes the subscription
    // this.subscription.unsubscribe(function(error, success){
    //   if (success) {
    //     console.log('Successfully unsubscribed!');
    //   }
    // });  

    // Moved from E_LOGIN
    this.account = user;
    this.address = user.get('address');
    this.balance = 0;

    // await Parse.getUserClass().logIn(this.address, Config.PARSE_DEFAULT_PASSWORD);

    store.commit('SET', ['account', user]);
    user.set('name', 'Wallet');
    Vue.set(user, 'balance', 0);
    this.initTimer();

    Observer.$emit(E_LOGIN, user);
    Observer.$emit(E_NEW_BLOCK, 0);
  }

  bytes32(str) {
    return utils.formatBytes32String(str);
  }

  parseBytes32(bytes) {
    return utils.parseBytes32String(bytes);
  }

  isAddress(address) {
    return this.web3.utils.isAddress(address);
  }

  getNetwork() {
    const networks = {
      1: {
        network: 'main',
        title: 'ETH',
        currency: 'ETH',
        explorer: 'https://etherscan.io/',
        dextool: 'https://www.dextools.io/app/ether/pair-explorer/'
      },
      4: {
        network: 'rinkeby',
        title: 'RINKEBY',
        currency: 'ETH',
        explorer: 'https://rinkeby.etherscan.io/',
        dextool: 'https://www.dextools.io/app/ether/pair-explorer/'
      },
      8453: {
        network: 'base',
        title: 'BASE',
        currency: 'ETH',
        explorer: 'https://basescan.org/',
        dextool: 'https://www.dextools.io/app/base/pair-explorer/'
      },
      56: {
        network: 'bsc-main',
        title: 'BSC',
        currency: 'BNB',
        explorer: 'https://bscscan.com/',
        dextool: 'https://www.dextools.io/app/bsc/pair-explorer/'
      },
      25: {
        network: null,
        cantWatch: true,
        title: 'CRO',
        currency: 'CRO',
        explorer: 'https://cronos.org/explorer',
        dextool: 'https://dexscreener.com/cronos/'
      }
    }
    // console.log(this.chainId);
    return networks[this.chainId];
  }

  async getBalance(address) {
    return this.web3.eth.getBalance(address);
  }

  async getTokenBalance(token, address) {
    const contractHandler = this.getTokenContract(token);
    const balance = await contractHandler.methods.balanceOf(address).call();
    return balance;
  }

  async getSniperBalance() {
    const web3 = new Web3(new Web3.providers.HttpProvider(Config.MAINNET_RPC));
    const sniper = new web3.eth.Contract(ABI.TokenABI, Config.SNIPER_ADDRESS);
    const balance = await sniper.methods.balanceOf(this.address).call();

    if (balance == 0) {
      return [0, 0];
    }
    const router = new web3.eth.Contract(ABI.UniswapRouterABI, Config.MAINNET_UNI_ROUTER_ADDRESS);
    const amountOut = await router.methods.getAmountsOut(balance, [
      Config.SNIPER_ADDRESS,
      Config.MAINNET_WETH_ADDRESS
    ]).call()
    return [balance, amountOut[1]];
  }

  async getEscrowBalance(address) {
    if (!address) {
      address = this.address;
    }
    const contract = this.getEscrowContract();
    try {
      return await contract.methods.balanceOf(address).call();
    } catch (e) {
      return 0;
    }
  }

  async updateBalance() {
    const balance = await this.web3.eth.getBalance(this.address);
    this.balance = balance;
    store.commit('SET', ['balance', Utils.formatBalance(balance)]);
  }

  sign(address, nonce) {
    const message = this.web3.eth.accounts.hashMessage(`I am signing my one-time nonce: ${nonce}`);
    return this.web3.eth.sign(message, address);
  }

  getAbi(address) {
    return this.abis[address];
  }

  setAbi(address, abi) {
    return this.abis[address] = abi;
  }

  getTokenContract(address) {
    if (!address) {
      address = Config.SNIPER_ADDRESS;
    }
    return new this.web3.eth.Contract(ABI.TokenABI, address);
  }

  addDexList(dex) {
    const network = this.getNetwork();
    Config[`${network.title}_DEX_LIST`].push(dex);
  }

  getDexList() {
    const network = this.getNetwork();
    return Config[`${network.title}_DEX_LIST`];
  }

  getWETHAddress() {
    const network = this.getNetwork();
    return Config[`${network.title}_WETH_ADDRESS`];
  }

  getAggregatorAddress() {
    const network = this.getNetwork();
    return Config[`${network.title}_AGGREGATOR_ADDRESS`];
  }

  getEscrowAddress() {
    const network = this.getNetwork();
    return Config[`${network.title}_ESCROW_ADDRESS`];
  }

  getRouterAddress() {
    const network = this.getNetwork();
    return Config[`${network.title}_ROUTER_ADDRESS`];
  }

  getRouterV2Address() {
    const network = this.getNetwork();
    return Config[`${network.title}_ROUTER_V2_ADDRESS`];
  }

  getEscrowContract() {
    return new this.web3.eth.Contract(ABI.EscrowABI, this.getEscrowAddress());
  }

  getUniswapV2Contract(address) {
    return new this.web3.eth.Contract(ABI.UniswapRouterABI, address);
  }

  getUniswapV2FactoryContract(address) {
    return new this.web3.eth.Contract(ABI.UniswapFactoryABI, address);
  }

  getUniswapV2PairContract(address) {
    return new this.web3.eth.Contract(ABI.UniswapPairABI, address);
  }

  getVistaRouterContract(address) {
    return new this.web3.eth.Contract(ABI.VistaRouterABI, address);
  }

  getVistaFactoryContract(address) {
    return new this.web3.eth.Contract(ABI.VistaFactoryABI, address);
  }

  getVistaPairContract(address) {
    return new this.web3.eth.Contract(ABI.VistaPairABI, address);
  }

  getAggregatorContract() {
    return new this.web3.eth.Contract(ABI.AggregatorABI, this.getAggregatorAddress());
  }

  getDisperseAppContract() {
    return new this.web3.eth.Contract(ABI.DisperseAppABI, "0x0BC23B69edBF2cb3CDd57a75454657e2d00047f5");
  }

  getRouterV2Contract() {
    return new this.web3.eth.Contract(ABI.RouterV2ABI, this.getRouterV2Address());
  }

  getRouterContract() {
    return new this.web3.eth.Contract(ABI.RouterABI, this.getRouterAddress());
  }

  async decimals(address) {
    if (!address) {
      address = Config.SNIPER_ADDRESS;
    }
    const tokenContract = this.getTokenContract(address);
    return parseInt(await tokenContract.methods.decimals().call());
  }

  async symbol(address) {
    if (!address) {
      return '';
    }
    console.log('getting symbol for', address);
    const tokenContract = this.getTokenContract(address);
    return await tokenContract.methods.symbol().call();
  }

  async getNonce(address) {
    return this.web3.eth.getTransactionCount(address);
  }

  async getTokenDetails(address) {
    // console.log('getting contract details');
    const contract = this.getTokenContract(address);
    // console.log('contract', contract);
    if (this.contracts[address]) {
      return this.contracts[address];
    }

    const result = {};
    try {
      console.log('owner')
      result.owner = await contract.methods.owner().call();
      console.log(result.owner);
    } catch (e) {
      console.log(e);
      try {
        console.log('owner again')
        result.owner = await contract.methods.getOwner().call();
        console.log(result.owner);
      } catch (e) {
        console.log(e);
      }
    }
    try {
      console.log('total supply')
      result.totalSupply = await contract.methods.totalSupply().call();
      console.log(result.totalSupply);
    } catch (e) {
      console.log(e);
    }
    try {
      console.log('decimals')
      result.decimals = await contract.methods.decimals().call();
      console.log(result.decimals);
    } catch (e) {
      console.log(e);
    }
    try {
      console.log('name');
      result.name = await contract.methods.name().call();
      console.log(result.name);
    } catch (e) {
      console.log(e);
    }
    try {
      console.log('symbol');
      result.symbol = await contract.methods.symbol().call();
      console.log(result.symbol);
    } catch (e) {
      console.log(e);
    }
    try {
      const factory = this.getUniswapV2FactoryContract("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");
      const pairAddress = await factory.methods.getPair(this.getWETHAddress(), address).call();
      const ethBalance = await this.getTokenBalance(this.getWETHAddress(), pairAddress);
      if (BigInt(ethBalance) <= 2n * 10n ** 17n) {
        alert('Low liquidity detected, please be careful!');
      }
    }
    catch (e) {
      console.log(e);
    }
    this.contracts[address] = result;
    return result;
  }

  async getGasPrice() {
    return await this.web3.eth.getGasPrice();
  }

  async estimateGas(option) {
    // from, to, data, value
    return await this.web3.eth.estimateGas(option)
  }

  async send(transaction, privateKey, options) {
    // from, to, gas: gasLimit, value, gasPrice / (maxFeePerGas, maxPriorityFeePerGas)
    if (transaction) {
      options.data = transaction.encodeABI();
    }
    let signedTx;
    if (privateKey) {
      signedTx = await this.web3.eth.accounts.signTransaction(options, privateKey);
    } else {
      // console.log('from', options);
      return await this.web3.eth.sendTransaction(options);
    }

    const result = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    result.hash = result.blockHash;
    return result;
  }

  callAfterBlocks(startBlock, numBlocks, callback) {
    if (numBlocks == 0) {
      callback(true);
      return;
    }

    console.log(startBlock, numBlocks, callback);

    var subscription = this.web3.eth.subscribe('newBlockHeaders', function (error) {
      if (!error) {
        return;
      }

      // this.web3.eth.clearSubscriptions();
      console.error(error);
    })
      .on("connected", function (subscriptionId) {
        console.log('connected');
        console.log(subscriptionId);
      })
      .on("data", function (blockHeader) {
        console.log('block data', blockHeader);
      })
      .on("error", console.error);

    // unsubscribes the subscription
    subscription.unsubscribe(function (error, success) {
      if (success) {
        console.log('Successfully unsubscribed!');
      }
    });
  }
}

const helper = new Web3Helper();
// helper.init();
export default helper;
