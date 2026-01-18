<template>
  <div class="card">
    <div class="card-body p-0 py-4">
        <div class="d-flex justify-content-between align-items-center px-4 pb-3">
          <h2 class="m-0" style="margin-bottom: 28px !important;">Positions</h2>
        </div>
        <div class="table-responsive">
          <table class="table m-0 align-items-center border0 w-100">
              <tbody v-if="getLevel().canUseAccount()">
                <tr v-for="(account, index) in accounts" :key="account.id" @mouseover="txConfig.hoverWallet=index" :class="{'hoverWallet':txConfig.hoverWallet==index}" >
                  <!-- <th style="width: 50px;">Name:</th> -->
                  <td style="width: 50px; text-align:left; white-space: nowrap;">{{account.get('name')}}</td>
                  <th>Balance:</th>
                  <td style="text-align:left;">{{getBalance(account)}} / {{getEthValue(account)}} {{getNetwork().currency}}</td>
                  <th>TP/SL:</th>
                  <td style="text-align:left;" class="flex">
                    <div class="d-flex">
                      {{getTp(account)}} / {{getSl(account)}}
                      <a v-if="getLevel().canSetTpSl()" @click="handleEditTpSl(account)" data-mdb-placement="bottom" title="Edit" class="me-2" style="margin-left: 10px;" >
                        <img class="action-icon" src="img/Edit.svg">
                      </a>
                      <template v-if="!isWithdrawing[account.get('address')]">
                      <a @click="handleWithdraw(account)" data-mdb-placement="bottom" title="Edit" class="me-2" style="margin-left: 0px;" >                    
                        <img class="action-icon" src="img/Withdraw.svg"/>
                      </a>
                      </template>
                      <img v-else class="loading-icon" src="img/spinner.svg"/>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <th>Balance:</th>
                  <td style="text-align:left;">{{getBalance(wallet)}}</td>
                  <th>{{getNetwork().currency}} Value:</th>
                  <td style="text-align:left;">{{getEthValue(wallet)}} {{getNetwork().currency}}</td>
                  <th>TP/SL:</th>
                  <td style="text-align:left">
                    {{getTp(wallet)}} / {{getSl(wallet)}}
                    <a @click="handleEditTpSl(wallet)" data-mdb-placement="bottom" title="Edit" class="me-2" style="margin-left: 10px;" >
                      <img class="action-icon" src="img/Edit.svg">
                    </a>
                  </td>
                </tr>
              </tbody>
          </table>
        </div>
    </div>
    <TpSlModal
      :active="tpSlModalActive"
      :balances="balances"
      :positions="positions"
      :activeAccount="tpSlActiveAccount"
      @close="tpSlModalActive=false;"
      :callback="tpSlModalCallback"
    />
    
    <deposit-modal 
      :balance="depositModalBalance" 
      :decimals="0" 
      :content="depositModalContent"
      :caption="depositModalCaption"
      :hasTo="depositModalHasTo"
      :active="depositModalActive"
      @close="depositModalActive=false;"
      :callback="depositModalCallback"
    />
    <alert-modal 
      :title="alertModalTitle"
      :icon="alertModalIcon"
      :active="alertModalActive"
      :content="alertModalContent"
      :btnOk="alertModalBtnOk"
      :callback="alertModalCallback"
      @ok="alertModalActive=false"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import Utils from '@/helpers/Utils';
import Web3 from '@/helpers/Web3';
import Ethers from '@/helpers/Ethers';
import TpSlModal from '@/components/TpSlModal.vue';
import Vue from 'vue';

import DepositModal from '@/components/DepositModal.vue';
import AlertModal from '@/components/AlertModal.vue';
import Observer from '@/helpers/Observer';
import { BigNumber } from "ethers";
import { E_NEW_BLOCK } from '../../../constants/events'


