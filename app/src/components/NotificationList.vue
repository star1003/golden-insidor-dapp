<template>
  <div class="card">
    <div class="card-body p-0 py-4">
      <div class="d-flex justify-content-between align-items-center px-4 pb-3">
        <h2 class="m-0">Orders</h2>
        <div class="d-flex" v-if="address">
          <div class="d-flex mx-2 align-items-center dm">
            <input v-model="isMyPnl" id="orders_mine" class="form-check-input" type="checkbox" value="" aria-label="...">
            <label class="me-2 m-0 ps-3" for="orders_mine">Mine</label>
          </div>
          <div>
            <span style="margin-right: 6px; font-weight: 900; font-size: 14px;">PnL: </span>
            <span style="font-weight: 900; font-size: 18px;" :class="tokenProfit < 0 ? 'text-danger' : 'text-success'">{{tokenProfit}} {{getNetwork().currency}}</span>
          </div>
        </div>
        <div>
          <span style="margin-right: 6px; font-weight: 900; font-size: 14px;">Total: </span>
          <span style="font-weight: 900; font-size: 18px;" :class="profit < 0 ? 'text-danger' : 'text-success'">{{profit}} {{getNetwork().currency}}</span>
          <img class="ms-lg-2 pointer" src="img/info-card.svg" onclick="Intercom('showArticle', 6071560)"/>
        </div>
      </div>
      <div class="table-responsive">
        <!-- <div class="p-0 px-4">*Total PnL is currently not accurate as it doesn't calculate the fund refunded for the <b class="pointer" onclick="Intercom('showArticle', 6021003)">Max percent</b> limit of the token.</div> -->
        <table class="table m-0 align-items-center">
          <thead>
            <tr>
              <th>Token</th>
              <th>{{getNetwork().currency}}</th>
              <!-- <th>Out</th> -->
              <th>Gas</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders.data" :key="order.id">
              <!-- <td><span :class="getType(order) == 'buy' ? 'text-danger' : 'text-success'">{{getType(order)}}</span></td> -->
              <td class="pointer" @click="openOrderDetails(order)">{{order.get('symbol') || formatAddress(order.get('token1'))}}</td>
              <td><span :class="getType(order) == 'buy' ? 'text-danger' : 'text-success'">{{getEthAmount(order)}}</span></td>
              <!-- <td>{{getTokenAmount(order)}}</td> -->
              <td>{{getGas(order)}}</td>
              <td style="white-space: nowrap;">{{getTime(order)}}</td>
            </tr>
          </tbody>
        </table>

        <div class="button-text d-flex justify-content-center align-items-center mt-4">
          <a @click="loadMore" style="" class="btn-theme" >Load more</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import { mapGetters, mapActions } from "vuex";
import Utils from '@/helpers/Utils';
import Web3 from '@/helpers/Web3';
import Observer from '@/helpers/Observer';
import {E_NEW_ORDER} from "@/constants/events";

export default {
  name: "AccountList",
  components: {
  },
  computed: {
    ...mapGetters({
      status: 'information/status',
      orders: 'information/orders',
    }),
    tokenProfit() {
      return this.formatBalance(parseInt(this.tokenPnl));
    },
    profit() {
      const sum = this.status.reduce((sum, stat) => {
        // eslint-disable-next-line no-undef
        return sum + BigInt(stat.get('ethAmount'))
      // eslint-disable-next-line no-undef
      }, BigInt(0));
      return this.formatBalance(parseInt(sum));
    }
  },
  watch: {
    async $route() {
      this.updatePnL();
    },
    isMyPnl() {
      this.updatePnL();
    }
  },
  beforeDestroy() {
    clearInterval(this.tokenPnlTimer);
    Observer.$off(E_NEW_ORDER);
  },
  async mounted() {
    this.update();
    this.updatePnL();
    // eslint-disable-next-line no-unused-vars
    Observer.$on(E_NEW_ORDER, (order) => {
      this.page = 1;
      this.update();
    });
  },
  methods: {
    ...mapActions({
      fetchStatus: 'information/fetchStatus',
      fetchOrders: 'information/fetchOrders',
      fetchContract: 'contracts/get',
    }),
    async updatePnL() {
      clearInterval(this.tokenPnlTimer);
      this.address = this.$route.params.address;
      const address = this.address;
      if (!Web3.isAddress(address)) {
        this.address = null;
        return;
      }
      // const contract = await this.fetchContract(this.address);
      const updater = async () => {
      };
      updater();
      this.tokenPnlTimer = setInterval(updater, 30000);
    },
    loadMore() {
      this.page += 1;
      this.fetchOrders({pageSize: this.pageSize, page: this.page});
    },
    async update() {
      await this.fetchStatus();
      await this.fetchOrders({pageSize: this.pageSize, page: this.page});
    },
    openOrderDetails(order) {
      window.open(this.getNetwork().explorer + 'tx/' + order.get('tx'));
    },
    formatBalance(balance, decimals) {
      if (!balance) {
        return '_';
      }
      return Utils.formatBalance(balance, decimals);
    },
    getType(order) {
      return order.get('type');
    },
    getEthAmount(order) {
      const prefix = this.getType(order) == 'buy' ? '-' : '';
      return prefix + this.formatBalance(order.get('ethAmount')) + this.getNetwork().currency;
    },
    getTokenAmount(order) {
      return this.formatBalance(order.get('token1Amount'));
    },
    getGas(order) {
      return this.formatBalance(order.get('gasFee')) + this.getNetwork().currency;
    },
    getTime(order) {
      const date = new Date(order.createdAt);
      return date.toLocaleString();
    },
    getNetwork() {
      return Web3.getNetwork();
    },
    formatAddress(address) {
      return Utils.formatAddress(address);
    },
  },
  data() {
    return {
      pageSize: 5,
      page: 1,
      isMyPnl: true,
      tokenPnl: 0,
      tokenPnlTimer: null,
      address: null
    };
  },
};
</script>

<style scoped>
</style>