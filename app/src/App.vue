<template>
  <div class="main-container" id="app">
    <header id="home" style="margin-bottom: 30px;">
      <Navbar :isConnecting="isConnecting" @connect="connect"/>
    </header>
    <!-- <template v-if="isLoading">
      Loading...
    </template>
    <template v-else> -->
      <div v-if="account && isEligible" class="container d-flex justify-content-between align-items-start flex-wrap xl-gap" style="position: relative">
        
        <!-- <div v-if="isShowConfigs" class="card mb-4">
          <div class="card-body p-0 py-4" style="padding-bottom: 0!important;">
            <div class="align-items-center px-4 pb-3">
              Please be aware that for the zero / low tax tokens, in order to prevent sandwitch bots frontrunning your transaction, use <b class="pointer" onclick="Intercom('showArticle', 6071560)">Original Router</b> with lower slippage unless you use the Buy instant feature.
            </div>
          </div>
        </div> -->
        <div v-if="isShowConfigs" class="col-xl-7 col-12 pe-xl-4" style="z-index: 1021;">
          <transaction-config class="mb-4"/>
          <router-view/>
        </div>
        <div v-else class="col-12 pe-xl-4">
          <router-view/>
        </div>
        <div class="col-xl-5 col-12 align-top relative">
          <!-- <information-list class="mb-4" /> -->
          <account-list v-if="isShowConfigs" class="mt-4 mt-lg-0 mb-4"/>
          <notification-list  v-if="isShowConfigs" class="mt-4 mt-lg-0 mb-4"/>
        </div>
      </div>
      <div v-else-if="!account" class="container d-flex justify-content-lg-between align-items-center justify-between flex-wrap">
        <!-- <div class="bg-white d-flex flex-column justfy-content-center align-items-center" style="width: 0%; padding: 5rem;"> -->
          <!-- <div class="card w-full mb-4">
            <div class="card-body d-flex flex-column justfy-content-center align-items-center p-0 py-4">
              <div style="font-size: 20px;">
                Please connect your wallet to use the DApp. If you are unsure about connecting a wallet, checkout this <b class="pointer" onclick="Intercom('showArticle', 6169878)">article 
                </b>
              </div>
              <div class="mt-4">
                <a id="dropdownMenuButton"
                  @click="connect"
                  data-mdb-toggle="dropdown"
                  aria-expanded="false" class="btn-infos" >
                  {{!isConnecting ? 'CONNECT WALLET' : 'CONNECTING...'}}
                </a>
              </div>
            </div>
          </div> -->
        <ContractList />
      </div>
      <div v-else class="d-flex justfy-content-center align-items-center">
        <div class="bg-white d-flex flex-column justfy-content-center align-items-center" style="width: 80%; padding: 5rem;">
          <div style="font-size: 20px;">
            <!-- Insufficient $SNIPE balance. Please get 0.3ETH worth of $SNIPE tokens -->
            Loading...
          </div>
          <!-- <div class="mt-4">
            <a id="dropdownMenuButton"
              @click="goToBuy"
              data-mdb-toggle="dropdown"
              aria-expanded="false" class="btn-infos" >
              Buy Now!
            </a>
          </div> -->
        </div>
      </div>
    <!-- </template> -->
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
// @ is an alias to /src
import Navbar from '@/views/Navbar';
import AccountList from '@/components/AccountList.vue';
// import InformationList from '@/components/InformationList.vue';
import { mapGetters } from "vuex";
import Web3 from '@/helpers/Web3';
import Utils from '@/helpers/Utils';
import Observer from '@/helpers/Observer';
import Config from '@/config';
import TransactionConfig from './components/TransactionConfig.vue';
import AlertModal from '@/components/AlertModal.vue';
import {E_REJECT_SIGN} from "@/constants/events";
import ContractList from '@/views/List/index.vue';

// import Parse from '@/helpers/Parse';
// import axios from 'axios';
import NotificationList from './components/NotificationList.vue';

// import Crypto from '@/helpers/Crypto';

