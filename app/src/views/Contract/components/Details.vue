<template>
  <div class="card">
    <div class="card-body p-0 py-4">
        <div class="d-flex justify-content-between align-items-center px-4 pb-3">
          <div class="d-flex">
            <h2 class="m-0">Details</h2>
          </div>
          <div style="position: relative;">
            <a @click="showMenu = !showMenu;"><img src="img/dots.svg"/></a>
            <div v-if="showMenu" v-click-outside="() => {showMenu=false}" class="card" style="position: absolute; right: 0;">
              <div class="card-body" style="padding: 0.5rem 0rem!important;">
                <!-- <template v-if="!watch || watch.get('isActive')">
                  <div @click="watchContract" style="padding: 0.5rem 1rem; white-space: nowrap; cursor: pointer;">
                    Move to Watch list
                  </div>
                  <hr style="margin:0"/>
                </template> -->
                <template v-if="!watch || !watch.get('isActive') || watch.get('isFinished')">
                  <div @click="activateContract" style="padding: 0.5rem 1rem; white-space: nowrap; cursor: pointer;">
                    Move to Live list
                  </div>
                  <hr style="margin:0"/>
                </template>
                <template v-if="!watch || !watch.get('isActive') || !watch.get('isFinished')">
                  <div @click="finishContract" style="padding: 0.5rem 1rem; white-space: nowrap; cursor: pointer;">
                    Move to Past list
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
        <div class="table-responsive" style="overflow-x: hidden!important;">
          <div class="button-text d-flex justify-content-center align-items-center mt-2">
            <a @click="openDexTool()" class="btn-theme">Dextools</a>
            <a @click="openContract()" class="btn-theme">Contract</a>
            <a @click="openOwner()" class="btn-theme">Owner</a>
            <!-- <a v-if="!isTesting && getLevel().canSnipe()" @click="handleTest()" class="btn-theme">Test</a>
            <img v-else-if="isTesting" class="loading-icon" src="img/spinner.svg"/> -->
            <a @click="showWarns()" class="btn-theme">Warns</a>

            <a @click="openTS()" class="btn-theme">TS</a>
            <div class="button-text d-flex justify-content-center align-items-center" 
            >
              <a 
                :style="hpResult && hpResult.honeypotResult && hpResult.honeypotResult.isHoneypot == true ? 'background-color: black;' : ''"
                @click="openHPInfo()" class="btn-theme"
              >HoneyPotIs</a>
            </div>
          </div>
          <table class="table m-0 align-items-center border0 w-100">
              <tbody v-if="getLevel().canSeeDetails()">
                <tr>
                  <th style="">Name:</th>
                  <td style=" text-align:right">{{contract.get('name')}}</td>
                  <th style="">Symbol: </th>
                  <td style="text-align:right">{{contract.get('symbol')}}</td>
                  <th style="">TSupply:</th>
                  <td style="text-align:right">{{formatTotalSupply(contract.get('totalSupply'))}}</td>
                </tr>
                <tr>
                  <th>PairETH:</th>
                  <td style="text-align:right">{{pairBalance}}</td>
                  <th>MC:</th>
                  <td style="text-align:right">${{getMarketCap(contract)}}</td>
                  <th>BB:</th>
                  <td style="text-align:right">
                    {{ buybackETH }}
                      <!-- <line-chart width="150px" height="40px" :data="chartData[contract.get('address')]"></line-chart> -->
                  </td>
                </tr>
                <tr>
                  <th>Function:</th>
                  <td style="text-align:right">{{contract.get('function') || '_'}}</td>
                  <th>Tax B/S:</th>
                  <td style="text-align:right">{{contract.get('buyTax') || '_'}}/{{contract.get('sellTax') || '_'}}</td>
                  <th>DBlocks:</th>
                  <td style="text-align:right">{{contract.get('deadBlocks') || '_'}}</td>
                </tr>
                <tr>
                  <th>Decimals:</th>
                  <td style="text-align:right">{{contract.get('decimals') || '_'}}</td>
                  <th>MaxT/W:</th>
                  <td style="text-align:right">{{contract.get('maxTx') || '_'}}/{{contract.get('maxWallet') || '_'}}</td>
                  <th>OwnerETH:</th>
                  <td style="text-align:right">{{ownerBalance}} {{getNetwork().currency}}</td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <th style="">Name:</th>
                  <td style=" text-align:right">{{contract.get('name')}}</td>
                  <th style="">Symbol: </th>
                  <td style="text-align:right">{{contract.get('symbol')}}</td>
                  <th style="">Total Supply:</th>
                  <td style="text-align:right">{{formatTotalSupply(contract.get('totalSupply'))}}</td>
                </tr>
                <tr>
                  <th style="">Name:</th>
                  <td style=" text-align:right">{{contract.get('name')}}</td>
                  <th style="">Symbol: </th>
                  <td style="text-align:right">{{contract.get('symbol')}}</td>
                  <th style="">Total Supply:</th>
                  <td style="text-align:right">{{formatTotalSupply(contract.get('totalSupply'))}}</td>
                </tr>
                <tr>
                  <th>Decimals:</th>
                  <td style="text-align:right">{{contract.get('decimals') || '_'}}</td>
                  <th>Tax Buy/Sell:</th>
                  <td style="text-align:right">{{contract.get('buyTax') || '_'}}/{{contract.get('sellTax') || '_'}}</td>
                  <th>Owner Balance:</th>
                  <td style="text-align:right">{{ownerBalance}} {{getNetwork().currency}}</td>
                </tr>
              </tbody>
          </table>
        </div>
    </div>

    <div class="card-body p-0 py-0 pb-1 w-full">
      <div class="d-flex justify-content-between align-items-center px-4 pb-3">
        <h2 class="m-0">HoneyPot info</h2>
        <img @click="showHPInfo=false;" v-if="showHPInfo" style="width: 30px; height: 30px; cursor: pointer;" class="action-icon" src="img/unobserve.svg"/>
        <img @click="showHPInfo=true;" v-else style="width: 30px; height: 30px;cursor: pointer;" class="action-icon" src="img/observe.svg"/>
      </div>
      <div class="w-full px-4" v-if="showHPInfo && hpResult">
        <div class="d-flex w-full justify-content-between">
          <div class="w-50">
            <b>Simulation</b>
            <VueJsonPretty :path="'res'" :data="hpResult.simulationResult" style="max-width: 100%; overflow-x: auto;"/>
          </div>
          <div class="w-50">
            <div>
              <b>Result</b>
              <VueJsonPretty :path="'res'" :data="hpResult.honeypotResult" style="max-width: 100%; overflow-x: hidden;"/>
            </div>
            <div>
              <b>Flags</b>
              <div v-if="hpResult.flags">
                {{ hpResult.flags.join(', ') }}
              </div>
              <!-- <VueJsonPretty :path="'res'" :data="hpResult.flags" style="max-width: 100%; overflow-x: hidden;"/> -->
            </div>
            <div>
              <b>Holder Analysis</b>
              <VueJsonPretty :path="'res'" :data="hpResult.holderAnalysis" style="max-width: 100%; overflow-x: hidden;"/>
            </div>
          </div>
        </div>
      </div>
    </div>
    <alert-modal 
      :title="alertModalTitle"
      :icon="alertModalIcon"
      :active="alertModalActive"
      :content="alertModalContent"
      :btnOk="alertModalBtnOk"
      :callback="alertModalCallback"
      @ok="alertModalActive=false"
    />
    <WarnModal
      :active="warnModalActive"
      @close="warnModalActive=false"
      :contract="contract"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
