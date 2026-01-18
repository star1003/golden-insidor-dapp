<template>
  <div class="card">
    <div id="active-contracts-card" class="card-body p-0 py-4">
        <div class="d-flex justify-content-between align-items-center px-4 pb-3">
          <h2 class="m-0">Active Contracts</h2>
          <!-- Tabs navs -->
          <div class="tabs-btn">
              <ul class="nav nav-tabs mb-3" id="ex1" role="tablist">
                <li class="nav-item" role="presentation">
                    <a
                      class="nav-link text-capitalize"
                      :class="tab == 'live' ? 'active' : ''"
                      id="ex1-tab-1"
                      data-mdb-toggle="tab"
                      @click="switchTab('live')"
                      role="tab"
                      aria-controls="ex1-tabs-1"
                      aria-selected="true"
                      >Live</a
                      >
                </li>
                <li class="nav-item" role="presentation">
                    <a
                      class="nav-link text-capitalize"
                      :class="tab == 'past' ? 'active' : ''"
                      id="ex1-tab-2"
                      data-mdb-toggle="tab"
                      @click="switchTab('past')"
                      role="tab"
                      aria-controls="ex1-tabs-2"
                      aria-selected="false"
                      >Past</a
                      >
                </li>
              </ul>
          </div>
        </div>
        <!-- Tabs navs -->
        <!-- Tabs content -->
        <div class="tab-content" id="ex1-content">
          <div
              class="tab-pane fade show active"
              id="ex1-tabs-1"
              role="tabpanel"
              aria-labelledby="ex1-tab-1"
              >
              <div class="table-responsive">
                <table v-if="watches.length > 0" class="table m-0 align-items-center">
                  <thead>
                    <tr>
                        <th>Name</th>
                        <th>Symbol</th>
                        <th>Price</th>
                        <th>MC</th>
                        <th style="text-align: center">Chart</th>
                        <!-- <th>Price (24h)</th> -->
                        <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="watch in watches" :key="watch.id" @click="goToDetails(watch)">
                      <td style="cursor: pointer;" >{{watch.get('name')}}</td>
                      <td>{{watch.get('symbol')}}</td>
                      <td>{{getPrice(watch)}}</td>
                      <td>{{getMarketCap(watch)}}</td>
                      <td>
                        <line-chart width="150px" height="60px" :data="chartData[watch.get('address')]"
                        ></line-chart>
                      </td>
                      <!-- <td><span class="text-success">$1500 (+200%)</span></td> -->
                      <td>
                        <div class="edit">
                            <a class="me-2" @click.stop="openChart(watch)"><img class="action-icon" src="img/view.svg"/></a>
                            <a @click.stop="deleteWatch(watch)"><img class="action-icon" src="img/Delete.svg"/></a>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-else style="margin-left: 25px;">
                  There is no active contract. Please add one by searching contract address
                </div>
              </div>
          </div>
        </div>
        <!-- Tabs content -->
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import { mapGetters, mapActions } from "vuex";
import Utils from '@/helpers/Utils';
import Web3 from '@/helpers/Web3';
import Zerion from '@/helpers/Zerion';
import Vue from 'vue';
// import Sample from './sample.json';

export default {
  name: "ActiveList",
  components: {
    
  },
  computed: {
    ...mapGetters({
      liveList: 'watches/liveList',
      pastList: 'watches/pastList'
    }),
    watches() {
      return this[this.tab + 'List'];
    }
  },
  watch: {
    liveList() {
      if (!this.liveList) {
        return;
      }
      this.refreshChart();
    }
  },
  async mounted() {
    this.chartData = {} //.slice(0, 100);
    // if (this.liveList) {
      this.refreshChart();
    // }
    this.timer = setInterval(this.refreshChart, 10000);
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  methods: {
    ...mapActions({
      fetch: 'watches/fetch',
      delete: 'watches/delete'
    }),
    refreshChart() {
      if (!this.liveList || this.liveList.length == 0) {
        return;
      }
      // console.log('refresh');
      if (new Date().getTime() < this.lastTimeRefresh + 9000) {
        return;
      }
      this.lastTimeRefresh = new Date().getTime();
      this.liveList.map(watch => {
        const address = watch.get('address').toLowerCase();
        Zerion.getAssetCharts(address, 'd').then(response => {
          const data = response[address];
          if (!data || !data.length) {
            Vue.set(this.chartData, watch.get('address'), []);
            return;
          }
          Vue.set(this.chartData, watch.get('address'), data);
        });
      })
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
        
        return '_';
      }
    },
    getNetwork() {
      return Web3.getNetwork();
    },
    openChart(watch) {
      const url = this.getNetwork().dextool + watch.get('address');
      window.open(url);
    },
    formatAddress(address) {
      return Utils.formatAddress(address);
    },
    deleteWatch(watch) {
      this.delete({
        address: watch.get('address'),
        type: this.tab
      });
    },
    goToDetails(watch) {
      this.$router.push({
        name: 'Contract',
        params: {
          address: watch.get('address')
        }
      })
    },
    switchTab(tab) {
      this.tab = tab;
    }
  },
  data() {
    return {
      tab: 'live',
      chartData: {},
      lastTimeRefresh: 0,
      timer: null
    };
  },
};
</script>

<style scoped>
</style>