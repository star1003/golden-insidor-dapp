<template>
  <div class="card">
    <div id="active-contracts-card" class="card-body p-0 py-4">
      <div class="d-flex justify-content-between align-items-center px-4 pb-3">
        <h2 class="m-0">Contract Editor</h2>
        <div class="d-flex flex-row justify-content-between align-items-center">
          <input v-model="contractConfig.isRealToken" id="is_real_token" class="form-check-input" type="checkbox" value="" aria-label="...">
          <label class="me-2 m-0 ps-1" for="is_real_token">Real</label>
          <div>Solidity version:</div>
          <vs-select
            placeholder="Select solidity version"
            v-model="contractConfig.compilerVersion"
            v-if="Object.keys(contractConfig.compilerVersions).length > 0"
          >
            <vs-option
              v-for="version in Object.keys(contractConfig.compilerVersions)"
              :key="version"
              :label="version"
              :value="contractConfig.compilerVersions[version]"
            >
              {{ version }}
            </vs-option>
          </vs-select>
          <div
            class="button-text d-flex justify-content-center align-items-center"
          >
            <a style="width: 80px" @click="handleCompile()" class="btn-theme"
              >Compile</a
            >
          </div>
        </div>
      </div>
      <div class="card-body py-2">
        <div class="d-flex flex-wrap mb-2">
          <div class="col-lg-4 pe-3">
            <div class="">
              <input type="text" v-model="name" class="form-control" />
            </div>
          </div>
          <div class="col-lg-4 pe-3">
            <div class="">
              <input type="text" v-model="symbol" class="form-control" />
            </div>
          </div>
          <div class="col-lg-4">
            <div class="">
              <input
                type="text"
                v-model="contractConfig.identifier"
                class="form-control"
              />
            </div>
          </div>
        </div>
        <div class="d-flex flex-wrap mb-2">
          <div class="col-lg-12">
            <div class="">
              <textarea
                v-model="socials"
                class="form-control"
                style="height: 80px; width: 100%"
              ></textarea>
            </div>
          </div>
        </div>
        <vue-monaco-editor
          class="form-control"
          style="padding: 0px !important"
          v-model="contractConfig.code"
          theme="vs-light"
          height="400px"
          language="sol"
          :options="{
            automaticLayout: true,
            minimap: { enabled: false },
          }"
        />
      </div>
      <div
        class="card-body py-2"
        v-if="Object.keys(contractConfig.compiledContracts).length > 0"
      >
        <div class="w-100 d-flex justify-content-between">
          <vs-select
            placeholder="Select contract name"
            v-model="contractConfig.contractName"
          >
            <vs-option
              v-for="name in Object.keys(contractConfig.compiledContracts)"
              :key="name"
              :label="name"
              :value="name"
            >
              {{ name }}
            </vs-option>
          </vs-select>
          <input
            v-model="contractConfig.deployedContract"
            type="text"
            class="form-control"
            placeholder=""
            style="width: 400px; padding-left: 5px; padding-right: 5px"
          />
          <div
            class="button-text d-flex justify-content-center align-items-center"
          >
            <a
              style="width: 40px; background-color: red"
              class="btn-theme"
              target="_blank"
              :href="
                'https://tokensniffer.com/token/eth/' +
                contractConfig.deployedContract
              "
              >TS</a
            >
            <a
              style="width: 80px"
              @click="handleVerify()"
              class="btn-theme"
              v-if="!isVerifying"
              >Verify</a
            >
            <img v-else class="loading-icon" src="img/spinner.svg" />
          </div>
        </div>
        <div>{{ status }}</div>
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import { mapGetters, mapActions } from 'vuex';
// import Utils from '@/helpers/Utils';
import Web3 from '@/helpers/Web3';
// import Zerion from '@/helpers/Zerion';
// import Vue from 'vue';
// import Sample from './sample.json';
import { getCompilerVersions } from '@agnostico/browser-solidity-compiler';
import axios from 'axios';
import querystring from 'querystring';
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';