// import Config from '@/config';
import Observer from '@/helpers/Observer';
import Web3 from '@/helpers/Web3';
import Utils from '@/helpers/Utils';
import Vue from 'vue';
import Zerion from '@/helpers/Zerion';
import AlertModal from '@/components/AlertModal.vue';
import WarnModal from './WarnModal.vue';
import {C_NEW_TX, C_TEST_FAILED, C_TEST_SUCCESS, C_TEST_FINISHED} from "@/constants/events";
import VueJsonPretty from 'vue-json-pretty'

export default {
  name: "Details",
  props: ['contract', 'watch'],
  components: {
    AlertModal,VueJsonPretty,
    WarnModal
  },
  data() {
    return {
      bbAddr: [],
      buybackETH: '_',
      pairBalance: '_',
      lastTimeRefresh: 0,
      chartData: {},
      hpResult: {},
      showHPInfo: false,
      showMenu: false,
      isTesting: false,
      isHidden: false,
      isForce: false,

      timer: null,
      ownerBalance: 0,

      warnModalActive: false,

      // Alert Modal
      alertModalTitle: '',
      alertModalIcon: 'success',
      alertModalActive: false,
      alertModalContent: '',
      alertModalBtnOk: '',
      alertModalCallback: null,
    };
  },
  computed: {
    ...mapGetters({
      config: 'transactions/config'
    }),
  },
  watch: {
  },
  beforeDestroy() {
    Observer.$off(C_TEST_FAILED);
    Observer.$off(C_TEST_SUCCESS);
    Observer.$off(C_TEST_FINISHED);
    clearInterval(this.timer);
  },
  async mounted() {
    if (this.contract.get('isHidden') == true) {
      this.isHidden = true;
    }
    if (this.contract.get('isForce') == true) {
      this.isForce = true;
    }
    Vue.set(this.config, 'warns', []);
    Observer.$on(C_TEST_FAILED, () => {
      this.isTesting = false;
      this.alertModalTitle = 'Error';
      this.alertModalIcon = 'error';
      this.alertModalActive = true;
      this.alertModalContent = 'There is an unknown error in your configrations. Please check them again.';
      this.alertModalBtnOk = 'Ok';
      this.alertModalCallback = null;
    });
    Observer.$on(C_TEST_SUCCESS, () => {
      this.isTesting = false;
      this.alertModalTitle = 'Success';
      this.alertModalIcon = 'success';
      this.alertModalActive = true;
      this.alertModalContent = 'Test was successful. You are good to go.';
      this.alertModalBtnOk = 'Ok';
      this.alertModalCallback = null;
    });
    Observer.$on(C_TEST_FINISHED, () => {
      this.isTesting = false;
    });
    const timerHandler = async () => {
      this.refreshPairWETH();
      // this.refreshChart()
      const owner = this.contract.get('owner');
      if (owner) {
        this.ownerBalance = this.formatBalance(await Web3.getBalance(owner));
      }
      
      // if (Web3.getNetwork().network == 'base') {
      //   return;
      // }
      
      // const hpUrl = `https://api.honeypot.is/v2/IsHoneypot?address=${
      //   this.contract.get('address')
      // }`;
      // fetch(hpUrl).then(res => res.json())
      // .then(result => {
      //   this.hpResult = result;
      // });
    };
    timerHandler();
    this.timer = setInterval(timerHandler, 5000);
  },
  methods: {
    ...mapActions({
      createUpdateWatch: 'watches/createUpdate'
    }),
    async setBBAddr() {
      const text = await navigator.clipboard.readText();
      const addresses = text.match(/(\b0x[a-fA-F0-9]{40}\b)/g)
      this.bbAddr = addresses;
    },
    showWarns() {
      this.warnModalActive = true;
    },
    getLevel() {
      return Web3.getLevel(); 
    },
    formatBalance(balance, decimals, delimiter) {
      if (!balance) {
        return '_';
      }
      return Utils.formatBalance(balance, decimals, delimiter);
    },
    getNetwork() {
      return Web3.getNetwork();
    },
    formatTotalSupply() {
      let decimals = this.contract.get('decimals') || 18;
      let totalSupply = this.contract.get('totalSupply') || 18;
      // eslint-disable-next-line no-undef
      return (BigInt(totalSupply) / BigInt(10 ** decimals)).toString();
    },
    openDexTool() {
      const url = this.getNetwork().dextool + this.contract.get('address');
      window.open(url);
    },
    openContract() {
      const url = this.getNetwork().explorer + 'address/' + this.contract.get('address');
      window.open(url);
    },
    openOwner() {
      const url = this.getNetwork().explorer + 'address/' + this.contract.get('owner');
      window.open(url);
    },
    openTS() {
      let network = this.getNetwork().network;
      if (network == 'main') {
        network = 'eth';
      }
      const url = `https://tokensniffer.com/token/${network}/${this.contract.get('address')}`;
      window.open(url);
    },
    openHPInfo() {
      let network = this.getNetwork().network;
      if (network == 'main') {
        network = 'ethereum';
      }
      const url = `https://honeypot.is/${network}?address=${this.contract.get('address')}`;
      window.open(url);
    },
    handleTest() {
      this.isTesting = true;
      Observer.$emit(C_NEW_TX, {test: true});
      setTimeout(() => {
        if (this.isTesting == false) {
          return;
        }
        this.isTesting = false;
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'There is an unknown error in your configrations. Please check them again.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
      }, 10000);
    },
    // Move to watch list for new contracts
    async watchContract() {
      this.$emit('update', await this.createUpdateWatch({
        address: this.contract.get('address'),
        name: this.contract.get('name'),
        totalSupply: this.contract.get('totalSupply'),
        decimals: this.contract.get('decimals'),
        owner: this.contract.get('owner'),
        symbol: this.contract.get('symbol'),
        isActive: false,
        isFinished: false
      }));
    },
    // Move to past list from live list
    async finishContract() {
      this.$emit('update', await this.createUpdateWatch({
        address: this.contract.get('address'),
        name: this.contract.get('name'),
        totalSupply: this.contract.get('totalSupply'),
        decimals: this.contract.get('decimals'),
        owner: this.contract.get('owner'),
        symbol: this.contract.get('symbol'),
        isActive: true,
        isFinished: true,
      }))
    },
    // Move to live list
    async activateContract() {
      this.$emit('update', await this.createUpdateWatch({
        address: this.contract.get('address'),
        name: this.contract.get('name'),
        totalSupply: this.contract.get('totalSupply'),
        decimals: this.contract.get('decimals'),
        owner: this.contract.get('owner'),
        symbol: this.contract.get('symbol'),
        isActive: true,
        isFinished: false,
      }))
    },
    async refreshPairWETH() {
      const dex = Web3.getDexList()[this.config.factory];
      const factory = Web3.getUniswapV2FactoryContract(dex.address);
      const pairAddress = await factory.methods.getPair(Web3.getWETHAddress(), this.contract.get('address')).call();
      const ethBalance = await Web3.getTokenBalance(Web3.getWETHAddress(), pairAddress);
      this.pairBalance = this.formatBalance(ethBalance, null, 4);
    },
    refreshChart() {
      // console.log('refresh');
      if (new Date().getTime() < this.lastTimeRefresh + 9000) {
        return;
      }
      this.lastTimeRefresh = new Date().getTime();
      const watch = this.contract;
      const address = watch.get('address').toLowerCase();
      Zerion.getAssetCharts(address, 'd').then(response => {
        const data = response[address];
        if (!data || !data.length) {
          Vue.set(this.chartData, watch.get('address'), []);
          return;
        }
        Vue.set(this.chartData, watch.get('address'), data);
      });
      
    },
    // eslint-disable-next-line no-unused-vars
    getPrice(watch, isNumber) {
      if (!this.chartData[watch.get('address')]) {
        return isNumber ? 0 : '_';
      }
      const data = this.chartData[watch.get('address')];
      if (data.length == 0) {
        return isNumber ? 0 : '_';
      }
      let price = data[0][1];
      if (isNumber) {
        return price;
      }
      if (price < 1) {
        price = price.toString();
        let index = 2;
        for (; index < price.length; index++) {
          if (price[index] != 0) {
            break;
          }
        }
        return '$' + price.slice(0, index) + price.slice(index, index + 3);
      }
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',

        // These options are needed to round to whole numbers if that's what you want.
        //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
        //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
      });
      return formatter.format(price);
    },
    getMarketCap(watch) {
      try {
        const price = this.getPrice(watch, true);
        // eslint-disable-next-line no-undef
        let mc = BigInt(price * 10 ** 30) * BigInt(watch.get('totalSupply')) / BigInt(10 ** watch.get('decimals')) / BigInt(10 ** 30)
        
        const formatNumber = (num, digits) => {
          num = parseFloat(num);
          if (num == 0) return num;
          if (num < 1000) return parseFloat(num.toFixed(5));
          if (!digits) digits = 3;
          const lookup = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "G" },
            { value: 1e12, symbol: "T" },
            { value: 1e15, symbol: "P" },
            { value: 1e18, symbol: "E" }
          ];
          const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
          var item = lookup.slice().reverse().find(function(item) {
            return num >= item.value;
          });
          return item ? parseFloat((num / item.value).toFixed(digits)).toString().replace(rx, "$1") + item.symbol : "0";
        }
        return formatNumber(mc);
      } catch (e) {
        console.log(e);
        return '_';
      }
    },
  },
};
</script>
<style scoped>
.action-icon {
  width: 30px;
  height: 30px;
}

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
    tr:nth-of-type(1) td:nth-of-type(1):before { content: "Name: "; }
		tr:nth-of-type(1) td:nth-of-type(2):before { content: "Symbol: "; }
		tr:nth-of-type(1) td:nth-of-type(3):before { content: "Total Supply: "; }
		tr:nth-of-type(2) td:nth-of-type(1):before { content: "Function: "; }
    tr:nth-of-type(2) td:nth-of-type(2):before { content: "Tax Buy/Sell: "; }
		tr:nth-of-type(2) td:nth-of-type(3):before { content: "Dead Blocks: "; }
		tr:nth-of-type(3) td:nth-of-type(1):before { content: "Decimals: "; }
		tr:nth-of-type(3) td:nth-of-type(2):before { content: "Max Tx/Wallet: "; }
		tr:nth-of-type(3) td:nth-of-type(3):before { content: "Owner Balance: "; }
    th {
      display: none;
    }
	}
</style>