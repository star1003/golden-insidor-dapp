
const state = {
  status: [],
  orders: {
    pageSize: 5,
    page: 0,
    data: []
  },
};
const getters = {
  status: (state) => state.status,
  orders: (state) => state.orders,
};
const actions = {
  async fetchStatus() {
  },
  async fetchOrders() {
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
