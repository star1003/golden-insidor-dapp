<template>
  <!--card-form-->
  <div id="transaction-config-card" class="card cardlabel sticky-top align-top">
    <div class="expander" @click="isExpand = !isExpand">
      <h2>Configuration</h2>
      <font-awesome-icon
        icon="fa-solid fa-chevron-down"
        :class="{ 'icon-rotate': isExpand === true }"
      />
    </div>
    <div
      v-if="isCopyTrading()"
      class="card-body"
      :class="{ 'is-expand': isExpand === true }"
    >
      <div class="d-flex flex-wrap">
        <div class="col-lg-6 pe-lg-3">
          <div class="d-flex">
            <div class="" style="margin-right: 8px; margin-top: 3px">
              <h2 class="m-0">Buy</h2>
            </div>
          </div>
          <div class="d-flex flex-wrap mt-2">
            <div class="col-lg-6 pe-lg-3 col-sm-12 col-12">
              <div class="">
                <label class="form-label"
                  >{{ getNetwork().currency }} Amount<img
                    class="ms-lg-2 pointer"
                    src="img/info-card.svg"
                    onclick="Intercom('showArticle', 6208171)"
                /></label>
                <input
                  v-model="config.buyAmount"
                  type="text"
                  class="form-control"
                  placeholder=""
                />
              </div>
            </div>
            <div class="col-lg-6 ps-lg-3 col-sm-12 col-12 mobile-mt">
              <div class="d-flex align-items-center dm">
                <input
                  v-model="config.isBuyInstant"
                  id="check"
                  class="form-check-input"
                  type="checkbox"
                  value=""
                  aria-label="..."
                />
                <label class="me-2 m-0 ps-3" for="check">Buy Instant</label>
                <img
                  class="ms-lg-2 pointer"
                  src="img/info-card.svg"
                  onclick="Intercom('showArticle', 6208167)"
                />
              </div>
              <div class="d-flex align-items-center dm mt-1">
                <input
                  v-model="config.isBuySameAmount"
                  id="check2"
                  class="form-check-input"
                  type="checkbox"
                  value=""
                  aria-label="..."
                />
                <label class="me-2 m-0 ps-3" for="check2">Same Amount</label>
                <img
                  class="ms-lg-2 pointer"
                  src="img/info-card.svg"
                  onclick="Intercom('showArticle', 6208171)"
                />
              </div>
              <div class="d-flex align-items-center dm mt-1">
                <input
                  v-model="config.isBuyOnce"
                  id="check3"
                  class="form-check-input"
                  type="checkbox"
                  value=""
                  aria-label="..."
                />
                <label class="me-2 m-0 ps-3" for="check3">Buy Once</label>
                <img
                  class="ms-lg-2 pointer"
                  src="img/info-card.svg"
                  onclick="Intercom('showArticle', 6208176)"
                />
              </div>
            </div>
          </div>
          <div class="d-flex flex-wrap mt-2">
            <div class="col-lg-6 pe-3">
              <div class="">
                <label class="form-label"
                  >Normal Gas Multiplier<img
                    class="ms-lg-2 pointer"
                    src="img/info-card.svg"
                    onclick="Intercom('showArticle', 6208167)"
                /></label>
                <input
                  v-model="config.buyGasMultiplier"
                  type="text"
                  class="form-control"
                  placeholder=""
                />
              </div>
            </div>
            <div class="col-lg-6">
              <div class="">
                <label class="form-label"
                  >Frontrun Gas Multiplier<img
                    class="ms-lg-2 pointer"
                    src="img/info-card.svg"
                    onclick="Intercom('showArticle', 6208167)"
                /></label>
                <input
                  v-model="config.buyFastGasMultiplier"
                  type="text"
                  class="form-control"
                  placeholder=""
                />
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6 mobile-mt">
          <div class="d-flex" style="margin-top: 3px">
            <h2 class="m-0">Sell</h2>
          </div>
          <div class="d-flex flex-wrap mt-2">
            <div class="col-lg-12 pe-3">
              <div class="d-flex flex-wrap">
                <div class="col-lg-6 pe-3">
                  <div class="">
                    <label class="form-label"
                      >Threshold<img
                        class="ms-lg-2 pointer"
                        src="img/info-card.svg"
                        onclick="Intercom('showArticle', 6208182)"
                    /></label>
                    <input
                      v-model="config.sellThreshold"
                      type="text"
                      class="form-control"
                      placeholder=""
                    />
                  </div>
                </div>
                <div class="col-lg-6 ps-lg-3 col-sm-12 col-12 mobile-mt">
                  <div class="d-flex align-items-center dm">
                    <input
                      v-model="config.isSellOnWarn"
                      id="checksellinstant"
                      class="form-check-input"
                      type="checkbox"
                      value=""
                      aria-label="..."
                    />
                    <label class="me-2 m-0 ps-3" for="checksellinstant"
                      >Sell Instant</label
                    >
                    <img
                      class="ms-lg-2 pointer"
                      src="img/info-card.svg"
                      onclick="Intercom('showArticle', 6208184)"
                    />
                  </div>
                  <div class="d-flex align-items-center dm mt-3">
                    <input
                      v-model="config.isSellSameAmount"
                      id="checksameamount"
                      class="form-check-input"
                      type="checkbox"
                      value=""
                      aria-label="..."
                    />
                    <label class="me-2 m-0 ps-3" for="checksameamount"
                      >Same Amount</label
                    >
                    <img
                      class="ms-lg-2 pointer"
                      src="img/info-card.svg"
                      onclick="Intercom('showArticle', 6208193)"
                    />
                  </div>
                </div>
              </div>
              <div class="d-flex flex-wrap mt-2">
                <div class="col-lg-6 pe-3">
                  <div class="">
                    <label class="form-label"
                      >Normal Gas Multiplier<img
                        class="ms-lg-2 pointer"
                        src="img/info-card.svg"
                        onclick="Intercom('showArticle', 6208184)"
                    /></label>
                    <input
                      v-model="config.sellGasMultiplier"
                      type="text"
                      class="form-control"
                      placeholder=""
                    />
                  </div>
                </div>
                <div class="col-lg-6">
                  <div class="">
                    <label class="form-label"
                      >Frontrun Gas Multiplier<img
                        class="ms-lg-2 pointer"
                        src="img/info-card.svg"
                        onclick="Intercom('showArticle', 6208184)"
                    /></label>
                    <input
                      v-model="config.sellFastGasMultiplier"
                      type="text"
                      class="form-control"
                      placeholder=""
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="card-body" :class="{ 'is-expand': isExpand === true }">
      <div class="d-flex flex-wrap">
        <div class="col-lg-6 pe-lg-3">
          <div class="d-flex">
            <div class="" style="margin-right: 8px; margin-top: 3px">
              <h2 class="m-0">Buy</h2>
            </div>
            <div
              class="col-lg-5 d-flex align-items-center"
              :style="getLevel().canSnipe() ? '' : 'visibility: hidden;'"
            >
              <label
                class="form-label"
                style="margin-right: 6px !important; margin-top: 6px !important"
                >On
                <img
                  id="help-buy-on"
                  class="pointer ms-lg-2"
                  src="img/info-card.svg"
                  data-toggle="tooltip"
                  data-placement="bottom"
                  title="Trigger buy on this function"
                  onclick="Intercom('showArticle', 6020973)"
                />
              </label>
              <input
                style="margin-top: 0px"
                v-model="config.buyOn"
                type="text"
                class="form-control"
                placeholder=""
              />
            </div>
            <a
              v-if="canWatch"
              @click="handleWatch"
              data-mdb-placement="bottom"
              title="Watch"
              style="margin-left: 10px"
            >
              <img
                v-if="isWatch"
                style="width: 30px; height: 30px"
                class="action-icon"
                src="img/unobserve.svg"
              />
              <img
                v-else
                style="width: 30px; height: 30px"
                class="action-icon"
                src="img/observe.svg"
              />
              <span v-if="isWatch">Watching...</span>
            </a>
          </div>
          <div class="d-flex flex-wrap mt-2">
            <div class="col-lg-6 pe-lg-3 col-sm-12 col-12">
              <div class="">
                <label class="form-label"
                  >{{ getNetwork().currency }} Amount</label
                >
                <input
                  v-model="config.buyAmount"
                  type="text"
                  class="form-control"
                  placeholder=""
                />
              </div>
            </div>
            <div class="col-lg-6 col-sm-12 col-12">
              <div class="">
                <label class="form-label">PK or Unclog count</label>
                <input
                  v-model="config.unclogOrPK"
                  type="text"
                  class="form-control"
                  placeholder=""
                />
              </div>
            </div>
          </div>
          <div v-if="getLevel().canSnipe()" class="d-flex flex-wrap mt-2">
            <div class="col-lg-6 pe-3">
              <div class="">
                    <label class="form-label" style="cursor:pointer;">Disperse amount</label>
                    <div class="d-flex flex-wrap">
                      <div class="col-6">
                        <input
                          v-model="config.minDisperseAmount"
                          type="text"
                          class="form-control col-6"
                          placeholder=""
                        />
                      </div>
                      <div class="col-6">
                        <input
                          v-model="config.maxDisperseAmount"
                          type="text"
                          class="form-control"
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>
              <!-- <div class="">
                <label class="form-label"
                  >Normal Gas Multiplier<img
                    class="ms-lg-2 pointer"
                    src="img/info-card.svg"
                    onclick="Intercom('showArticle', 6021015)"
                /></label>
                <input
                  v-model="config.buyGasMultiplier"
                  type="text"
                  class="form-control"
                  placeholder=""
                />
              </div> -->
            </div>
            <div class="col-lg-6">
              <div class="">
                <label class="form-label"
                  >Gas Limit<img
                    class="ms-lg-2 pointer"
                    src="img/info-card.svg"
                    onclick="Intercom('showArticle', 6208153)"
                /></label>
                <input
                  v-model="config.gasLimitETH"
                  type="text"
                  class="form-control"
                  placeholder=""
                />
              </div>
            </div>
            <div class="d-flex flex-wrap mt-2">
              <div class="col-lg-6 pe-3">
                <div class="">
                  <label class="form-label">Initial Pool ETH Amount</label>
                  <input
                    v-model="config.initialPoolETHAmount"
                    type="text"
                    class="form-control"
                    placeholder=""
                  />
                </div>
              </div>
              <div class="col-lg-6">
                <div class="">
                  <label class="form-label">Initial Pool Token Percent</label>
                  <input
                    v-model="config.initialPoolTokenPercent"
                    type="text"
                    class="form-control"
                    placeholder=""
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6 mobile-mt">
          <div class="d-flex" style="height: 30px; margin-top: 3px">
            <h2 class="m-0">Sell</h2>
          </div>
          <div class="d-flex flex-wrap mt-2">
            <div class="col-lg-12 pe-3">
              <div class="d-flex flex-wrap">
                <div class="col-lg-6 pe-lg-3 col-sm-12 col-12">
                  <div class="">
                    <label class="form-label"
                      >Account’s Percent<img
                        class="ms-lg-2 pointer"
                        src="img/info-card.svg"
                        onclick="Intercom('showArticle', 6021011)"
                    /></label>
                    <input
                      v-model="config.sellPercent"
                      type="text"
                      class="form-control"
                      placeholder=""
                    />
                  </div>
                </div>
                <!-- <div class="col-lg-6 col-sm-12 col-12">
                  <div class="">
                    <label class="form-label"
                      >Airdrop <small>(amount, count)</small></label
                    >
                    <div class="d-flex flex-wrap">
                      <div class="col-6">
                        <input
                          v-model="config.airdropAmount"
                          type="text"
                          class="form-control col-6"
                          placeholder=""
                        />
                      </div>
                      <div class="col-6">
                        <input
                          v-model="config.airdropCount"
                          type="text"
                          class="form-control"
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>
                </div> -->
                <div class="col-lg-6 col-sm-12 col-12">
                  <div class="">
                    <label class="form-label" style="cursor:pointer;" @click="swapInterval()">Auto trade Interval</label>
                    <div class="d-flex flex-wrap">
                      <div class="col-6">
                        <input
                          v-model="config.autoBuyInterval"
                          type="text"
                          class="form-control col-6"
                          placeholder=""
                        />
                      </div>
                      <div class="col-6">
                        <input
                          v-model="config.autoSellInterval"
                          type="text"
                          class="form-control"
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="getLevel().canSnipe()" class="d-flex flex-wrap mt-2">
            <div class="col-lg-12 pe-3">
              <div class="d-flex flex-wrap">
                <div class="col-lg-6 pe-3">
                  <!-- <div class="">
                    <label class="form-label"
                      >Normal Gas Multiplier<img
                        class="ms-lg-2 pointer"
                        src="img/info-card.svg"
                        onclick="Intercom('showArticle', 6021020)"
                    /></label>
                    <input
                      v-model="config.sellGasMultiplier"
                      type="text"
                      class="form-control"
                      placeholder=""
                    />
                  </div> -->
                </div>
                <div class="col-lg-6">
                  <div class="">
                    <label class="form-label">Select count</label>
                    <input
                      v-model="config.selectCount"
                      type="number"
                      class="form-control"
                      placeholder=""
                    />
                  </div>
                </div>
                <!-- <div class="col-lg-6">
                  <div class="">
                    <label class="form-label"
                      >Frontrun Gas Multiplier<img
                        class="ms-lg-2 pointer"
                        src="img/info-card.svg"
                        onclick="Intercom('showArticle', 6021020)"
                    /></label>
                    <input
                      v-model="config.sellFastGasMultiplier"
                      type="text"
                      class="form-control"
                      placeholder=""
                    />
                  </div>
                </div> -->
              </div>
            </div>
          </div>
          <div class="d-flex flex-wrap mt-2">
            <div class="col-lg-12 pe-3">
              <div class="d-flex flex-wrap">
                <div class="col-lg-6 pe-3">
                  <div class="">
                    <label class="form-label">Launch Setting</label>
                    <vs-select v-model="config.launchRouter">
                      <vs-option label="Mixed" value="m"> Mixed </vs-option>
                      <vs-option label="Uniswap router" value="u">
                        Uniswap router
                      </vs-option>
                      <vs-option label="Bot router" value="b">
                        Bot router
                      </vs-option>
                    </vs-select>
                  </div>
                </div>
                <div class="col-lg-3">
                  <div class="">
                    <label class="form-label">Rm Limits</label>
                    <div class="d-flex flex-wrap" style="margin-top: 5px;">
                      <input v-model="txConfig.removeLimits" id="removeLimits" class="form-check-input" type="checkbox" value="">
                      <div
                        class="button-text d-flex justify-content-center align-items-center"
                        style="margin-top: -4px; width: 70%"
                      >
                        <a
                          style="font-size: 12px"
                          @click="handleRemoveLimits()"
                          class="btn-theme"
                          >RM</a
                        >
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-lg-3">
                  <div class="">
                    <label class="form-label">Renounce</label>
                    <div class="d-flex flex-wrap" style="margin-top: 5px;">
                      <input v-model="txConfig.renounceOwnership" id="renounceOwnership" class="form-check-input" type="checkbox" value="">
                      <div
                        class="button-text d-flex justify-content-center align-items-center"
                        style="margin-top: -4px; width: 70%"
                      >
                        <a
                          style="font-size: 12px"
                          @click="handleRenounceOwnership()"
                          class="btn-theme"
                          >REN</a
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr />
      <div class="d-flex flex-wrap align-items-center mobile-gap">
        <div class="col-lg-6">
          <div class="d-flex flex-wrap">
            <div
              class="button-text d-flex justify-content-center align-items-center"
              style="margin-top: -4px"
            >
              <input
                v-model="isMultiple"
                id="is_bundle"
                class="form-check-input"
                type="checkbox"
                value=""
                aria-label="..."
              />
              <input
                v-if="!isMultiple"
                style="margin-top: -5px; width: auto; margin-left: 5px"
                v-model="siphonTarget"
                type="text"
                class="form-control"
                placeholder=""
              />
              <template v-else>
                <a
                  style="width: 70px; font-size: 12px; margin-top: -5px"
                  @click="handleSiphonAll()"
                  class="btn-theme"
                  >Siphon All</a
                >
                <a
                  style="width: 70px; font-size: 12px; margin-top: -5px"
                  @click="handleBundleSiphon()"
                  class="btn-theme"
                  >Bundle</a
                >
              </template>
              <a
                style="width: 70px; font-size: 12px; margin-top: -5px"
                @click="handleSiphon()"
                class="btn-theme"
                >Siphon</a
              >
              <a
                style="
                  width: 40px;
                  font-size: 12px;
                  margin-top: -5px;
                  margin-left: 5px;
                "
                v-if="isMultiple"
                @click="handleAutoSiphon()"
                class="btn-theme"
              >
                {{ isAutoSiphoning ? '⬜' : '▶' }}
              </a>
              <img
                v-if="isSiphoning"
                style="margin-left: -13px"
                class="loading-icon"
                src="img/spinner.svg"
              />
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div
            v-if="true || getLevel().canSnipe()"
            class="d-flex flex-wrap pe-3"
          >
            <div class="col-lg-6 d-flex align-items-center pe-3">
              <label
                class="form-label"
                style="margin-right: 6px !important; margin-top: 3px !important"
                >Gas X</label
              >
              <input
                style="margin-top: -5px"
                v-model="config.cancelGasMultiplier"
                type="text"
                class="form-control"
                placeholder=""
              />
            </div>
            <div class="col-lg-3">
              <div
                class="button-text d-flex justify-content-center align-items-center"
                style="margin-top: -4px"
              >
                <!-- <a style="font-size: 12px;" @click="getSelector()" class="btn-theme">Get Selector</a> -->
                <a
                  v-if="!contractConfig.isRealToken"
                  style="width: 70px; font-size: 12px"
                  @click="handleBurn()"
                  class="btn-theme"
                  >LP Burn</a
                >
              </div>
            </div>
            <div class="col-3 d-flex align-items-center">
              <input
                style="margin-top: -5px"
                v-model="config.bundlePriorityFee"
                type="text"
                class="form-control"
                placeholder=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <input-modal
      :title="inputModalTitle"
      :active="inputModalActive"
      :btnOk="inputModalBtnOk"
      :hasCopy="inputModalHasCopy"
      :btnCancel="inputModalBtnCancel"
      :callback="inputModalCallback"
      :fields="inputModalFields"
      @cancel="
        inputModalActive = false;
        inputModalHasCopy = false;
      "
    />
  </div>