export default {
  name: "HistoryList",
  props: ['contract'],
  components: {
    TpSlModal,
    DepositModal,
    AlertModal
  },
  data() {
    return {
      positions: {},
      balances: {},

      // Tp Sl Modal
      tpSlActiveAccount: null,
      tpSlModalActive: false,
      tpSlModalCallback: null,
      tpSlEntry: 0,
      isWithdrawing: {},
      
      // Withdraw Modal
      depositModalBalance: 0,
      depositModalActive: false,
      depositModalCallback: null,
      depositModalContent: '',
      depositModalCaption: '',
      depositModalHasTo: false,
      
      // Alert Modal
      alertModalTitle: '',
      alertModalIcon: 'success',
      alertModalActive: false,
      alertModalContent: '',
      alertModalBtnOk: '',
      alertModalCallback: null,

      pairAddress: undefined,
    };
  },
  beforeDestroy() {
    Observer.$off(E_NEW_BLOCK, this.fetchBalances);
  },
  computed: {
    ...mapGetters({
      wallet: 'account',
      accounts: 'accounts/list',
      txConfig: 'transactions/config'
    })
  },
  watch: {
  },
  async mounted() {
    this.positions = {};
    // const positions = await this.fetch(this.contract.get('address'));
    // Better indexing
    for (let account of this.accounts) {
      this.positions[account.get('address')] = {
        tp: 0,
        sl: 0
      };
    }
    this.fetchBalances();
    Observer.$on(E_NEW_BLOCK, this.fetchBalances);
  },
  methods: {
    ...mapActions({
      fetch: 'positions/fetch',
      withdrawToken: 'accounts/withdrawToken',
      getTokenBalance: 'accounts/getTokenBalance',
      getTxConfig: 'transactions/getConfig',
    }),
    getLevel() {
      return Web3.getLevel(); 
    },
    getNetwork() {
      return Web3.getNetwork();
    },
    async fetchBalances() {
      if (!this.accounts) {
        return;
      }
      const token = this.contract.get('address');
      const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
      const tokenBalances = await disperseContract.getBalances(token, this.accounts.map(account => account.get('address')));

      const factoryContract = Web3.getUniswapV2FactoryContract(Web3.getDexList()[this.txConfig.factory].address);
      const pairAddress = await factoryContract.methods.getPair(token, Web3.getWETHAddress()).call();
      const pairContract = Web3.getUniswapV2PairContract(pairAddress);
      const [reserves, token0] = await Promise.all([
        pairContract.methods.getReserves().call(),
        pairContract.methods.token0().call()
      ]);
      let reserveIn = BigInt(reserves._reserve0);
      let reserveOut = BigInt(reserves._reserve1)
      if(token0.toLowerCase() !== token.toLowerCase()) {
        reserveIn = BigInt(reserves._reserve1);
        reserveOut = BigInt(reserves._reserve0);
      }
      
      const accountsToSell = [];
      this.accounts.map(async (account, index) => {
        // const balance = await this.getTokenBalance({account, contract: this.contract})
        const balance = BigNumber.from(tokenBalances[index].toString());
        const amountIn = BigInt(balance);
        const amountOut = BigNumber.from((((amountIn * 997n) * reserveOut) / (reserveIn * 1000n + (amountIn * 997n))).toString());
        const accountBalance = {
          eth: Utils.formatBalance(amountOut),
          token: Utils.formatBalance(balance, this.contract.get('decimals'))
        };
        Vue.set(
          this.balances, 
          account.get('address'),
          accountBalance
        );
        const position = this.positions[account.get('address')];
        let isSelling = false;
        if (!isNaN(parseFloat(position.tp))) {
          if (parseFloat(position.tp) > 0 && parseFloat(accountBalance.eth) > 0 && parseFloat(accountBalance.eth) > parseFloat(position.tp)) {
            // sell for profit
            accountsToSell.push(account);
            isSelling = true;
          }
        }
        if (!isNaN(parseFloat(position.sl))) {
          if (parseFloat(position.sl) > 0 && parseFloat(accountBalance.eth) > 0  && parseFloat(accountBalance.eth) < parseFloat(position.sl)) {
            // sell for profit
            if (!isSelling) {
              accountsToSell.push(account);
            }
          }
        }
      });
      if (accountsToSell.length > 0) {
        Observer.$emit('sell', {
          history: null,
          type: 'normal',
          accounts: accountsToSell
        });
      }
    },
    getBalance(account) {
      const balance = this.balances[account.get('address')];
      if (!balance) {
        return '_';
      }
      return this.balances[account.get('address')].token;
    },
    getEthValue(account) {
      const balance = this.balances[account.get('address')];
      if (!balance) {
        return '_';
      }
      return this.balances[account.get('address')].eth;
    },
    getTp(account) {
      const position = this.positions[account.get('address')];
      if (!position || position.tp == 0) {
        return '_';
      }
      return position.tp;
    },
    getSl(account) {
      const position = this.positions[account.get('address')];
      if (!position || position.sl == 0) {
        return '_';
      }
      return position.sl;
    },
    handleEditTpSl(account) {
      this.tpSlActiveAccount = account;
      this.tpSlModalActive = true;
      this.tpSlModalCallback = (tp, sl) => {
        this.positions[account.get('address')].tp = tp;
        this.positions[account.get('address')].sl = sl;
        this.tpSlModalActive = false;
      }
    },
    
    checkBalance(account) {
      if (parseInt(account.balance) == 0) {
        let content = 'There is not enough balance to send transaction. Please deposit for gas fee.';
        this.$toast.error(`${content}`, {
          position: "top-right",
          timeout: 2000,
          closeOnClick: true,
        });
        return false;
      }
      const balance = this.balances[account.get('address')];
      if (!balance) {
        let content = 'There is not enough token balance to withdraw';
        this.$toast.error(`${content}`, {
          position: "top-right",
          timeout: 2000,
          closeOnClick: true,
        });
        return false;
      }
      return true;
    },
    
    handleWithdraw(account) {
      if (!this.checkBalance(account)) {
        return;
      }
      this.depositModalActive = true;
      this.depositModalContent = 'Please input amount to withdraw.';
      this.depositModalCaption = 'Withdraw';
      this.depositModalHasTo = true;
      this.depositModalBalance = parseFloat(parseFloat(this.getBalance(account)).toFixed(4));
      this.depositModalCallback = async (amount, to) => {
        this.depositModalActive = false;
        Vue.set(this.isWithdrawing, account.get('address'), true);
        try {
          const txConfig = await this.getTxConfig({
            action: 'cancel'
          });
          await this.withdrawToken({
            contract: this.contract,
            account, 
            amount, 
            to: to,
            gasPrice: txConfig.gasPrice
          });
          this.$toast("Withdraw was successful", {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
        } catch (e) {
          console.log(e);
          this.alertModalTitle = 'Error';
          this.alertModalIcon = 'error';
          this.alertModalActive = true;
          this.alertModalContent = 'There was an error on withdraw. Please try again.';
          this.alertModalBtnOk = 'Ok';
          this.alertModalCallback = null;
        }
        Vue.set(this.isWithdrawing, account.get('address'), false);
      }
      // this.confirmActive = true;
      // this.confirmTitle = 'Confirm';
      // this.confirmContent = 'Are you sure you want to withdraw all funds from this account';
      // this.confirmCallback = async () => {
      //   await this.withdraw({account, amount: parseFloat(this.withdrawAmount), to: this.to});
      //   this.confirmActive = false;
      // }
    },
  },
};
</script>
<style scoped>

@media only screen 
    and (max-width: 767px), (min-device-width: 767px) 
    and (max-device-width: 767px)  {

		/* Force table to not be like tables anymore */
		table, thead, tbody, th, td, tr {
			display: block;
		}

		/* Hide table headers (but not display: none;, for accessibility) */
		thead tr {
			position: absolute;
			top: -9999px;
			left: -9999px;
		}

    tr {
      margin: 0 0 1rem 0;
    }
      
    /* tr:nth-child(odd) {
      background: #ccc;
    } */
    
		td {
			/* Behave  like a "row" */
			border: none;
			border-bottom: 1px solid #eee;
			position: relative;
			padding-left: 50%;
      width: 100% !important;
		}

		td:before {
			/* Now like a table header */
			position: absolute;
			/* Top/left values mimic padding */
			top: 50%;
			left: 24px;
			padding-right: 10px;
			white-space: nowrap;
      transform: translate(0px, -50%);
      color: #444444;
		}

		/*
		Label the data
    You could also use a data-* attribute and content for this. That way "bloats" the HTML, this way means you need to keep HTML and CSS in sync. Lea Verou has a clever way to handle with text-shadow.
		*/
    td:nth-of-type(1):before { content: "Name: "; }
		td:nth-of-type(2):before { content: "Balance: "; }
		td:nth-of-type(3):before { content: "TP/SL: "; }
		td:nth-of-type(4):before { content: "Function: "; }

    th {
      display: none;
    }
	}
</style>