/* eslint-disable no-mixed-spaces-and-tabs */
export default {
  name: 'Home',
  components: {
    ContractList,
    Navbar,
    AccountList,
    // InformationList,
    TransactionConfig,
    AlertModal,
    NotificationList
  },
  beforeDestroy() {
    Observer.$off(E_REJECT_SIGN);
  },
  methods: {
    async connect() {
      if (this.isConnecting) {
        return;
      }
      try {
        await Web3.init();
        this.isConnecting = true;
      } catch (e) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'There was an error connecting your wallet. Please try again';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
      }
    },
    goToBuy() {
      window.open(`https://app.uniswap.org/#/swap?exactField=input&inputCurrency=ETH&outputCurrency=${Config.SNIPER_ADDRESS}&chain=mainnet`);
    },
    async checkSniperBalance() {
      let sniperBalance, sniperEthValue;
      try {
        // [sniperBalance, sniperEthValue] = await Web3.getSniperBalance();
        [sniperBalance, sniperEthValue] = [0, 0];
      } catch (e) {
        console.log(e);
        this.timer = setTimeout(this.checkSniperBalance, 5000);
        return;
      }
      clearTimeout(this.timer);

      Web3.sniperBalance = Utils.formatBigInt(sniperBalance);
      Web3.sniperEthValue = Utils.formatBigInt(sniperEthValue);

      // eslint-disable-next-line no-undef
      // if (BigInt(sniperEthValue) > BigInt(Config.MIN_SNIPER_VALUE * 10 ** 18)) {
      //   this.account.level = LEVEL_SNIPE;
      //   // this.isEligible = true;
      //   clearTimeout(this.timer);
      //   return;
      // }

      // FIXME: don't just allow everyone
      this.isEligible = true;
    },
  },
  computed: {
    ...mapGetters(["account", "balance"]),
    ...mapGetters({
      contract: 'contracts/active',
    }),
    isShowConfigs() {
      if (this.$route.name == 'List') {
        return false;
      }
      return true;
    },
    hasContract() {
      if (!this.contract) {
        return false;
      }
      return true;
    }
  },
  watch: {
    async account() {
      if (!this.account) {
        return;
      }
      // Todo: set default eligible false
      this.isEligible = true;
      clearTimeout(this.timer);
      // this.checkSniperBalance();
    }
  },
  async mounted() {    
    Observer.$on(E_REJECT_SIGN, () => {
      this.isConnecting = false;
    })

    window.Chart.defaults.global.elements.point.backgroundColor = 'rgba(255, 0, 0, 1)'
    window.Chart.defaults.global.elements.point.borderWidth = 5;
    window.Chart.defaults.global.elements.point.radius = 0.5;
    window.Chart.defaults.global.elements.point.hoverRadius = 5;

    window.Chart.defaults.global.aspectRatio = 6;
    window.Chart.defaults.global.responsive = true;
    window.Chart.defaults.global.maintainAspectRatio = false;

    window.Chart.defaults.global.plugins.legend = {
      display: false
    };
    window.Chart.defaults.scale.position = 'right';
    window.Chart.defaults.scale.gridLines.display = false;
    window.Chart.defaults.scale.display = false;
    window.Chart.defaults.global.legend.display = false;
    window.Chart.defaults.global.legend.labels.generateLabels = function() {
      return '';
    };
    window.Chart.defaults.global.legendCallback = function () {
      return '';
    }
    window.Chart.defaults.global.tooltips.callbacks.label = function() {
      return '';
    };
    window.Chart.defaults.global.tooltips.callbacks.title = function() {
      return '';
    };
    window.Chart.defaults.global.tooltips.backgroundColor = "rgba(255,0,0,0.8)";
  },
  data() {
    return {
      isImportStarted: false,
      importPage: 0,
      importPageSize: 50,

      isLoading: false,
      isEligible: true,
      timer: null,
      isConnecting: false,
      // Alert Modal
      alertModalTitle: '',
      alertModalIcon: 'success',
      alertModalActive: false,
      alertModalContent: '',
      alertModalBtnOk: '',
      alertModalCallback: null,
    }
  }
}
</script>


<style>
.Vue-Toastification__toast--default {
    background-color: #003cff!important;
}

.main-container {
  width: 100%;
}

body {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  justify-content: center;
}

.main-font {
  font-family: "hunger_gamesregular";
}

.second-font {
  font-family: Montserrat;
}

.pointer {
  cursor: pointer;
}

.white {
  color: white;
}

.text-center {
  text-align: center;
}

::-webkit-scrollbar {
  width: 5px;
}

/* Track */
::-webkit-scrollbar-track {
  background: transparent; 
}
 
/* Handle */
::-webkit-scrollbar-thumb {
  background: #888; 
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555; 
}

@media (min-width: 1200px) {
  .container, .container-lg, .container-md, .container-sm, .container-xl {
      max-width: 1320px;
  }
}

@media(max-width: 1200px) {
  .xl-gap {
    gap: 24px;
  }
}

.Vue-Toastification__container {
  z-index: 999999999999999999999999;
}
</style>
