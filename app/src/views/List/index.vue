<template>
  <div class="card w-full">
    <div class="card-body p-0 py-4">
        <div class="d-flex justify-content-between align-items-center px-4 pb-3">
          <h2 class="m-0">New Contracts</h2>
          <div class="d-flex" style="position: relative;">
            <input @keyup="onSearch" id="contract-address-search" type="text"  class="form-control" placeholder="Search...">
            <div class="button-text d-flex justify-content-center align-items-center">
              <a @click="onTG" style="" class="btn-theme" >Telegram</a>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <div class="table m-0 align-items-center border0 w-100">
              <div v-for="contract in contracts" :key="'initial' + contract.get('address')"
                style="border-bottom: 1px solid gray; cursor: pointer"
                @click="onOpenContract(contract)"
              >
                <div class="d-flex justify-between">
                  <td>
                    <b>Name:</b><b style="margin-left: 20px;">{{ contract.get('name') }} / {{ contract.get('symbol') }}</b> 
                  </td>
                  <td>
                    <b>Contract:</b> {{formatAddress(contract.get('address'))}}
                  </td>
                  <td>
                    <b>Owner:</b> {{formatAddress(contract.get('owner'))}} {{ contract.get('balance') ? '/' + contract.get('balance') : '' }}
                    <b style="margin-left: 10px;">Deploys: </b> {{ contract.get('numDeployed') }}
                    <b style="margin-left: 10px;">LP Removes: </b> {{ contract.get('numRemoved') }}
                  </td>
                  <td>
                    <b>Total Supply:</b> {{ formatNumber(contract.get('totalSupply')) }}
                  </td>
                  <td>
                    <b>Decimals:</b> {{ contract.get('decimals') }}
                  </td>
                </div>
                <div class="d-flex justify-between">
                  <td>
                    <b>Function:</b> {{ contract.get('function') }}
                  </td>
                  <td>
                    <b>Max TX:</b> {{ contract.get('maxTx') }}, <b>Wallet</b> : {{ contract.get('maxWallet') }}
                  </td>
                  <td>
                    <b>Buy Tax:</b> {{ contract.get('buyTax') }}, Sell Tax: {{ contract.get('sellTax') }} 
                  </td>
                  <td>
                    <b>Early Buy:</b> {{ contract.get('earlyBuyTax') }}  <b>Early Sell</b> : {{ contract.get('earlySellTax') }}
                  </td>
                  <td>
                    <b>Dead Block:</b> {{ contract.get('deadBlocks') }}, Buy Tax : {{ contract.get('deadBlockBuyTax') }}, Sell Tax : {{ contract.get('deadBlockSellTax') }}
                  </td>
                </div>
              </div>
              <div class="button-text d-flex justify-content-center align-items-center mt-4">
                <a @click="loadMore" style="" class="btn-theme" >Load more</a>
              </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import Utils from '@/helpers/Utils';

export default {
  name: "List",
  props: [],
  components: {
  },
  data() {
    return {
      contracts: [],
      offset: 0,
      pageSize: 6,
      query: '',
      timer: null
    };
  },
  beforeDestroy() {
  },
  computed: {
    ...mapGetters({
    })
  },
  watch: {
  },
  async mounted() {
    this.refresh();
  },
  methods: {
    ...mapActions({
    }),
    onTG() {
      window.open('https://insidor.org')
    },
    async refresh() {
    },
    onSearch() {
    },
    async loadMore() {
    },
    onOpenContract() {
    },
    formatAddress(address) {
      return Utils.formatAddress(address);
    },
    formatNumber(num, digits) {
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
    },
  },
};
</script>
<style scoped>
.justify-between{
  justify-content: space-between;
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
    td:nth-of-type(1):before { content: "Name: "; }
		td:nth-of-type(2):before { content: "Balance: "; }
		td:nth-of-type(3):before { content: "TP/SL: "; }
		td:nth-of-type(4):before { content: "Function: "; }

    th {
      display: none;
    }
	}
</style>