export default {
  name: 'ContractEditor',
  components: { VueMonacoEditor },
  computed: {
    ...mapGetters({
      liveList: 'watches/liveList',
      pastList: 'watches/pastList',
      contractConfig: 'contracts/config',
    }),
  },
  watch: {
    name() {
      if (this.symbol.length === 0)
        this.symbol = this.name
          .split(' ')[0]
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase();
      this.updateCode();
    },
    symbol() {
      this.contractConfig.identifier =
        this.symbol.replace(/[^a-zA-Z0-9]/g, '') +
        Math.random().toString(36).substring(2).toUpperCase();
      this.updateCode();
    },
    identifier() {
      this.updateCode();
    },
    "contractConfig.isRealToken": function() {
      this.updateCode();
    },
  },
  async mounted() {
    this.setCompilerVersions((await getCompilerVersions()).releases);
    this.contractConfig.code = this.contractConfig.codeTemplate;
  },
  beforeDestroy() {},
  methods: {
    ...mapActions({
      fetch: 'watches/fetch',
      delete: 'watches/delete',
      setContractName: 'contracts/setContractName',
      setCompilerVersions: 'contracts/setCompilerVersions',
      compileContract: 'contracts/compileContract',
      setCompiledContracts: 'contracts/setCompiledContracts',
      setDeployedContract: 'contracts/setDeployedContract',
    }),
    getNetwork() {
      return Web3.getNetwork();
    },
    updateCode() {
      const codeTemplate = this.contractConfig.isRealToken
        ? this.contractConfig.realTokenCodeTemplate
        : this.contractConfig.codeTemplate;
      this.contractConfig.code = codeTemplate
        .replaceAll('NAME', this.name)
        .replaceAll('SYMBOL', this.symbol)
        .replaceAll('IDENTIFIER', this.contractConfig.identifier)
        .replaceAll('RANDOMIZER', () => {
          return 'R' + Math.random().toString(36).substring(2).toUpperCase();
        });
    },
    async handleCompile() {
      this.setCompiledContracts([]);
      if (this.name.length === 0 || this.symbol.length === 0) {
        this.$toast.error('Contract is not updated.', {
          position: 'top-right',
          timeout: 2000,
          closeOnClick: true,
        });
        return;
      }
      this.compileContract();
    },
    async handleVerify() {
      this.isVerifying = true;
      const chainid = 1;
      const ETHERSCAN_API_KEY = 'JCWP6W46Y3CC7ZU8Q48PRKEF763JYZADGQ';
      const receipt = (
        await axios.post(
          `https://api.etherscan.io/v2/api?chainid=${chainid}`,
          querystring.stringify({
            optimizationUsed: '1',
            runs: '200',
            apikey: ETHERSCAN_API_KEY,
            module: 'contract',
            action: 'verifysourcecode',
            contractaddress: this.contractConfig.deployedContract,
            sourceCode:
              (this.socials.length > 0
                ? `/*\n\n${this.socials}\n\n*/\n\n`
                : '') + this.contractConfig.code,
            codeformat: 'solidity-single-file',
            contractname: `${this.contractConfig.contractName}`,
            compilerversion: this.contractConfig.compilerVersion.slice(8, -3),
          })
        )
      ).data;
      const guid = receipt.result;
      if (receipt.status === '0') {
        this.status = receipt.result;
        this.isVerifying = false;
        return;
      }
      if (guid === 'Contract source code already verified') {
        this.isVerifying = false;
        return;
      }
      console.log('guid :>> ', guid);
      let verifiedOrFailed = false;
      let maxTry = 30;
      do {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const result = await axios.get(
          `https://api.etherscan.io/v2/api?chainid=${chainid}&module=contract&action=checkverifystatus&guid=${guid}&apikey=${ETHERSCAN_API_KEY}`
        );
        this.status = result.data.result;
        if (
          this.status === 'Pass - Verified' ||
          this.status === 'Already Verified'
        ) {
          verifiedOrFailed = true;
          this.status = '';
        } else if (this.status.includes('Fail')) {
          verifiedOrFailed = true;
        }
      } while (!verifiedOrFailed && maxTry-- > 0);
      this.isVerifying = false;
    },
  },
  data() {
    return {
      isVerifying: false,
      status: '',
      name: '',
      symbol: '',
      socials: '',
    };
  },
};
</script>

<style scoped></style>