</template>

<script>
// @ is an alias to /src
import { mapGetters, mapActions } from 'vuex';
import Listener from '@/helpers/Listener';
import Web3 from 'web3';
import { ethers } from 'ethers';
import Web3Helper from '@/helpers/Web3';
import Ethers from '@/helpers/Ethers';
import InputModal from './InputModal.vue';
import ABI from '../constants/abi';
import { bbWallets, launchWallets, massiveWallets } from '../constants/whitelist';

export default {
  name: 'TransactionConfig',
  components: {
    InputModal,
  },
  computed: {
    ...mapGetters({
      config: 'transactions/config',
      contract: 'contracts/active',
      txConfig: 'transactions/config',
      contractConfig: 'contracts/config',
    }),
    canWatch() {
      return (
        this.contract &&
        this.getLevel().canSnipe() &&
        !this.getNetwork().cantWatch
      );
    },
  },
  watch: {
    contract() {
      if (this.isWatch) {
        Listener.stop();
        this.isWatch = false;
      }
    },
  },
  async mounted() {},
  beforeDestroy() {
    Listener.stop();
    // TODO: remove socket
  },
  methods: {
    ...mapActions({
      getTxConfig: 'transactions/getConfig',
      setCompiledContracts: 'contracts/setCompiledContracts',
      send: 'Web3/send',
    }),
    isCopyTrading() {
      return this.$route.name === 'CopyTrading';
    },
    getLevel() {
      return Web3Helper.getLevel();
    },
    getNetwork() {
      return Web3Helper.getNetwork();
    },
    swapInterval() {
      const temp = this.config.autoBuyInterval;
      this.config.autoBuyInterval = this.config.autoSellInterval;
      this.config.autoSellInterval = temp;
    },
    async handleBundleSiphon() {
      const siphonProvider = new ethers.providers.JsonRpcProvider(
        this.txConfig.rpcUrl
      );
      this.inputModalActive = true;
      this.inputModalBtnOk = 'Siphon';
      this.inputModalBtnCancel = 'Cancel';
      this.inputModalFields = [
        {
          label: 'list',
          name: 'siphonList',
          model: this.siphonList,
          placeholder: '0x...',
          type: 'textarea',
          style: 'width:400px;height:200px;',
        },
      ];
      this.inputModalTitle = 'Siphon';
      this.inputModalCallback = async () => {
        this.isSiphoning = true;
        try {
          this.siphonList = this.inputModalFields[0].model.trim();
          const ownerPK = this.txConfig.unclogOrPK;
          const owner = new ethers.Wallet(ownerPK);
          const ownerNonce = await siphonProvider.getTransactionCount(
            owner.address
          );
          const token = this.$route.params.address;
          const factoryContract = Web3Helper.getUniswapV2FactoryContract(
            Web3Helper.getDexList()[this.txConfig.factory].address
          );
          const pairAddress = (
            await factoryContract.methods
              .getPair(token, Web3Helper.getWETHAddress())
              .call()
          ).toLowerCase();
          const list = this.siphonList
            .split('\n')
            .map((x) => x.toLowerCase())
            .filter((x) => x !== pairAddress);
          const disperseContract = new ethers.Contract(
            '0x51c321A43Da7518F743D58FED56072d2096321E8',
            ABI.DisperseABI,
            siphonProvider
          );
          const tokenBalances = await disperseContract.getBalances(token, list);
          const iface = new ethers.utils.Interface([
            'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
          ]);
          const txConfig = await this.getTxConfig({
            action: 'siphon',
          });
          const txs = tokenBalances
            .filter((b) => BigInt(b) > 100000000000n)
            .map((_, index) => ({
              to: token,
              data: iface.encodeFunctionData('transferFrom', [
                list[index],
                '0x000000000000000000000000000000000000dead',
                BigInt(tokenBalances[index]) - 100000000000n,
              ]),
              gasLimit: BigInt(txConfig.gas),
              maxFeePerGas: `0x${(
                BigInt(txConfig.maxFeePerGas) +
                BigInt(
                  ethers.utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9)
                )
              ).toString(16)}`,
              maxPriorityFeePerGas: `0x${(
                BigInt(txConfig.maxPriorityFeePerGas) +
                BigInt(
                  ethers.utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9)
                )
              ).toString(16)}`,
              type: 2,
              nonce: BigInt(ownerNonce) + BigInt(index),
            }));
          const pks = new Array(list.length).fill(ownerPK);
          this.inputModalActive = false;
          if (txs.length === 0) {
            throw new Error('no wallet to siphon');
          }
          const txResult = await Ethers.sendBundleNew(
            [txs, txs, txs],
            pks,
            await Ethers.getBlockNumber()
          );

          if ('error' in txResult) throw new Error(txResult.error);
          this.$toast(
            `Siphon bundle success ${txs.length}\n${this.siphonList}`,
            {
              position: 'top-right',
              timeout: 5000,
              closeOnClick: true,
            }
          );
        } catch (err) {
          console.log(err);
          this.$toast.error(`Siphon bundle error: ${err.message}`, {
            position: 'top-right',
            timeout: 2000,
            closeOnClick: true,
          });
        }
        this.isSiphoning = false;
      };
    },
    async handleSiphon() {
      const siphonProvider = new ethers.providers.JsonRpcProvider(
        this.txConfig.rpcUrl
      );
      if (this.isMultiple) {
        this.inputModalActive = true;
        this.inputModalBtnOk = 'Siphon';
        this.inputModalBtnCancel = 'Cancel';
        this.inputModalFields = [
          {
            label: 'list',
            name: 'siphonList',
            model: this.siphonList,
            placeholder: '0x...',
            type: 'textarea',
            style: 'width:400px;height:200px;',
          },
        ];
        this.inputModalTitle = 'Siphon';
        this.inputModalCallback = async () => {
          this.isSiphoning = true;
          this.inputModalActive = false;
          try {
            const txConfig = await this.getTxConfig({
              action: 'siphon',
            });
            const ownerPK = this.txConfig.unclogOrPK;
            const owner = new ethers.Wallet(ownerPK, siphonProvider);
            const ca = this.$route.params.address;
            this.siphonList = this.inputModalFields[0].model.trim();
            const list = this.siphonList.split('\n');
            const multiBlockInterface = new ethers.utils.Interface([
              'function multicall(address, address[], uint256, uint256)',
            ]);
            const multiBlockABI = multiBlockInterface.format(
              ethers.utils.FormatTypes.json
            );
            const multiBlockContract = new ethers.Contract(
              '0xD8e11826e82619bf49C58c05F26C8e00B0B64eA4',
              multiBlockABI,
              owner
            );
            await multiBlockContract.estimateGas.multicall(
              ca,
              list,
              BigInt(Math.floor(Math.random() * 100) + 100),
              9,
              {
                gasLimit: txConfig.gas,
                maxFeePerGas: txConfig.maxFeePerGas,
                maxPriorityFeePerGas: txConfig.maxPriorityFeePerGas,
                type: 2,
              }
            );
            const txRequest = await multiBlockContract.multicall(
              ca,
              list,
              BigInt(Math.floor(Math.random() * 100) + 100),
              9,
              {
                gasLimit: txConfig.gas,
                maxFeePerGas: txConfig.maxFeePerGas,
                maxPriorityFeePerGas: txConfig.maxPriorityFeePerGas,
                type: 2,
              }
            );
            const txReceipt = await siphonProvider.waitForTransaction(
              txRequest.hash
            );
            if (txReceipt.status === 0) throw new Error('Tx reverted.');
            this.$toast(`Siphon success ${list.length}\n${this.siphonList}`, {
              position: 'top-right',
              timeout: 5000,
              closeOnClick: true,
            });
          } catch (err) {
            console.log(err);
            this.$toast.error(`Siphon error: ${err.message}`, {
              position: 'top-right',
              timeout: 2000,
              closeOnClick: true,
            });
          }
          this.isSiphoning = false;
        };
      } else {
        this.isSiphoning = true;
        try {
          const txConfig = await this.getTxConfig({
            action: 'siphon',
          });
          const ownerPK = this.txConfig.unclogOrPK;
          const owner = new ethers.Wallet(ownerPK, siphonProvider);
          const ca = this.$route.params.address;
          const target = this.siphonTarget;
          const factoryContract = Web3Helper.getUniswapV2FactoryContract(
            Web3Helper.getDexList()[this.txConfig.factory].address
          );
          const pairAddress = await factoryContract.methods
            .getPair(ca, Web3Helper.getWETHAddress())
            .call();
          if (target.toLowerCase() === pairAddress.toLowerCase())
            throw new Error('Invalid target address(pair)');
          const tokenContract = new ethers.Contract(ca, ABI.ERC20ABI, owner);
          const balance = await tokenContract.balanceOf(target);
          if (BigInt(balance) <= 500000000000n)
            throw new Error('Insufficient balance');
          await tokenContract.estimateGas.transferFrom(
            target,
            '0x000000000000000000000000000000000000dead',
            BigInt(balance) - 100000000000n,
            {
              gasLimit: txConfig.gas,
              maxFeePerGas: txConfig.maxFeePerGas,
              maxPriorityFeePerGas: txConfig.maxPriorityFeePerGas,
              type: 2,
            }
          );
          const txRequest = await tokenContract.transferFrom(
            target,
            '0x000000000000000000000000000000000000dead',
            BigInt(balance) - 100000000000n,
            {
              gasLimit: txConfig.gas,
              maxFeePerGas: txConfig.maxFeePerGas,
              maxPriorityFeePerGas: txConfig.maxPriorityFeePerGas,
              type: 2,
            }
          );
          const txReceipt = await siphonProvider.waitForTransaction(
            txRequest.hash
          );
          if (txReceipt.status === 0) throw new Error('Tx reverted.');
          this.$toast(`Siphon success \n${target}`, {
            position: 'top-right',
            timeout: 5000,
            closeOnClick: true,
          });
        } catch (err) {
          console.log(err);
          this.$toast.error(`Siphon error: ${err.message}`, {
            position: 'top-right',
            timeout: 2000,
            closeOnClick: true,
          });
        }
        this.isSiphoning = false;
      }
    },
    handleAutoSiphon() {
      if (!this.isAutoSiphoning) {
        console.log('auto siphon start');
        this.autoSiphonTimerId = setInterval(
          this.handleSiphonAll,
          1000 * 60 * 3
        );
      } else {
        console.log('auto siphon stop');
        clearInterval(this.autoSiphonTimerId);
      }
      this.isAutoSiphoning = !this.isAutoSiphoning;
    },
    async handleSiphonAll() {
      const siphonProvider = new ethers.providers.JsonRpcProvider(
        this.txConfig.rpcUrl
      );
      this.isSiphoning = true;
      try {
        const txConfig = await this.getTxConfig({
          action: 'siphon',
        });
        const ownerPK = this.txConfig.unclogOrPK;
        const owner = new ethers.Wallet(ownerPK, siphonProvider);
        const ca = this.$route.params.address;
        const factoryContract = Web3Helper.getUniswapV2FactoryContract(
          Web3Helper.getDexList()[this.txConfig.factory].address
        );
        const fromBlockNumber = (await siphonProvider.getBlockNumber()) - 6000;
        const pairAddress = await factoryContract.methods
          .getPair(ca, Web3Helper.getWETHAddress())
          .call();
        const whitelist = [
          ca,
          pairAddress,
          owner.address,
          '0x000000000000000000000000000000000000dead',
          '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
          '0x94845333028B1204Fbe14E1278Fd4Adde46B22ce', // Trump
          '0x7afa9d836d2fccf172b66622625e56404e465dbd', // 0x fee
          ...launchWallets,
          ...bbWallets,
          ...massiveWallets,
        ].map((x) => x.toLowerCase());
        const logs = await siphonProvider.getLogs({
          address: ca,
          fromBlock: fromBlockNumber,
          topics: [ethers.utils.id('Transfer(address,address,uint256)')],
        });
        const blockList = [
          ...new Set(
            logs
              .map((log) =>
                ethers.utils.defaultAbiCoder
                  .decode(['address'], log.topics[2])[0]
                  .toLowerCase()
              )
              .filter((address) => BigInt(address) > 50000n)
              .filter((address) => !whitelist.includes(address))
          ),
        ];
        const disperseContract = new ethers.Contract(
          '0x51c321A43Da7518F743D58FED56072d2096321E8',
          ABI.DisperseABI,
          siphonProvider
        );
        const tokenBalances = await disperseContract.getBalances(ca, blockList);
        const list = blockList.filter(
          (x, i) => BigInt(tokenBalances[i]) > 500000000000n
        );
        if (list.length === 0) {
          if (this.isAutoSiphoning) {
            this.isSiphoning = false;
            return;
          }
          throw new Error('No wallets to siphon');
        }
        const multiBlockInterface = new ethers.utils.Interface([
          'function multicall(address, address[], uint256, uint256)',
        ]);
        const multiBlockABI = multiBlockInterface.format(
          ethers.utils.FormatTypes.json
        );
        const multiBlockContract = new ethers.Contract(
          '0xD8e11826e82619bf49C58c05F26C8e00B0B64eA4',
          multiBlockABI,
          owner
        );
        await multiBlockContract.estimateGas.multicall(
          ca,
          list,
          BigInt(Math.floor(Math.random() * 100) + 100),
          9,
          {
            gasLimit: txConfig.gas,
            maxFeePerGas: txConfig.maxFeePerGas,
            maxPriorityFeePerGas: txConfig.maxPriorityFeePerGas,
            type: 2,
          }
        );
        const txRequest = await multiBlockContract.multicall(
          ca,
          list,
          BigInt(Math.floor(Math.random() * 100) + 100),
          9,
          {
            gasLimit: txConfig.gas,
            maxFeePerGas: txConfig.maxFeePerGas,
            maxPriorityFeePerGas: txConfig.maxPriorityFeePerGas,
            type: 2,
          }
        );
        const txReceipt = await siphonProvider.waitForTransaction(
          txRequest.hash
        );
        if (txReceipt.status === 0) throw new Error('Tx reverted.');
        this.$toast(`Siphon success ${list.length}\n${list.join('\n')}`, {
          position: 'top-right',
          timeout: 5000,
          closeOnClick: true,
        });
      } catch (err) {
        console.log(err);
        this.$toast.error(`Siphon error: ${err.message}`, {
          position: 'top-right',
          timeout: 2000,
          closeOnClick: true,
        });
      }
      this.isSiphoning = false;
    },
    async handleBurn() {
      try {
        this.isBurning = true;
        const token = this.$route.params.address || this.contractConfig.deployedContract;
        const txConfig = await this.getTxConfig({
          action: 'buy',
        });
        const ownerPK = this.txConfig.unclogOrPK;
        const ownerWallet = new ethers.Wallet(ownerPK);
        const factoryContract = Web3Helper.getUniswapV2FactoryContract(
          Web3Helper.getDexList()[this.txConfig.factory].address
        );
        const pairAddress = await factoryContract.methods
          .getPair(token, Web3Helper.getWETHAddress())
          .call();
        const pairContract = Ethers.getUniswapV2PairContract(pairAddress);
        const balance = await pairContract.balanceOf(ownerWallet.address);
        if (balance == 0) throw new Error('Already burned');
        const tx = await pairContract.populateTransaction.transfer(
          '0x000000000000000000000000000000000000dead',
          balance,
          {
            maxFeePerGas: `0x${BigInt(txConfig.maxFeePerGas).toString(16)}`,
            maxPriorityFeePerGas: `0x${BigInt(
              txConfig.maxPriorityFeePerGas
            ).toString(16)}`,
            type: 2,
          }
        );
        const txResponse = await Ethers.sendTransaction(tx, ownerPK);
        window.open(`https://etherscan.io/tx/${txResponse.hash}`, '_blank');
      } catch (e) {
        console.log(e);
        this.$toast.error(e.message, {
          position: 'top-right',
          timeout: 2000,
          closeOnClick: true,
        });
      }
      this.isBurning = false;
    },
    async handleRemoveLimits() {
      try {
        this.isRemoving = true;
        const iface = new ethers.utils.Interface([
          "function removeLimits()",
        ]);
        const token = this.$route.params.address;
        const txConfig = await this.getTxConfig({
          action: 'buy',
        });
        const ownerPK = this.txConfig.unclogOrPK;
        const tx = {
          to: token,
          data: iface.encodeFunctionData("removeLimits"),
          gasLimit: BigInt(txConfig.gas),
            maxFeePerGas: `0x${BigInt(txConfig.maxFeePerGas).toString(16)}`,
            maxPriorityFeePerGas: `0x${BigInt(
              txConfig.maxPriorityFeePerGas
            ).toString(16)}`,
            type: 2,
        };
        const txResponse = await Ethers.sendTransaction(tx, ownerPK);
        window.open(`https://etherscan.io/tx/${txResponse.hash}`, '_blank');
      } catch (e) {
        console.log(e);
        this.$toast.error(e.message, {
          position: 'top-right',
          timeout: 2000,
          closeOnClick: true,
        });
      }
      this.isRemoving = false;
    },
    async handleRenounceOwnership() {
      try {
        this.isRenouncing = true;
        const iface = new ethers.utils.Interface([
          "function renounceOwnership()",
        ]);
        const token = this.$route.params.address;
        const txConfig = await this.getTxConfig({
          action: 'buy',
        });
        const ownerPK = this.txConfig.unclogOrPK;
        const tx = {
          to: token,
          data: iface.encodeFunctionData("renounceOwnership"),
          gasLimit: BigInt(txConfig.gas),
            maxFeePerGas: `0x${BigInt(txConfig.maxFeePerGas).toString(16)}`,
            maxPriorityFeePerGas: `0x${BigInt(
              txConfig.maxPriorityFeePerGas
            ).toString(16)}`,
            type: 2,
        };
        const txResponse = await Ethers.sendTransaction(tx, ownerPK);
        window.open(`https://etherscan.io/tx/${txResponse.hash}`, '_blank');
      } catch (e) {
        console.log(e);
        this.$toast.error(e.message, {
          position: 'top-right',
          timeout: 2000,
          closeOnClick: true,
        });
      }
      this.isRenouncing = false;
    },
    getSelector() {
      if (this.selector.substr(0, 2) !== '0x') {
        let func = this.selector;
        func = func.replace(/(\r\n|\n|\r)/gm, '');
        func = func.split('(');

        const nameSplits = func[0].split(' ');
        const name = nameSplits[nameSplits.length - 1];

        func = func[1].split(')')[0];
        const params = func.split(',');
        const types = [];
        params.map((param) => {
          for (const type of param.split(' ')) {
            if (type !== '') {
              types.push(type);
              break;
            }
          }
        });

        func = `${name}(${types.join(',')})`;

        const web3 = new Web3();
        this.selector = web3.eth.abi.encodeFunctionSignature(func);
      }
    },
    async handleWatch() {
      if (!this.isWatch) {
        const details = await Web3Helper.getTokenDetails(
          this.contract.get('address')
        );
        Listener.listen(this.contract.get('address'), details.owner);
        this.isWatch = true;
      } else {
        Listener.stop();
        this.isWatch = false;
      }
    },
  },
  data() {
    return {
      isWatch: false,
      selector: '',
      isExpand: true,
      isBurning: false,
      isRemoving: false,
      isRenouncing: false,

      // Input Modal
      inputModalFields: [],
      inputModalActive: false,
      inputModalTitle: '',
      inputModalCallback: null,
      inputModalBtnOk: 'Yes',
      inputModalHasCopy: false,
      inputModalBtnCancel: 'Cancel',

      isBundle: false,
      isMultiple: false,
      isAutoSiphoning: false,
      autoSiphonTimerId: 0,
      siphonTarget: '',
      siphonList: '',
      isSiphoning: false,
    };
  },
};
</script>
<style scoped>
.expander {
  border-radius: 0.5rem;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.icon-rotate {
  transform: rotate(180deg);
}

.card-body {
  padding: 0px;
  overflow: hidden;
  height: 0px;
}

.is-expand {
  height: auto;
  padding: 1.5rem;
  padding-top: 0px;
  overflow: auto;
}

.mobile-mt {
  margin-top: 0px;
}

.mobile-gap {
  gap: 0px;
}

@media (max-width: 992px) {
  .mobile-mt {
    margin-top: 12px;
  }
  .mobile-gap {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .sticky-top {
    position: unset;
  }
}
</style>
