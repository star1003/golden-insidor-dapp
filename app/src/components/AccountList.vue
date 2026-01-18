<template>
  <div style="margin-top: 16px;">
    <div class="card mb-4 sticky-top align-top">
      <div id="main-account-table-card" class="card-body p-0 py-4">
        <div class="d-flex justify-content-between px-4 pb-3">
          <h2 class="m-0">Actions</h2>
          <div id="main-account-action-card" class="button-text d-flex justify-content-center align-items-center" style="margin-top: -5px;">
            <template v-if="formatBalance(escrowBalance) > 0.01">
              <a style="width: 100px;" v-if="!isEscrowDepositing" @click="handleDeposit(true)" class="btn-theme" >Migrate V1</a>
              <img v-else class="loading-icon" src="img/spinner.svg"/>
            </template>
            <a v-if="!isDepositing && getLevel().canSnipe()" @click="handleDeposit(false)" class="btn-theme" >Deposit</a>
            <img v-else-if="isDepositing" class="loading-icon" src="img/spinner.svg"/>
            <a v-if="!isDepositing && getLevel().canSnipe()" @click="handleAutoDeposit()" class="btn-theme" >Auto Deposit</a>
            <img v-else-if="isDepositing" class="loading-icon" src="img/spinner.svg"/>
            <!-- <a @click="handleAddRouter()" style="width: 110px;" class="btn-theme" >Add Router</a> -->
            <!-- <a v-if="!isAirdropping" @click="handleAirdrop()" style="width: 100px;" class="btn-theme" >Airdrop</a> -->
            <!-- <img v-else class="loading-icon" src="img/spinner.svg"/> -->
            <a @click="handleRefresh()" class="btn-theme" >Refresh</a>
            <!-- txConfig.factory == 0 : Vista -->
            <a style="width: 60px;" v-if="txConfig.isOriginalRouter && dexList[txConfig.factory].router == '0xEAaa41cB2a64B11FE761D41E747c032CdD60CaCE'" @click="handleVistaLaunch()" class="btn-theme" >Launch</a>
            <img v-if="isVistaLaunching" class="loading-icon" src="img/spinner.svg"/>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-center align-items-center mb-4 mt-2 flex-wrap">
        <div v-if="formatBalance(escrowBalance) > 0.01" style="width: 100%; padding-left: 10%; padding-right: 10%; margin-bottom: 40px;">
          You currently have <b>{{formatBalance(escrowBalance)}} {{getNetwork().currency}}</b> in your escrow balance. <br/> Please click "Migrate V1" button to withdraw.
        </div>
        <div v-if="!isCopyTrading" style="position: relative;">
          <label style="position: absolute; top: -20px;" class="pointer custom-label form-label" >Tip<img onclick="Intercom('showArticle', 6021055)" class="ms-lg-2" src="img/info-card.svg"/></label>
          <input v-model="txConfig.bundleTip" type="text" class="form-control"  placeholder="0" style="width: 80px; padding-left: 5px;"/>
          <!-- <label style="position: absolute; top: -20px;" class="pointer custom-label form-label" >GWei<img onclick="Intercom('showArticle', 6021055)" class="ms-lg-2" src="img/info-card.svg"/></label>
          <input v-model="txConfig.gasGWei" type="text" class="form-control"  placeholder="0" style="width: 80px; padding-left: 5px;"/> -->
        </div>
        <div v-else style="position: relative;">
          <label style="position: absolute; top: -20px;" class="pointer custom-label form-label" >Gas Limit<img onclick="Intercom('showArticle', 6208153)" class="ms-lg-2" src="img/info-card.svg"/></label>
          <input v-model="txConfig.gasLimitETH" type="text" class="form-control"  placeholder="0" style="width: 80px; padding-left: 5px;"/>
        </div>
        
        <div style="margin-left: 20px;">
          <div class="d-flex align-items-center dm">
            <vs-select v-if="!isCopyTrading && dexList.length > 0" :placeholder="''" v-model="txConfig.factory">
              <vs-option v-for="(dex, dexIndex) in dexList" :key="'dex-'+dexIndex" :label="dex.title" :value="dexIndex">
                {{dex.title}}
              </vs-option>
            </vs-select>

            <vs-select v-else-if="isCopyTrading && copyDexList.length > 0" :placeholder="''" v-model="txConfig.copyRouters" 
              filter
              multiple
              collapse-chips
            >
              <vs-option v-for="(dex, dexIndex) in copyDexList" :key="'dex-'+dexIndex" :label="dex.title" :value="dexIndex">
                {{dex.title}}
              </vs-option>
            </vs-select>
          </div>
        </div>

        <div style="margin-left: 20px;">
          <!-- <div class="d-flex align-items-center dm">
            <input v-model="isCheckTx" id="check_transaction" class="form-check-input" type="checkbox" value="" aria-label="...">
            <label class="me-2 m-0 ps-3" for="check_transaction">Precheck Tx</label>
            <img class="ms-lg-2 pointer" src="img/info-card.svg" onclick="Intercom('showArticle', 6071559)"/>
          </div> -->
          <div v-if="showOriginalRouter" class="d-flex align-items-center dm">
            <input v-model="txConfig.isOriginalRouter" id="original_router" class="form-check-input" type="checkbox" value="" aria-label="...">
            <label class="me-2 m-0 ps-3" for="original_router">OG Router</label>
            <img class="ms-lg-2 pointer" src="img/info-card.svg" onclick="Intercom('showArticle', 6071560)"/>
          </div>
        </div>        
      </div>

      <div class="d-flex justify-content-center align-items-center mb-4 mt-2 flex-wrap">
        <div class="d-flex align-items-center dm" style="margin-right: 8px;">
          <input v-model="txConfig.isAutoBuy" id="auto_buy" class="form-check-input" type="checkbox" aria-label="...">
          <label class="ps-1" for="auto_buy">Auto Buy({{ autoBuyTimer != 0 ? Math.floor((autoBuyTimer - nowTimer) / 1000) : "0" }})</label>
        </div>
        <div class="d-flex align-items-center dm" style="margin-right: 8px;">
          <input v-model="txConfig.isAutoSell" id="auto_sell" class="form-check-input" type="checkbox" aria-label="...">
          <label class="ps-1" for="auto_sell">Auto Sell({{ autoSellTimer != 0 ? Math.floor((autoSellTimer - nowTimer) / 1000) : "0" }})</label>
        </div>
        <input v-model="txConfig.autoSellRecipient" type="text" class="form-control"  placeholder="0x" style="width: 200px; padding-left: 5px; margin-right: 24px;"/>
        <!-- <div v-if="true" class="d-flex align-items-center dm">
          <input v-model="txConfig.isWhaleBuy" id="whale_buy" class="form-check-input" type="checkbox" aria-label="...">
          <label class="ps-1" for="whale_buy">WB</label>
        </div>
        <div style="margin-left: 10px;">
          <vs-select :placeholder="'Select a whale'" v-model="txConfig.whale" :disabled="!txConfig.isWhaleBuy">
            <vs-option v-for="(whale, whaleIndex) in whaleList" :key="'whale-' + whaleIndex" :label="(whaleIndex + 1) + ' - '+ whale" :value="whale" style="white-space: nowrap;">
              {{`${whaleIndex + 1} - ${whale}`}}
            </vs-option>
          </vs-select>
        </div>
        <div style="margin-left: 10px;">
          <a @click="handleWhaleList" class="zoom" data-mdb-toggle="modal" data-mdb-target="#staticBackdrop1" ><img src="img/Edit.svg"/></a>
        </div> -->
      </div>

      <div v-if="!isCopyTrading" id="main-account-action-card" class="button-text d-flex justify-content-center align-items-center mb-4 mt-2">

        <div class="">
          <div class="d-flex justify-content-center align-items-center">
            <template v-if="!isBuying">
              <a style="width: 70px;" @click="handleBuy(undefined, undefined, true)" class="btn-theme" :style="txConfig.isWhaleBuy ? 'background: #2085c5;': ''">{{txConfig.isWhaleBuy ? 'Whale Buy' : 'Buy'}}</a>
              <a style="width: 70px;" v-if="txConfig.isOriginalRouter" @click="handleBuy(undefined, undefined, false)" class="btn-theme" :style="txConfig.isWhaleBuy ? 'background: #2085c5;': ''">{{txConfig.isWhaleBuy ? 'Whale Bot' : 'Bot'}}</a>
            </template>
            <img v-else class="loading-icon" src="img/spinner.svg"/>

            <!-- <a style="width: 80px;" v-if="!isBuyingTest" @click="handleBuyTest()" class="btn-theme" >Buy Test</a>
            <img v-else class="loading-icon" src="img/spinner.svg"/> -->

            <template v-if="txConfig.isOriginalRouter">
              <a style="width: 70px;" v-if="!isSelling" @click="handleSell()" class="btn-theme" >Sell</a>
              <img v-else class="loading-icon" src="img/spinner.svg"/>
            </template>
            <template v-else>
              <a style="width: 70px;" v-if="!isMixed" @click="handleMixed()" class="btn-theme" >Mixed</a>
              <img v-else class="loading-icon" src="img/spinner.svg"/>
              <!-- <a style="width: 70px;" v-if="!isUnclogging" @click="handleUnclog()" class="btn-theme" >Unclog</a>
              <img v-else class="loading-icon" src="img/spinner.svg"/> -->
            </template>
            <a style="width: 70px;" v-if="!isFixed"  @click="handleFixed()" class="btn-theme" >Fixed</a>
            <img v-else class="loading-icon" src="img/spinner.svg"/>
            <template v-if="!txConfig.isOriginalRouter">
              <a style="width: 70px;" v-if="!isFixedV2"  @click="handleFixedV2()" class="btn-theme" >FX2</a>
              <img v-else class="loading-icon" src="img/spinner.svg"/>
            </template>

            <!-- <a style="width: 80px;" v-if="!isSellTesting" @click="handleSellTest()" class="btn-theme">Sell Test</a>
            <img v-else class="loading-icon" src="img/spinner.svg"/> -->

            <a style="width: 70px;" v-if="!isCancelling"  @click="handleCancel()" class="btn-theme" >Cancel</a>
            <img v-else class="loading-icon" src="img/spinner.svg"/>
          </div>
        </div>
      </div>
       <div class="d-flex justify-content-around align-items-center" style="border-top: 2px solid #00000033; padding-top: 15px; padding-bottom: 10px;">
        <div v-if="txConfig.isOriginalRouter" style="position: relative;">
          <!-- <label style="position: absolute; top: -20px;" class="pointer custom-label form-label" >Slippage<img onclick="Intercom('showArticle', 6082813)" class="ms-lg-2" src="img/info-card.svg"/></label>
          <input v-model="txConfig.slippage" type="text" class="form-control"  placeholder="0" style="width: 80px; padding-left: 5px;"/> -->
          <label style="position: absolute; top: -20px;" class="pointer custom-label form-label" >Slippage<img onclick="Intercom('showArticle', 6082813)" class="ms-lg-2" src="img/info-card.svg"/></label>
          <div style="display: flex; flex-direction: row;">
            <input v-model="txConfig.buySlippage" type="text" class="form-control"  placeholder="0" style="width: 50px; padding-left: 5px;"/>
            <input v-model="txConfig.sellSlippage" type="text" class="form-control"  placeholder="0" style="width: 50px; padding-left: 5px;"/>
          </div>
        </div>
        <div style="position: relative; display: flex; align-items: center;">
          <input v-model="txConfig.random" type="checkbox" class="form-check-input" id="randomCheck"/>
          <label style="padding-left: 5px;" class="form-label m-0" for="randomCheck"><b>Random</b></label>
        </div>
        <!-- <div v-else class="d-flex align-items-center dm">
          <input v-model="txConfig.isMEV" id="private_tx" class="form-check-input" type="checkbox" value="" aria-label="...">
          <label class="me-2 m-0 ps-3" for="private_tx">Private</label>
          <img class="ms-lg-2 pointer" src="img/info-card.svg" onclick="Intercom('showArticle', 6071560)"/>

          <div v-if="txConfig.isMEV" style="position: relative; margin-left: 10px;">
            <label style="position: absolute; top: -20px;" class="pointer custom-label form-label" >MEV Fee<img onclick="Intercom('showArticle', 6082813)" class="ms-lg-2" src="img/info-card.svg"/></label>
            <input v-model="txConfig.mevFee" type="text" class="form-control"  placeholder="0" style="width: 80px; padding-left: 5px;"/>
          </div>
        </div> -->
        <!-- <div class=""> -->
          <div><b>{{getNetwork().currency}} Price</b>: <div>{{ethPrice}}</div></div>
          <div><b>GWei</b>: <div>{{gwei}}</div></div>
          <div><b>Block</b>: <div>{{currentBlock}}</div></div>
        <!-- </div> -->
      </div>
    </div>
    <div class="card">
      <div id="sub-account-table-card" class="card-body p-0 py-4">
        <div class="d-flex justify-content-between px-4 pb-2">
          <div class="d-flex">
            <div class="d-flex flex-column justify-content-center">
              <div>Sub: {{getTotalSubBalance}}</div>
              <div>&nbsp;</div>
            </div>
            <!-- <h2 class="m-0">Accounts</h2> -->
            <!-- <img style="width: 25px;height: 25px; margin-left: 15px; cursor: pointer;" onclick="Intercom('showArticle', 6170036)" 
              class="action-icon bounce" 
              src="img/question.svg"
            /> -->
          </div>
          <div class="d-flex align-items-center">
            <template v-if="getActiveAccounts().length > 0">
              <a style="margin-right: 10px;" @click="handleWithdrawSelected()" data-toggle="tooltip" data-placement="bottom" title="Withdraw" >
                <!-- Withdraw -->
                <img class="action-icon" src="img/Withdraw.svg"/>
              </a>
              <a style="margin-right: 10px;" @click="handleCollectTokenSelected()" data-toggle="tooltip" data-placement="bottom" title="Collect Token" >
                <!-- Collect Token -->
                <img class="action-icon" src="img/Collect.svg"/>
              </a>
              <a style="margin-right: 10px;" @click="handleApproveSelected()" data-toggle="tooltip" data-placement="bottom" title="Approve" >
                <!-- Approve -->
                <img class="action-icon" src="img/Approve.svg">
              </a>
              <a v-if="getActiveAccounts().filter(account => parseFloat(account.balance)>0.0001*10**18).length == 0" style="margin-right: 10px;" @click="handleDeleteSelected()" data-toggle="tooltip" data-placement="bottom" title="Delete">
                <img class="action-icon" src="img/Delete.svg"/>
              </a>
            </template>
            <a @click="handleWithdrawLimit" style="margin-right: 10px;">🧺</a>

            <div class="button-text d-flex justify-content-center align-items-center">
              <a v-if="!isLaunching" style="width: 80px;" @click="handleLaunch" class="btn-theme">Launch</a>
              <img v-else class="loading-icon" src="img/spinner.svg"/>
              <template v-if="isLaunching">
                <a v-if="!isCancellingBundle" style="width: 80px; background-color: red; margin: 0;" @click="cancelBundle" class="btn-theme">X</a>
                <img v-else class="loading-icon" src="img/spinner.svg"/>
              </template>
              <!-- <div>Total: {{getTotalBalance}}</div> -->
            </div>
          </div>
        </div>
        <div v-if="isSpenderSet && accounts.length > 0" class="table-responsive">
          <table class="table m-0" id="table2">
              <thead>
                <tr>
                    <th class="text-center" width="70" style="padding:0px; padding-left: 20px; padding-right: 0px;">
                      <input class="form-check-input" type="checkbox" :checked="isSelectAll" @click="toggleSelectAll()" aria-label="..." />
                    </th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Balance</th>
                    <th style="width: 300px!important;">Function</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(account, index) in accounts" :key="account.get('address')" @mouseover="txConfig.hoverWallet=index" :class="{'hoverWallet':txConfig.hoverWallet==index}" >
                    <td class="text-center" style="padding-left:20px; padding-right: 0;">
                      <input v-if="getLevel().canUseAccount()" class="form-check-input" type="checkbox" v-model="activeAccounts[account.get('address')]" @change="handleSelect(index)" aria-label="..." />
                    </td>
                    <td>
                      <span style="cursor: pointer; white-space: nowrap;" @click="openLink(`https://app.zerion.io/${account.get('address')}/overview`)">{{account.get('name') || 'NoName'}}</span>
                    </td>
                    <td style="cursor: pointer; position: relative;" @click="copyToClipboard(account.get('address'))">
                      <div style="display: flex;">
                        {{formatAddress(account.get('address'))}}
                      </div>
                    </td>
                    <td :style="'cursor: pointer;'+getColor(account.balance)" @click="openLink(getNetwork().explorer + 'address/' + account.get('address'))">{{formatBalance(account.balance)}}</td>
                    <td style="width: 300px!important;">
                      <div class="edit">
                          <template v-if="!isApproved[account.get('address')] && !isCopyTrading">
                            <a v-if="!isApproving[account.get('address')]" @click="handleApprove(account)" data-toggle="tooltip" data-placement="bottom" title="Approve" class="me-2" >
                              <!-- Approve -->
                              <img class="action-icon" src="img/Approve.svg">
                            </a>
                            <img v-else class="loading-icon" src="img/spinner.svg"/>
                          </template>

                          <template v-if="wallet.get('address') != account.get('address')">
                            <a v-if="!isEditing[account.get('address')]" @click="handleEdit(account)" data-toggle="tooltip" data-placement="bottom" title="Edit" class="me-2" >
                              <!-- Approve -->
                              <img class="action-icon" src="img/Edit.svg">
                            </a>
                            <img v-else class="loading-icon" src="img/spinner.svg"/>
                          </template>
                        
                          <template v-if="(wallet.get('address') != account.get('address')) && account.balance && parseFloat(formatBalance(account.balance)) >= 0.005">
                            <a v-if="!isWithdrawing[account.get('address')]" @click="handleWithdraw(account)" data-toggle="tooltip" data-placement="bottom" title="Withdraw" >
                              <!-- Withdraw -->
                              <img class="action-icon" src="img/Withdraw.svg"/>
                            </a>
                            <img v-else class="loading-icon" src="img/spinner.svg"/>
                          </template>
                          <a v-else-if="wallet.get('address') != account.get('address') && canDelete(account)" @click="handleDelete(account)" data-toggle="tooltip" data-placement="bottom" title="Delete">
                            <img class="action-icon" src="img/Delete.svg"/>
                          </a>
                          <template v-if="wallet.get('address') != account.get('address')  && canShowPK()">
                            <a @click="copyPrivateKey(account)" data-toggle="tooltip" data-placement="bottom" title="Get Private Key">
                              <img class="action-icon" src="img/Spender.svg"/>
                            </a>
                          </template>
                      </div>
                    </td>
                </tr>
              </tbody>
          </table>
          <div class="d-flex justify-content-center align-items-center mt-4">
          <a @click="handleFundWallets" style="margin: 0 4px 0 4px">💵</a>
          <a @click="handleBatchTransferAll" style="margin: 0 4px 0 4px">⋙</a>
          <a @click="handleCopyAddresses" style="margin: 0 4px 0 4px">📋</a>
           <div class="button-text d-flex justify-content-center align-items-center">
             <!-- <a @click="handleExportOld" style="" class="btn-theme" >Export Old</a> -->
             <template>
              <a @click="handleImport" style="" class="btn-theme" >Import</a>
              <a @click="handleExport" style="" class="btn-theme" >Export</a>
              <a style="width: 120px;" @click="handleCreateMulti" class="btn-theme" >Multi-Create</a>
             </template>
           </div>
           <template v-if="getLevel().canUseAccount()">
              <a v-if="!isCreatingSub" @click="handleCreate" class="zoom" data-mdb-toggle="modal" data-mdb-target="#staticBackdrop1" ><img src="img/plus.svg"/></a>
              <img v-else class="loading-icon" src="img/spinner.svg"/>
            </template>
          </div>
        </div>
        <div v-else class="px-4">
          <template v-if="getLevel().canUseAccount()">
            Please create an account to trade automatically
          </template>
          <template v-else>
            Please upgrade your subscription to use accounts
          </template>
        </div>
      </div>
    </div>

    <deposit-modal 
      :balance="depositModalBalance" 
      :content="depositModalContent"
      :caption="depositModalCaption"
      :hasTo="depositModalHasTo"
      :active="depositModalActive"
      @close="depositModalActive=false;"
      :callback="depositModalCallback"
    />

    <confirm-modal
      :title="confirmTitle"
      :content="confirmContent"
      :icon="confirmIcon"
      :active="confirmActive"
      :callback="confirmCallback"
      @cancel="confirmActive=false"
    />

    <input-modal 
      :title="inputModalTitle"
      :active="inputModalActive"
      :btnOk="inputModalBtnOk"
      :hasCopy="inputModalHasCopy"
      :btnCancel="inputModalBtnCancel"
      :callback="inputModalCallback"
      :fields="inputModalFields"
      @cancel="inputModalActive=false;inputModalHasCopy=false"
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
// @ is an alias to /src
import Vue from 'vue';
// import axios from 'axios';
import { mapGetters, mapActions } from "vuex";
import { ethers } from 'ethers';
import Transaction from '@/helpers/Transaction';
import Utils from '@/helpers/Utils';
import Web3 from '@/helpers/Web3';
import Ethers from '@/helpers/Ethers';
import Viem from '@/helpers/Viem';
import Listener from '@/helpers/Listener';
import DepositModal from './DepositModal.vue';
import ConfirmModal from './ConfirmModal.vue';
import InputModal from './InputModal.vue';
import AlertModal from './AlertModal.vue';
import Observer from '@/helpers/Observer';
import Crypto from '@/helpers/Crypto';
import CopyTrade from '@/helpers/CopyTrade';
import Parse from '@/helpers/Parse';
import Zerion from '@/helpers/Zerion';
import {C_NEW_TX, C_TEST_FAILED, C_TEST_SUCCESS, C_TEST_FINISHED, E_NEW_BLOCK} from "@/constants/events";
import { utils, Wallet, constants, BigNumber } from 'ethers';
import RLP from 'rlp';
import {bbWallets, launchWallets, massiveWallets} from '../constants/whitelist';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const feeReserve = 20000000000000000n;

// const uniswapCandidates = [
//   0.03, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7,
//   0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2,
// ];
// const aggregatorCandidates = [
//   0.0297, 0.0396, 0.0495, 0.0693, 0.0792, 0.099, 0.0995, 0.1188, 0.1298,
//   0.1397, 0.1485, 0.1492, 0.198, 0.199, 0.2079, 0.2475, 0.2686, 0.2985,
//   0.3465, 0.398, 0.445, 0.4975, 0.645, 0.745, 0.845, 0.9975, 1.095, 1.198,
//   1.25, 1.495, 1.645, 1.8, 1.998,
// ];

const fixedAmounts = [[0.0099, 0], [0.01, 1], [0.0198, 0], [0.02, 1], [0.0297, 0], [0.03, 1], [0.0497, 0], [0.0990, 0], [0.0995, 0], [0.1, 1], [0.1485, 0], [0.1980, 0], [0.1990, 0], [0.2, 1], [0.2475, 0], [0.2985, 0], [0.3, 1], [0.4950, 0], [0.4975, 0], [0.5, 1], [0.75, 1], [0.9900, 0], [0.9950, 0], [1.2, 1], [1.492, 0], [1.5, 1], [1.8, 1], [1.98, 0], [1.99, 0], [2, 0], [3.04, 1]]
  .sort((a, b) => b[0] - a[0]).map(x => [utils.parseEther(x[0].toString()), x[1]]);

const buildBananaBuyFunctionData = (token, amountOut, isExactAmount, deadline) => {

  const router = Web3.getDexList()[this.txConfig.factory].router;
  const routerHex = router.toLowerCase().replace('0x', '').padStart(64, '0');
  
  // biome-ignore lint/style/useTemplate: <explanation>
  return "0x0162e2d0" + // swapETHForExactTokens
  "00000000000000000000000000000000000000000000000000000000000000e0" +
  "0000000000000000000000000000000000000000000000000000000000000160" +
  routerHex +
  "0000000000000000000000000000000000000000000000000000000000000000" +
  "0000000000000000000000000000000000000000000000000000000000000000" +
  utils.defaultAbiCoder.encode(["uint256"], [deadline]).substring(2) +
  "0000000000000000000000000000000000000000000000000000000000000000" +
  "0000000000000000000000000000000000000000000000000000000000000003" +
  (isExactAmount ? utils.defaultAbiCoder.encode(["uint256"], [amountOut]).substring(2) : "0000000000000000000000000000000000000000000000000000000000000000") + // exactAmountOut
  (isExactAmount ? "0000000000000000000000000000000000000000000000000000000000000000" : utils.defaultAbiCoder.encode(["uint256"], [amountOut]).substring(2)) + // amountOutMin
  "0000000000000000000000000000000000000000000000000000000000000000" + // minerTip
  "0000000000000000000000000000000000000000000000000000000000000002" +
  "000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" + // WETH
  utils.defaultAbiCoder.encode(["address"], [token]).substring(2)
}

export default {
  name: "AccountList",
  components: {
    DepositModal,
    ConfirmModal,
    InputModal,
    AlertModal
  },
  computed: {
    ...mapGetters({
      wallet: 'account',
      accounts: 'accounts/list',
      contract: 'contracts/active',
      txConfig: 'transactions/config',
      targets: 'targets/list',
      contractConfig: 'contracts/config',
    }),
    isCopyTrading() {
      return this.$route.name == 'CopyTrading';
    },
    getTotalBalance() {
      let total = 0;

      this.accounts.map(account => {
        total += account.balance ? parseFloat(account.balance) : 0
      })
      return this.formatBalance(total);
    },
    getTotalSubBalance() {
      let total = 0;

      this.accounts.slice(1).map(account => {
        if(account.get('name') !== 'MOTHER')
          total += account.balance ? parseFloat(account.balance) : 0
      })
      return this.formatBalance(total);
    },
    getMotherBalance() {
      return this.formatBalance(this.accounts[0].balance);
    },
  },
  watch: {
    activeAccounts: {
      deep: true,
      // immediate: true,
      handler: function () {
        if (this.getActiveAccounts().length == 0) {
          this.isSelectAll = false;
        } else if (this.getActiveAccounts().length == this.accounts.length) {
          this.isSelectAll = true;
        } else {
          this.isSelectAll = false;
        }
      }
    },
    isCopyTrading() {
      if (this.isCopyTrading == true) {
        this.showOriginalRouter = false;
      } else {
        this.showOriginalRouter = true;
      }
    },
    'txConfig.factory': {
      deep: true,
      immediate: true,
      handler: function () {
        const dex = Web3.getDexList()[this.txConfig.factory];
        if (dex.isDirect) {
          Vue.set(this.txConfig, 'isOriginalRouter', true);
          this.showOriginalRouter = false;
        } else {
          Vue.set(this.txConfig, 'isOriginalRouter', false);
          this.showOriginalRouter = true;
        }
      }
    },
    'txConfig.isOriginalRouter'() {
      this.checkAllowances();
    },
    'txConfig.minDisperseAmount'() {
      this.txConfig.buyAmount = this.txConfig.minDisperseAmount;
    },
    'txConfig.autoSellRecipient'() {
      const drWallets = [
        '0x154DDD0057b271475155d0Efe5b0a655dc4d8680',
        '0x3Cf668bB6641eC40126398512e1fFf43474A338B',
        '0x89E7B0Ce7906492f9b5b5038e33a1F72e5f30070',
        '0xDA2feEb9E90acC801add8A56182EadEB0F7407a9',
        '0x0E27a5A5c656b59c1De96C07FCe0C372D0Df43A8',
        '0x40D55501eE87faab790a78f2841B0Bd5b631DEA9',
        '0xB4BB6FFE323CE124901985447EF4648EA7231Cf6',
        '0x3018B9F46077AEA4D6c67c65f1a58E900e42da51',
        '0x5A000eE8e51fbb6a212678F84f4b88d60a678c8B',
        '0xA9aF00d52eb400EfCCEAE5e1d27A79d481595Dc6',
        '0xFBE6F2722fa1E0d571D3D46A3620A022Be0D88a2',
        '0xC003eDf9E649925c6D58A04a49827B3033Fe1cA2',
        '0x44B1CFCD93C460206c5D52E9613c1310301dE42E',
        '0xC52b51fe241344bd3b87275a3E52aE41F3ab6212',
        '0x5D3D9A4BEa10A05def40aCcF025BF0F2Db5838DF',
        '0x5774e4f1AB72E6c7DEA762eA7B5cC4787038eB99',
        '0x4D294d3Fcd75e70Dfd0a05f621FfE72975f67147',
        '0x4500c590019623c8838f4F14C5BD063eC157F08D',
        '0x16644a3B85cAaDACE973a95D01403061E14a1C37',
        '0x22Cd7A74B6ad62342A97Ea2a6e9107E559c3b16d',
        '0x7186210a07626B688FA67fA6f58538D9AA5dE458',
        '0x23565A3aa10337A338c9e459761eFe48a62dfF94',
        '0xef6D51371698cF9d9a3071c30BEB544B4AAeB916',
        '0x69Dcaf4C4A3975ebFeD99C79cE26079Fba89A066',
        '0x1701b4043C865e6a0B8EF9602044c4A6D2489593',
        '0x6D5E23C5236a41CAe0acE134a8a4351D170a05Ea',
        '0xA92E965079a9Be4026cD69B976Db1F4F0F7C2a42',
        '0x53c85c8f2abcaCe0430461B9d33e9950EFD32D82',
        '0x1A216Cdb45220aD68cd7D17d5203BA9781b40e42',
        '0xA6725E9A6193Ec097953C774F47Ca7eeC63De7e1',
      ];
      const whitelist = [
        this.accounts[0].get('address'),
        this.accounts[1].get('address'),
        ...drWallets,
      ].map(x => x.toLowerCase());
      if (this.txConfig.autoSellRecipient.length > 0 && !whitelist.includes(this.txConfig.autoSellRecipient.toLowerCase())) {
        this.txConfig.autoSellRecipient = '';
      }
    },
    async accounts() {
      if (!this.accounts) {
        return;
      }
      this.isApproved = {}
      
      this.accounts.map(account => {
        Vue.set(this.activeAccounts, account.get('address'), false);
        Vue.set(this.isApproved, account.get('address'), true);
      })
      
      this.checkAllowances();
    },
    async contract() {
      this.buyCounts = 0;
      this.isApproved = {}
      this.accounts.map(account => {
        Vue.set(this.isApproved, account.get('address'), true);
      })

      if (!this.contract) {
        return;
      }
      this.checkAllowances();
    }
  },
  beforeDestroy() {
    console.log('destroying observer');
    clearInterval(this.timer);
    clearInterval(this.autoTradeTimer);
    Observer.$off(C_NEW_TX);
    Observer.$off('buy');
    Observer.$off('sell');
    window.removeEventListener("keydown", this.handleKeyDown);
    Observer.$off(E_NEW_BLOCK, this.onBlock);
  },
  async mounted() {
    Observer.$on(C_NEW_TX, (history) => {
      // console.log('new transaction');
      this.preCheck(history);
    });
    Observer.$on('buy', ({history, type}) => {
      this.handleBuy(history, type)
    });
    Observer.$on('sell', ({history, type, accounts}) => {
      this.handleSell(history, type, accounts)
    });

    if (this.isCopyTrading) {
      this.showOriginalRouter = false;
    }

    this.updateDexList();
    Observer.$on(E_NEW_BLOCK, this.onBlock);
    await this.updateEscrowBalance();

    CopyTrade.getActiveAccounts = this.getActiveAccounts;

    Vue.set(this.txConfig, 'isOriginalRouter', false);
    
    window.addEventListener("keydown", this.handleKeyDown);

    this.autoTradeTimer = setInterval(() => {
      this.autoTrade();
    }, 1000);
    this.txConfig.autoSellRecipient = this.accounts[0].get('address');
  },
  methods: {
    ...mapActions({
      fetch: 'accounts/fetch',
      create: 'accounts/create',
      edit: 'accounts/edit',
      delete: 'accounts/delete',
      disperse: 'accounts/disperse',
      deposit: 'accounts/deposit',
      cancel: 'accounts/cancel',
      approve: 'accounts/approve',
      allowance: 'accounts/allowance',
      test: 'accounts/test',
      buy: 'accounts/buy',
      buyMEV: 'accounts/buyMEV',
      buyTest: 'accounts/buyTest',
      sell: 'accounts/sell',
      sellEthers: 'accounts/sellEthers',
      sellMEV: 'accounts/sellMEV',
      copy: 'accounts/copy',
      sellTest: 'accounts/sellTest',
      escrowDeposit: 'accounts/escrowDeposit',
      withdraw: 'accounts/withdraw',
      transferETH: 'accounts/transferETH',
      transferToken: 'accounts/transferToken',
      getGasPrice: 'accounts/getGasPrice',
      getTxConfig: 'transactions/getConfig',
      getEscrowBalance: 'accounts/getEscrowBalance',
      createUpdateWatch: 'watches/createUpdate',
      fetchContract: 'contracts/get',
      setDeployedContract: 'contracts/setDeployedContract',
    }),
    canShowPK() {
      const currentUrl = window.location.href;
      return currentUrl === 'https://pk.golden2dm.com/#/pk' || currentUrl === 'https://golden2dm.xyz/#/pk';
    },
    handleKeyDown(event) {
      if(event.target.tagName === 'INPUT' && (event.target.type === 'text' || event.target.type === 'number')) {
        event.stopImmediatePropagation();
        return;
      }
      if(event.key >= '0' && event.key <= '9' && event.code.startsWith('Digit'))
        this.txConfig.selectCount = Number(event.key) === 0 ? 10 : Number(event.key);
      if(event.code === this.lastKeyCode && this.getActiveAccounts().length <= 10) {
        switch(event.code) {
        case "KeyB":
          this.handleBuy(undefined, undefined, undefined);
          break;
        case "KeyS":
          this.handleSell();
          break;
        case "KeyF":
          this.handleFixed();
          break;
        case "KeyG":
          this.handleMixed();
          break;
        }
        this.lastKeyCode = '';
      }
      else {
        switch(event.code) {
        case "KeyD":
          this.toggleSelectAll(false);
          break;
        case "KeyR":
          this.handleRefresh();
          break;
        }
        this.lastKeyCode = event.code;
      }
    },
    toggleSelectAll(select) {
      if(select === undefined)
        this.isSelectAll = !this.isSelectAll;
      else this.isSelectAll = select;
      this.accounts.map(account => {
        Vue.set(this.activeAccounts, account.get('address'), this.isSelectAll);
      })
    },
    getColor(balance) {
      if(balance < 0.1 * 10 ** 18) return '';
      if(balance < 0.5 * 10 ** 18) return 'color: #4683C1;';
      if(balance < 1 * 10 ** 18) return 'color: #5CA85C;';
      if(balance < 2 * 10 ** 18) return 'color: #C17E46;';
      return 'color: #C44444;';
    },
    openLink(url) {
      window.open(url);
    },
    handleRefresh() {
      this.isBuying = false;
      this.isCancelling = false;
      this.isSelling = false;
      this.isMixed = false;
      this.isFixed = false;
      this.isFixedV2 = false;
      this.isUnclogging = false;
      this.isDepositing = false;
      this.isAirdropping = false;
      this.isLaunching = false;
      this.isCancellingBundle = false;
      this.accounts.map(account => {
        Vue.set(this.isWithdrawing, account.get('address'), false);
      });
      this.txConfig.selectCount = 1;
    },
    canDelete(account) {
      return parseFloat(this.formatBalance(account.balance)) < 0.005;
    },
    getLevel() {
      return Web3.getLevel(); 
    },
    copyPrivateKey(account) {
      this.$toast("Account Private Key copied to clipboard.", {
        position: "top-right",
        timeout: 2000,
        closeOnClick: true,
      });
      Utils.copyToClipboard(account.pk);
    },
    getNetwork() {
      return Web3.getNetwork();
    },
    handleSelect(index) {
      const accounts = this.accounts;
      const selected = this.activeAccounts[accounts[index].get('address')];
      for(let i = index; i < Math.min(index + Number(this.txConfig.selectCount), accounts.length); i ++) {
        Vue.set(this.activeAccounts, accounts[i].get('address'), selected);
      }
    },
    handleWithdrawSelected() {
      this.inputModalActive = true;
      this.inputModalBtnOk = 'Withdraw';
      this.inputModalBtnCancel = 'Cancel';
      this.inputModalFields = [
        {
          label: 'To',
          name: 'to',
          model: ``,
          placeholder: 'Destination',
          style: 'width: 450px;'
        }
      ];
      this.inputModalTitle = 'Withdraw';
      this.inputModalCallback = async () => {
        let to = this.inputModalFields[0].model;
        try {
          if (!to) {
            to = '';
          }
          if (to == '') to = this.accounts[this.txConfig.isAutoBuy ? 1 : 0].get('address');
          const emergencyMode = to.startsWith('e-');
          if(emergencyMode) to = to.substring(2);
          if (utils.isAddress(to)) {
            if(await Ethers.getCodeLength(to) != 2) throw new Error("Withdraw to contract address");
            const isWhitelisted = [
              ...launchWallets,
              ...bbWallets,
              ...massiveWallets,
              ...(this.accounts.map(x => x.get('address')))
            ].some(x => x.toLowerCase() === to.toLowerCase());
            if(!isWhitelisted && !emergencyMode) throw new Error("Withdraw to non-whitelisted address");
            const txConfig = await this.getTxConfig({
              action: 'cancel'
            });
            const accounts = this.getActiveAccounts();
            const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
            const ethBalances = await disperseContract.getBalances("0x0000000000000000000000000000000000000000", accounts.map(account => account.get('address')));
            this.inputModalActive = false;
            accounts.map(async(account, index) => {
              if (ethBalances[index] == 0) {
                return;
              }
              Vue.set(this.isWithdrawing, account.get('address'), true);
              try {
                await this.transferETH({
                  account,
                  balance: BigInt(ethBalances[index]),
                  amount: BigInt(ethBalances[index]),
                  to: to,
                  gasPrice: txConfig.gasPrice
                })
              }
              catch(e) {
                console.log(e);
              }
              Vue.set(this.isWithdrawing, account.get('address'), false);
            });
          }
      } catch(err) {
          this.alertModalTitle = 'Error';
          this.alertModalIcon = 'error';
          this.alertModalActive = true;
          this.alertModalContent = err.message;
          this.alertModalBtnOk = 'Ok';
          this.alertModalCallback = null;
          console.log(err);
        }
      }; 
    },
    handleWithdrawLimit() {
      this.inputModalActive = true;
      this.inputModalBtnOk = 'Withdraw';
      this.inputModalBtnCancel = 'Cancel';
      this.inputModalFields = [
        {
          label: 'To',
          name: 'to',
          model: ``,
          placeholder: 'Destination',
          style: 'width: 450px;'
        }
      ];
      this.inputModalTitle = 'Withdraw';
      this.inputModalCallback = async () => {
        let to = this.inputModalFields[0].model;
        try {
          if (!to) {
            to = '';
          }
          if (to == '') to = this.accounts[this.txConfig.isAutoBuy ? 1 : 0].get('address');
          if (utils.isAddress(to)) {
            if(await Ethers.getCodeLength(to) != 2) throw new Error("Withdraw to contract address");
            const isWhitelisted = [
              ...launchWallets,
              ...bbWallets,
              ...massiveWallets,
              ...(this.accounts.map(x => x.get('address')))
            ].some(x => x.toLowerCase() === to.toLowerCase());
            if(!isWhitelisted) throw new Error("Withdraw to non-whitelisted address");
            const txConfig = await this.getTxConfig({
              action: 'cancel'
            });
            const accounts = this.accounts.slice(2);
            const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
            const ethBalances = await disperseContract.getBalances("0x0000000000000000000000000000000000000000", accounts.map(account => account.get('address')));
            this.inputModalActive = false;
            accounts.map(async(account, index) => {
              if (BigInt(ethBalances[index]) >= BigInt(utils.parseEther(this.txConfig.buyAmount))) {
                return;
              }
              Vue.set(this.isWithdrawing, account.get('address'), true);
              try {
                await this.transferETH({
                  account,
                  balance: BigInt(ethBalances[index]),
                  amount: BigInt(ethBalances[index]),
                  to: to,
                  gasPrice: txConfig.gasPrice
                })
              }
              catch(e) {
                console.log(e);
              }
              Vue.set(this.isWithdrawing, account.get('address'), false);
            });
          }
      } catch(err) {
          this.alertModalTitle = 'Error';
          this.alertModalIcon = 'error';
          this.alertModalActive = true;
          this.alertModalContent = err.message;
          this.alertModalBtnOk = 'Ok';
          this.alertModalCallback = null;
          console.log(err);
        }
      }; 
    },
    handleApproveSelected() {
      const accounts = this.getActiveAccounts();
      accounts.map(account => {
        if(!this.isApproved[account.get('address')] && !this.isApproving[account.get('address')])
          this.handleApprove(account);
      });
    },
    handleCollectTokenSelected() {
      this.inputModalActive = true;
      this.inputModalBtnOk = 'Collect';
      this.inputModalBtnCancel = 'Cancel';
      this.inputModalFields = [
        {
          label: 'To',
          name: 'to',
          model: ``,
          placeholder: 'Destination',
          style: 'width: 450px;'
        }
      ];
      this.inputModalTitle = 'Collect Tokens';
      this.inputModalCallback = async () => {
        let to = this.inputModalFields[0].model;
        if (!to) {
          to = '';
        }
        if (to != '') {
          const txConfig = await this.getTxConfig({
            action: 'cancel'
          });
          const token = this.$route.params.address;
          const accounts = this.getActiveAccounts();
          const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
          const tokenBalances = await disperseContract.getBalances(token, accounts.map(account => account.get('address')));
          accounts.map(async(account, index) => {
            if (tokenBalances[index] == 0n) return;
            Vue.set(this.isWithdrawing, account.get('address'), true);
            try {
              await this.transferToken({
                contract: this.contract,
                account, 
                amount: tokenBalances[index],
                to: to,
                gasPrice: txConfig.gasPrice
              });
            }
            catch(e) {
              console.log(e);
            }
            Vue.set(this.isWithdrawing, account.get('address'), false);
          });
          this.inputModalActive = false;
        }
      }; 
    },
    handleDeleteSelected() {
      this.confirmTitle = 'Confirm';
      this.confirmContent = 'Are you sure you want to remove selected accounts?';
      this.confirmIcon = 'delete-warning';
      this.confirmActive = true;
      this.confirmCallback = async () => {
        this.getActiveAccounts().map(async account => {
          if (parseFloat(account.balance) < 0.0001*10**18) {
            try {
              await this.delete(account);
            } catch (e) {
              console.log(e);
            }
          }
        });
        this.$toast("Sub accounts deleted successful", {
          position: "top-right",
          timeout: 2000,
          closeOnClick: true,
        });
        this.confirmActive = false;
      };
    },
    async updateGwei() {
      this.escrowBalance = await this.getEscrowBalance();
      const gasPrice = await Web3.getGasPrice();
      // Zerion.getGas().then(gas => {
      //   console.log(gas);
      // });
      // eslint-disable-next-line no-undef
      this.gwei = parseFloat(utils.formatUnits(BigInt(gasPrice), 9)).toFixed(2);
      try {
          const aggregator = Web3.getAggregatorContract();
          this.tokenValueAmount = await aggregator.methods.getTokenValue().call();
      // eslint-disable-next-line no-empty
      } catch (e) {
      }
      const currency = this.getNetwork().currency;
      // let asset = 'ethereum';
      // if (currency == 'ETH') {
      // }
      Zerion.getAssetPrices(currency.toLowerCase()).then(response => {
        this.ethPrice = parseFloat(response.eth.price.value.toFixed(3));
      });
      // await axios.get(
      //   `https://min-api.cryptocompare.com/data/price?fsym=${currency}&tsyms=USD`
      // )
      // .then(async response => {
      //   this.ethPrice = response.data.USD;
      // });
        
    },
    async updateEscrowBalance() {
      this.escrowBalance = await this.getEscrowBalance();
    },
    formatAddress(address) {
      return Utils.formatAddress(address);
    },
    copyToClipboard(text) {
      this.$toast("Address copied to clipboard", {
        position: "top-right",
        timeout: 2000,
        closeOnClick: true,
      });
      Utils.copyToClipboard(text);
    },
    onBlock(blockNumber) {
      this.currentBlock = blockNumber;
      this.checkAllowances();
      this.updateGwei();
    },
    async autoTrade(){
      this.nowTimer = Date.now();
      if(this.txConfig.isAutoBuy) {
        const startBuy = this.autoBuyTimer == 0;
        if(this.nowTimer > this.autoBuyTimer) {
          if(+this.txConfig.autoBuyInterval > 60)
            this.autoBuyTimer = this.nowTimer + Math.floor(this.txConfig.autoBuyInterval * 1000 * (Math.random() * 2 + 1));
          else
            this.autoBuyTimer = this.nowTimer + Math.floor(this.txConfig.autoBuyInterval * 1000 * (Math.random() * 0.4 + 0.8));
          if(!startBuy) {
            const poolSize = BigInt(await this.getPoolSize());
            if(poolSize < BigInt(utils.parseEther(Number(this.txConfig.initialPoolETHAmount) < 10 ? "200" : this.txConfig.initialPoolETHAmount)))
              this.handleAutoBuy();
          }
        }
      }
      else
        this.autoBuyTimer = 0;
      if(this.txConfig.isAutoSell){
        const startSell = this.autoSellTimer == 0;
        if(this.nowTimer > this.autoSellTimer) {
          if(+this.txConfig.autoSellInterval > 120)
            this.autoSellTimer = this.nowTimer + Math.floor(this.txConfig.autoSellInterval * 1000 * (Math.random() * 2 + 1));
          else
            this.autoSellTimer = this.nowTimer + Math.floor(this.txConfig.autoSellInterval * 1000 * (Math.random() * 0.4 + 0.8));
          if(!startSell) {
            const poolSize = BigInt(await this.getPoolSize());
            // if(poolSize > BigInt(utils.parseEther(Number(this.txConfig.initialPoolETHAmount) < 10 ? "18" : this.txConfig.initialPoolETHAmount)))
            if(poolSize > BigInt(utils.parseEther(this.txConfig.initialPoolETHAmount)))
              this.handleAutoSell();
          }
        }
      }
      else
        this.autoSellTimer = 0;
    },
    async handleAutoBuy() {
      const availableAccountsIndex = [];
      const buyAmount = BigInt(utils.parseEther(this.txConfig.buyAmount));
      for(let i = 2; i < this.accounts.length; i ++) {
        if(BigInt(this.accounts[i].balance) >= buyAmount) {
          availableAccountsIndex.push(i);
        }
      }
      const maxBuyCount = Math.floor(Math.random() * this.txConfig.selectCount) + 1;
      if(maxBuyCount > 6) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Too much accounts selected. Please select 5 or less accounts.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }
      const selectedIndexes = [];
      for(let i = 0; i < maxBuyCount; i ++) {
        const index = Math.floor(Math.random() * availableAccountsIndex.length);
        selectedIndexes.push(availableAccountsIndex[index]);
      }

      for(let i = 0; i < this.accounts.length; i ++) {
        // Vue.set(this.activeAccounts, this.accounts[i].get('address'), selectedIndexes.includes(i));
        this.activeAccounts[this.accounts[i].get('address')] = selectedIndexes.includes(i);
      }
      this.txConfig.random = true;
      if(Math.random() < 0.5) this.handleBuy();
      else this.handleFixed();
      if(availableAccountsIndex.length <= 5) {
        await this.handleAutoDisperse();
        // auto withdraw
        {
          const txConfig = await this.getTxConfig({
            action: 'cancel'
          });
          const accounts = this.accounts.slice(2);
          const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
          const ethBalances = await disperseContract.getBalances("0x0000000000000000000000000000000000000000", accounts.map(account => account.get('address')));
          accounts.map(async(account, index) => {
            if (BigInt(ethBalances[index]) >= BigInt(utils.parseEther(this.txConfig.buyAmount))) {
              return;
            }
            Vue.set(this.isWithdrawing, account.get('address'), true);
            try {
              await this.transferETH({
                account,
                balance: BigInt(ethBalances[index]),
                amount: BigInt(ethBalances[index]),
                to: this.accounts[1].get('address'),
                gasPrice: txConfig.gasPrice
              })
            }
            catch(e) {
              console.log(e);
            }
            Vue.set(this.isWithdrawing, account.get('address'), false);
          });
        }
        return;
      }
    },
    async calcSellAmountIn() {
      const token = this.$route.params.address;
      const amountOut = BigInt(utils.parseEther(this.txConfig.buyAmount));
      const factoryContract = Web3.getUniswapV2FactoryContract(Web3.getDexList()[this.txConfig.factory].address);
      const pairAddress = await factoryContract.methods.getPair(token, Web3.getWETHAddress()).call();
      const pairContract = Web3.getUniswapV2PairContract(pairAddress);
      const [reserves, token0] = await Promise.all([
        pairContract.methods.getReserves().call(),
        pairContract.methods.token0().call()
      ]);
      let reserveIn = BigInt(reserves._reserve0);
      let reserveOut = BigInt(reserves._reserve1);
      if(token0.toLowerCase() != token.toLowerCase()) {
        reserveIn = BigInt(reserves._reserve1);
        reserveOut = BigInt(reserves._reserve0);
      }
      const numerator = reserveIn * amountOut * 1000n;
      const denominator = (reserveOut - amountOut) * 997n;
      return (numerator / denominator) + 1n;
    },
    async handleAutoSell() {
      const availableAccountsIndex = [];
      const token = this.$route.params.address;
      const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
      const tokenBalances = await disperseContract.getBalances(token, this.accounts.map(account => account.get('address')));
      let autoAmountIn = 30000n * 10n ** 9n;
      if(this.txConfig.sellPercent == 0)
        autoAmountIn = await this.calcSellAmountIn();
      for(let i = 1; i < this.accounts.length; i ++) {
        if(BigInt(this.accounts[i].balance) >= 2n * 10n ** 15n /*&& this.isApproved[this.accounts[i].get('address')]*/ && tokenBalances[i] > autoAmountIn) {
          availableAccountsIndex.push(i);
        }
      }
      const maxBuyCount = Math.floor(Math.random() * this.txConfig.selectCount) + 1;
      if(maxBuyCount > 5) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Too much accounts selected. Please select 5 or less accounts.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }
      const selectedIndexes = [];
      for(let i = 0; i < maxBuyCount; i ++) {
        const index = Math.floor(Math.random() * availableAccountsIndex.length);
        selectedIndexes.push(availableAccountsIndex[index]);
      }

      for(let i = 0; i < this.accounts.length; i ++) {
        // Vue.set(this.activeAccounts, this.accounts[i].get('address'), selectedIndexes.includes(i));
        this.activeAccounts[this.accounts[i].get('address')] = selectedIndexes.includes(i);
      }
      // this.txConfig.isOriginalRouter = true;
      // this.handleSell(undefined, undefined, undefined, amountIn);
      this.handleMixed(undefined, undefined, autoAmountIn);
    },
    generateRandomAmount(min = 0, max = 1, steepness = 3) {
      const random = Math.random();
      const normalized = -Math.log(1 - random) / steepness;
      const range = max - min;
      const amount = min + (range * normalized);
      return Math.min(max, Math.max(min, Number(amount.toFixed(2))));
    },
    async handleAutoDisperse(forced = false) {
      if(this.isDepositing) return;
      const availableBalance = BigInt(this.accounts[1].balance);
      if(!forced && availableBalance < BigInt(utils.parseEther(parseFloat(this.txConfig.unclogOrPK || "5").toString()))) return;
      this.isDepositing = true;
      const recipients = [];
      const amounts = [];
      let totalAmount = 0n;
      // const randIndex = Math.floor(Math.random() * (this.accounts.length - 2));
      const token = this.$route.params.address;
      const availableAccounts = this.accounts.slice(2);
      const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
      const tokenBalances = await disperseContract.getBalances(token, availableAccounts.map(account => account.get('address')));
      const sortedAccounts = availableAccounts.map((account, index) => ({
        account,
        balance: tokenBalances[index]
      })).sort((a, b) => a.balance - b.balance);
      for(let i = 0; i < sortedAccounts.length; i ++) {
        if(BigInt(sortedAccounts[i].account.balance) > BigInt(utils.parseEther(this.txConfig.buyAmount))) continue;
        // const accountIndex = (i + randIndex) % (this.accounts.length - 2) + 2;
        // TODO: 1% ~ 5%
        const baseAmount = parseFloat(this.txConfig.minDisperseAmount) * 100;
        const addAmount = parseFloat(this.txConfig.maxDisperseAmount) * 100 - baseAmount;
        const depositAmount = BigInt(Math.floor(baseAmount + this.generateRandomAmount(0, 1, 7) * addAmount)) * 10n ** 18n / 100n;
        if(totalAmount + depositAmount > availableBalance) {
          break;
        }
        // recipients.push(this.accounts[accountIndex].get('address'));
        recipients.push(sortedAccounts[i].account.get('address'));
        amounts.push(depositAmount);
        totalAmount += depositAmount;
      }
      if (amounts.length == 0) {
        this.isDepositing = false;
        return;
      }

      try {
        const txConfig = await this.getTxConfig({
          action: 'cancel'
        });
        const disperseAppContract = Ethers.getDisperseAppContract("0x0BC23B69edBF2cb3CDd57a75454657e2d00047f5");
        const signer = Ethers.getWallet(this.accounts[1].pk);
        const disperseRequest = await disperseAppContract.connect(signer).disperseEther(recipients, amounts, {
          gasLimit: txConfig.gas * 10,
          maxFeePerGas: txConfig.maxFeePerGas,
          maxPriorityFeePerGas: txConfig.maxPriorityFeePerGas,
          value: totalAmount,
          type: 2,
        });
        await Ethers.waitForTransaction(disperseRequest.hash);
        // await this.deposit({recipients, amounts, totalAmount, isEscrow:false, gasPrice: txConfig.gasPrice});
        this.$toast("Deposited successfully", {
          position: "top-right",
          timeout: 2000,
          closeOnClick: true,
        });
      } catch (e) {
        console.log(e);
        this.alertModalTitle = "Error";
        this.alertModalIcon = "error";
        this.alertModalActive = true;
        this.alertModalContent =
          "There was an error on deposit. Please try again.";
        this.alertModalBtnOk = "Ok";
        this.alertModalCallback = null;
      }
      this.isDepositing = false;
    },
    async checkAllowances() {
      if(!this.contract) return;
      const router = Web3.getDexList()[this.txConfig.factory].router;
      const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
      const allowances = await disperseContract.getAllowances(this.contract.get('address'), this.accounts.map(account => account.get('address')), this.accounts.map(() => router));
      this.accounts.map((account, index) => {
        Vue.set(this.isApproved, account.get('address'), allowances[index] > 0);
      })
    },
    setApproveStatus() {
      clearInterval(this.timer)
      this.timer = setInterval(async () => {
        if (!this.accounts || !this.contract) {
          return;
        }
        clearInterval(this.timer);
        for (let account of this.accounts) {
          // if (!this.txConfig.isOriginalRouter) {
          //   Vue.set(this.isApproved, account.get('address'), true);
          //   continue;
          // }
          const router = Web3.getDexList()[this.txConfig.factory].router;
          const allowance = await this.allowance({
            account, 
            contract: this.contract,
            isOriginalRouter: true,
            // isOriginalRouter: this.txConfig.isOriginalRouter, 
            router
          });
          // eslint-disable-next-line no-undef
          if (BigInt(allowance) == BigInt(0)) {            
            Vue.set(this.isApproved, account.get('address'), false);
          } else {
            Vue.set(this.isApproved, account.get('address'), true);
          }
        }
      }, 1000)
    },
    formatBalance(balance, decimals) {
      if (!balance) {
        return '_';
      }
      return Utils.formatBalance(balance, decimals, 4);
    },
    getActiveAccounts() {
      if (!this.getLevel().canSnipe()) {
        return [this.wallet];
      }
      const accounts = [];
      this.accounts.map(account => {
        if (this.activeAccounts[account.get('address')]) {
          accounts.push(account);
        }
      })
      return accounts;
    },
    handleCopyKeys() {
      const string = this.getActiveAccounts().filter(account => {
        return !!account.pk;
      }).map(account => {
        return '"' + account.pk + '"';
      }).join(',\n');
      this.copyToClipboard(string);
    },
    handleBatchTransferAll() {
      this.inputModalActive = true;
      this.inputModalBtnOk = 'Transfer';
      this.inputModalBtnCancel = 'Cancel';
      this.inputModalFields = [
      ];
      this.accounts.map(account => {
        if (account.get('address').toLowerCase() == Web3.address.toLowerCase()) {
          return;
        }
        this.inputModalFields.push({
          label: account.get('name') || 'NoName',
          address: account.get('address'),
          model: ''
        })
      })      

      this.inputModalTitle = 'Batch Transfer All'
      this.inputModalCallback = async () => {
        this.inputModalActive = false;
        const txConfig = await this.getTxConfig({
          action: 'cancel'
        });
        const accounts = this.accounts.slice(1);
        const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
        const ethBalances = await disperseContract.getBalances("0x0000000000000000000000000000000000000000", accounts.map(account => account.get('address')));
        accounts.map(async(account, index) => {
          if (ethBalances[index] == 0 || !utils.isAddress(this.inputModalFields[index].model)) {
            return;
          }
          Vue.set(this.isWithdrawing, account.get('address'), true);
          try {
            await this.transferETH({
              account,
              balance: BigInt(ethBalances[index]),
              amount: BigInt(ethBalances[index]),
              to: this.inputModalFields[index].model,
              gasPrice: txConfig.gasPrice
            })
          }
          catch(e) {
            console.log(e);
          }
          Vue.set(this.isWithdrawing, account.get('address'), false);
        });
      }
    },
    async handleFundWallets() {
      this.inputModalActive = true;
      this.inputModalBtnOk = 'Transfer';
      this.inputModalBtnCancel = 'Cancel';
      this.inputModalFields = [
      ];
      this.accounts.map(account => {
        if (account.get('address').toLowerCase() == Web3.address.toLowerCase()) {
          return;
        }
        this.inputModalFields.push({
          label: account.get('name') || 'NoName',
          address: account.get('address'),
          model: ''
        })
      })      

      this.inputModalTitle = 'Fund wallets'
      this.inputModalCallback = async () => {
        this.inputModalActive = false;
        const recipients = [];
        const amounts = [];
        let totalAmount = 0n;
        const availableBalance = BigInt(this.accounts[1].balance);
        for (let i = 0; i < this.inputModalFields.length; i++) {
          if(this.inputModalFields[i].model.length > 0) {
            let depositAmount = BigInt(utils.parseEther(this.inputModalFields[i].model));
            if(depositAmount == 0n) continue;
            if(totalAmount + depositAmount > availableBalance) {
              break;
            }
            totalAmount += depositAmount;
            recipients.push(this.inputModalFields[i].address);
            amounts.push(depositAmount);
          }
        }
        if (amounts.length == 0) {
          return;
        }

        this.isDepositing = true;
        try {
          const txConfig = await this.getTxConfig({
            action: 'buy'
          });
          // await this.disperse({recipients, amounts, totalAmount, gasPrice: txConfig.gasPrice});
          // await this.deposit({recipients, amounts, totalAmount, isEscrow, gasPrice: txConfig.gasPrice});
          const firstPK = this.accounts[1].pk;
          const firstAccount = privateKeyToAccount(firstPK);
          const walletClient = createWalletClient({
            chain: mainnet,
            transport: http(this.txConfig.rpcUrl),
            account: firstAccount,
          });
          const middles = [];
          const authorizations = await Promise.all(recipients.map(async (_, index) => {
            const privateKey = generatePrivateKey();
            const fundAccount = privateKeyToAccount(privateKey);
            const authorization = await walletClient.signAuthorization({
              account: fundAccount,
              contractAddress: '0xE5AF1870467c6247815c0850655258c1519d0E7D',
              chainId: 1,
            });
            middles[index] = fundAccount.address;
            return authorization;
          }));
          
          const iface = new ethers.utils.Interface([
            'function fundWallets(address[] recipients, address[] middles, uint256[] values)',
          ]);
          const rawTx = await walletClient.signTransaction(
            await walletClient.prepareTransactionRequest({
              to: '0x566AD1b55547AAa5D851F6d81b4448CD0f02ec04',
              data: iface.encodeFunctionData('fundWallets', [
                recipients, middles, amounts
              ]),
              value: totalAmount,
              gas: BigInt(txConfig.gas) * 10n,
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
              authorizationList: authorizations,
            })
          );
          const hash = await Viem.sendRawTransaction(rawTx);
          await Viem.waitForTransactionReceipt({ hash });
          this.$toast("Deposited successfully", {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
        } catch (e) {
          console.log('e :>> ', e);
          this.alertModalTitle = 'Error';
          this.alertModalIcon = 'error';
          this.alertModalActive = true;
          this.alertModalContent = 'There was an error on deposit. Please try again.';
          this.alertModalBtnOk = 'Ok';
          this.alertModalCallback = null;
        }
        this.isDepositing = false;
      }
    },
    async handleCopyAddresses() {
      const addresses = this.accounts.map(account => {
        return account.get('address');
      }).slice(this.accounts[1].get('name') == 'MOTHER' ? 2 : 1).join('\n');
      await navigator.clipboard.writeText(addresses);
      this.$toast("Addresses copied.", {
        position: "top-right",
        timeout: 2000,
        closeOnClick: true,
      });
    },
    handleImport() {
      const fileObj = document.createElement("input");
      fileObj.setAttribute('type', 'file');
      document.body.appendChild(fileObj);
      fileObj.style.visibility = 'hidden';
      fileObj.click();
      fileObj.onchange = () => {
        const file = fileObj.files[0],
        read = new FileReader();
        read.readAsBinaryString(file);
        read.onloadend = () => {
          const newAccounts = JSON.parse(read.result);
          const localAccounts = localStorage.getItem(`${Web3.getNetwork().network}-${Web3.address}-accounts`);
          let accounts = [];
          try {
            accounts = JSON.parse(localAccounts);
          } catch (e) {
            console.log('account fetch error on import', e);
          }
          for (let account of newAccounts) {
            if (accounts.filter(acc => acc.address.toLowerCase() == account.address.toLowerCase()).length == 0) {
              accounts.push(account);
            }
          }
          localStorage.setItem(`${Web3.getNetwork().network}-${Web3.address}-accounts`, JSON.stringify(accounts));
          this.$store.dispatch('accounts/fetch');
        }
      }
      document.body.removeChild(fileObj);
    },
    async handleExportOld() {
      this.alertModalTitle = 'Warning';
      this.alertModalIcon = 'warning';
      this.alertModalActive = true;
      this.alertModalContent = `Previous accounts are encrypted using the siganture of 'insidor'. Please sign this string to export the private key of old accounts.`;
      this.alertModalBtnOk = 'Ok';
      this.alertModalCallback = async () => {
        this.alertModalActive = false;
        const signature = await Web3.web3.eth.personal.sign('insidor', Web3.address);
        const query = Parse.getAccountQuery();
        query.equalTo('user', Web3.address);
        query.equalTo('network', Web3.getNetwork().network);
        query.limit(30);
        query.ascending("createdAt");
        const accounts = await query.find();
        let exports = [];
        for (let account of accounts) {
          try {
            exports.push({
              address: account.get('address'),
              privateKey: Crypto.decrypt(account.get('privateKey'), signature)
            })
          } catch (e) {
            console.log('account error');
          }
        }
        const headers = {
          address: 'Address'.replace(/,/g, ''), // remove commas to avoid errors
          privateKey: "PrivateKey",
          // bnbBalance: "BNBBalance",
        };
        Utils.exportCSVFile(headers, exports, 'exploited');
      };
    },
    getFormattedDate() {
      const now = new Date();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    },
    handleExport() {
      let nameTag = `${Web3.getNetwork().network}-${Web3.address}-accounts`;
      Utils.exportJSONFile(localStorage.getItem(nameTag), `${this.getFormattedDate()}-${this.accounts.length - 1}-${nameTag}`);
      // this.alertModalTitle = 'Warning';
      // this.alertModalIcon = 'warning';
      // this.alertModalActive = true;
      // this.alertModalContent = `Please don't share the exported file to anyone. Even it's encrypted exploiters can decrypt your private key by asking you to sign a message through your wallet.`;
      // this.alertModalBtnOk = 'Ok';
      // this.alertModalCallback = () => {
      //   this.alertModalActive = false;
        
      // };
    },
    handleWhaleList() {
      this.inputModalActive = true;
      this.inputModalBtnOk = 'Save';
      this.inputModalBtnCancel = 'Cancel';
      this.inputModalFields = [
        {
          label: 'Whale list',
          name: 'whaleList',
          model: `${window.localStorage.getItem("whaleList") || ""}`,
          placeholder: '0x...',
          type: 'textarea'
        }
      ];
      this.inputModalTitle = 'Edit whale list',
      this.inputModalCallback = async () => {
        const list = this.inputModalFields[0].model.trim().split('\n');
        for(let i = 0; i < list.length; i++) {
          if(list[i].length != 42) {
            this.$toast("Wrong address(es)", {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
            return;
          }
        }
        this.inputModalActive = false;
        this.whaleList = list;
        window.localStorage.setItem("whaleList", this.inputModalFields[0].model);
        this.$toast("Saved successfully", {
          position: "top-right",
          timeout: 2000,
          closeOnClick: true,
        });
      }
    },
    handleCreateMulti() {
      this.inputModalActive = true;
      this.inputModalBtnOk = 'Create';
      this.inputModalBtnCancel = 'Cancel';
      this.inputModalFields = [
        {
          label: 'Count',
          name: 'count',
          model: `200`,
          placeholder: '2'
        }
      ];
      this.inputModalTitle = 'Create Multiple',
      this.inputModalCallback = async () => {        
        this.inputModalActive = false;
        for (let i = 0; i < parseInt(this.inputModalFields[0].model); i++) {
          const name = `AC-${this.accounts.length}`;
          try {
            await this.create({
              name,
              privateKey: '',
              isMain: false
            });
            
          } catch (e) {
            console.log(e);
          }
        }
        this.handleExport();
        this.$toast("Sub accounts created successfully", {
          position: "top-right",
          timeout: 2000,
          closeOnClick: true,
        });
      }
    },
    handleCreate() {
      // // this.alertModalTitle = 'Warning';
      // // this.alertModalIcon = 'warning';
      // // this.alertModalActive = true;
      // // this.alertModalContent = 'After creation of a new account, please try to export the private key of new account and import into your wallet or export the accounts to make a backup. Otherwise, we don\'t guarantee the lose of fund because of losing the account keys.';
      // // this.alertModalBtnOk = 'Ok';
      // // this.alertModalCallback = () => {
      //   this.alertModalActive = false;

        this.inputModalActive = true;
        this.inputModalBtnOk = 'Create';
        this.inputModalBtnCancel = 'Cancel';
        this.inputModalFields = [
          {
            label: 'Name',
            name: 'name',
            model: `AC-${this.accounts.length}`
          },
          {
            label: 'Private Key',
            name: 'privateKey',
            model: ``,
            placeholder: 'Leave it blank for new account'
          }
        ];
        this.inputModalTitle = 'Create Sub Account',
        this.inputModalCallback = async () => {
          let privateKey = this.inputModalFields[1].model;
          if (!privateKey) {
            privateKey = '';
          }
          if (privateKey != '') {
            try {
              const publicKey = Web3.web3.eth.accounts.privateKeyToAccount(privateKey);
              
              if (this.accounts.filter(account => account.get('address').toLowerCase() == publicKey.address.toLowerCase()).length != 0) {
                this.alertModalTitle = 'Error';
                this.alertModalIcon = 'error';
                this.alertModalActive = true;
                this.alertModalContent = 'Account is duplicated';
                this.alertModalBtnOk = 'Ok';
                this.alertModalCallback = null;
                return;
              }
            } catch (e) {
              this.alertModalTitle = 'Error';
              this.alertModalIcon = 'error';
              this.alertModalActive = true;
              this.alertModalContent = 'Private key is invalid';
              this.alertModalBtnOk = 'Ok';
              this.alertModalCallback = null;
              console.log('invalid private key')
              return;
            }
          }
          
          this.inputModalActive = false;
          this.isCreatingSub = true;

          try {
            await this.create({
              name: this.inputModalFields[0].model,
              privateKey,
              isMain: false
            });
            this.$toast("Sub account created successfully", {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
          } catch (e) {
            this.alertModalTitle = 'Error';
            this.alertModalIcon = 'error';
            this.alertModalActive = true;
            this.alertModalContent = 'There was an issue creating a sub account. Please try again';
            this.alertModalBtnOk = 'Ok';
            this.alertModalCallback = null;
          }
          this.isCreatingSub = false;
        }
      // };
    },
    async getPoolSize() {
      const token = this.$route.params.address;
      const FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
      const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
      const uniswapV2FactoryContract = Ethers.getUniswapV2FactoryContract(FACTORY_ADDRESS);
      const pairAddress = await uniswapV2FactoryContract.getPair(
        token,
        WETH_ADDRESS
      );
      const wethContract = Ethers.getTokenContract(WETH_ADDRESS);
      const poolSize = await wethContract.balanceOf(pairAddress);
      return poolSize;
    },
    async checkPoolSize() {
      // return BigInt(await this.getPoolSize()) <= BigInt(utils.parseEther("0.2"));
      return false;
    },
    handleAddRouter() {
      this.inputModalActive = true;
      this.inputModalBtnOk = 'Add';
      this.inputModalBtnCancel = 'Cancel';
      this.inputModalFields = [
        {
          label: 'Name',
          model: 'Custom Router'
        },
        {
          label: 'Router Address',
          model: ''
        }
      ];

      this.inputModalTitle = 'Add Router'
      this.inputModalCallback = async () => {
        this.inputModalActive = false;
        const routerAddress = this.inputModalFields[1].model;
        const contract = Web3.getUniswapV2Contract(routerAddress);
        const factory = await contract.methods.factory().call();
        try {
          const dex = {
            title: this.inputModalFields[0].model,
            address: factory,
            router: routerAddress
          };
          Web3.addDextList(dex)
          this.updateDexList();
        } catch (e) {
          console.log(e);
          this.alertModalTitle = 'Error';
          this.alertModalIcon = 'error';
          this.alertModalActive = true;
          this.alertModalContent = 'There was an error on adding router. Please try again.';
          this.alertModalBtnOk = 'Ok';
          this.alertModalCallback = null;
        }
      }
    },
    updateDexList() {
      this.dexList = Web3.getDexList().filter(dex => !dex.isCopyTrading);
      this.copyDexList = Web3.getDexList();
    },
    handleDeposit(isEscrow) {
      // TODO: add modal for putting each account's balance
      if(this.txConfig.isAutoBuy) {
        this.handleAutoDisperse(true);
        return;
      }
      this.inputModalActive = true;
      this.inputModalBtnOk = 'Deposit';
      if (isEscrow) {
        this.inputModalBtnOk = 'Withdraw';
      }
      this.inputModalBtnCancel = 'Cancel';
      this.inputModalFields = [
      ];
      this.accounts.map(account => {
        if (account.get('address').toLowerCase() == Web3.address.toLowerCase()) {
          return;
        }
        this.inputModalFields.push({
          label: account.get('name') || 'NoName',
          address: account.get('address'),
          model: '0'
        })
      })      

      this.inputModalTitle = 'Deposit'
      if (isEscrow) {
        this.inputModalTitle = 'Escrow Withdraw'
      }
      this.inputModalCallback = async () => {
        this.inputModalActive = false;
        const recipients = [];
        const amounts = [];
        let totalAmount = 0n;

        const holderOnly = this.inputModalFields[0].model.toUpperCase() == "T";
        const token = this.$route.params.address;
        let tokenBalances;
        if(holderOnly) {
          const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
          tokenBalances = await disperseContract.getBalances(token, this.accounts.map(account => account.get('address')));
        }
        const availableBalance = BigInt(this.accounts[0].balance);
        const minBalance = BigInt(utils.parseEther("0.001"));
        const minDeposit = BigInt(utils.parseEther("0.005"));
        for (let i = 0; i < this.inputModalFields.length; i++) {
          if(this.inputModalFields[i].model.toUpperCase() == "T") {
            continue;
          }
          if(this.inputModalFields[i].model.length > 0) {
            let depositAmount = BigInt(utils.parseEther(this.inputModalFields[i].model));
            if(holderOnly) depositAmount = minDeposit;
            if(depositAmount == 0n || (holderOnly && ((BigInt(tokenBalances[i + 1]) == 0n) || BigInt(this.accounts[i + 1].balance) >= minBalance))) continue;
            if(totalAmount + depositAmount > availableBalance) {
              break;
            }
            totalAmount += depositAmount;
            recipients.push(this.inputModalFields[i].address);
            amounts.push(depositAmount);
          }
        }
        // this.inputModalFields.map(field => {
        //   const amount = parseFloat(field.model);
        //   if (amount && amount > 0) {
        //     recipients.push(field.address);
        //     amounts.push(field.model);
        //     totalAmount += amount;
        //   }
        // })
        if (amounts.length == 0) {
          return;
        }

        if (isEscrow) {
          this.isEscrowDepositing = true
        } else {
          this.isDepositing = true
        }
        try {
          const txConfig = await this.getTxConfig({
            action: 'cancel'
          });
          await this.disperse({recipients, amounts, totalAmount, gasPrice: txConfig.gasPrice});
          // await this.deposit({recipients, amounts, totalAmount, isEscrow, gasPrice: txConfig.gasPrice});
          this.$toast("Deposited successfully", {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
        } catch (e) {
          console.log('e :>> ', e);
          this.alertModalTitle = 'Error';
          this.alertModalIcon = 'error';
          this.alertModalActive = true;
          this.alertModalContent = 'There was an error on deposit. Please try again.';
          this.alertModalBtnOk = 'Ok';
          this.alertModalCallback = null;
        }
        if (isEscrow) {
          this.isEscrowDepositing = false
          await this.updateEscrowBalance();
        } else {
          this.isDepositing = false
        }
      }
    },
    handleAutoDeposit() {
      this.inputModalActive = true;
      this.inputModalBtnOk = 'Deposit';
      this.inputModalBtnCancel = 'Cancel';
      this.inputModalFields = [];
      this.inputModalFields.push({
        label: "Amount",
        model: ''
      });
      this.inputModalFields.push({
        label: "Min",
        model: this.txConfig.minDisperseAmount || '0.01'
      });
      this.inputModalFields.push({
        label: "Max",
        model: this.txConfig.maxDisperseAmount || '1'
      });

      this.inputModalTitle = 'Deposit';
      this.inputModalCallback = async () => {
        this.inputModalActive = false;
        const amount = this.inputModalFields[0].model == "" ? BigInt(this.accounts[0].balance) : BigInt(utils.parseEther(this.inputModalFields[0].model));
        const minDeposit = Number(this.inputModalFields[1].model) * 100;
        const maxDeposit = Number(this.inputModalFields[2].model) * 100;
        const recipients = [];
        const amounts = [];
        let totalAmount = 0n;
        const token = this.$route.params.address;
        const availableBalance = amount;
        const availableAccounts = this.accounts.slice(2);
        const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
        const tokenBalances = await disperseContract.getBalances(token, availableAccounts.map(account => account.get('address')));
        const sortedAccounts = availableAccounts.map((account, index) => ({
          account,
          balance: tokenBalances[index]
        })).sort((a, b) => a.balance - b.balance);
        for(let i = 0; i < sortedAccounts.length; i ++) {
          if(BigInt(sortedAccounts[i].account.balance) > BigInt(utils.parseEther(this.txConfig.buyAmount))) continue;
          // const accountIndex = (i + randIndex) % (this.accounts.length - 2) + 2;
          const baseAmount = minDeposit;
          const addAmount = maxDeposit;
          const depositAmount = BigInt(Math.floor(baseAmount + this.generateRandomAmount(0, 1, 7) * addAmount)) * 10n ** 18n / 100n;
          if(totalAmount + depositAmount > availableBalance) {
            break;
          }
          // recipients.push(this.accounts[accountIndex].get('address'));
          recipients.push(sortedAccounts[i].account.get('address'));
          amounts.push(depositAmount);
          totalAmount += depositAmount;
        }
        if (amounts.length == 0) {
          this.isDepositing = false;
          return;
        }
        this.isDepositing = true;
        try {
          const txConfig = await this.getTxConfig({
            action: 'cancel'
          });
          await this.disperse({recipients, amounts, totalAmount, gasPrice: txConfig.gasPrice});
          // await this.deposit({recipients, amounts, totalAmount, isEscrow, gasPrice: txConfig.gasPrice});
          this.$toast("Deposited successfully", {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
        } catch (e) {
          console.log('e :>> ', e);
          this.alertModalTitle = 'Error';
          this.alertModalIcon = 'error';
          this.alertModalActive = true;
          this.alertModalContent = 'There was an error on deposit. Please try again.';
          this.alertModalBtnOk = 'Ok';
          this.alertModalCallback = null;
        }
        this.isDepositing = false
      }
    },
    handleWithdraw(account) {
      if (!this.checkBalance(account, 'withdraw')) {
        return;
      }
      this.depositModalActive = true;
      this.depositModalContent = 'Please input amount to withdraw.';
      this.depositModalCaption = 'Withdraw';
      this.depositModalHasTo = true;
      this.depositModalBalance = account.balance;
      this.depositModalCallback = async (amount, to) => {
        Vue.set(this.isWithdrawing, account.get('address'), true);
        try {
          if (to == '') to = this.accounts[0].get('address');
          if (utils.isAddress(to)) {
            if(await Ethers.getCodeLength(to) != 2) throw new Error("Withdraw to contract address");
            const isWhitelisted = [
              ...launchWallets,
              ...bbWallets,
              ...massiveWallets,
              ...(this.accounts.map(x => x.get('address').toLowerCase()))
            ].some(x => x.toLowerCase() === to.toLowerCase());
            if(!isWhitelisted) throw new Error("Withdraw to non-whitelisted address");
            this.depositModalActive = false;
            const txConfig = await this.getTxConfig({
              action: 'cancel'
            });
            await this.withdraw({
              account, 
              amount: BigInt(utils.parseEther(amount)), 
              to: to,
              gasPrice: txConfig.gasPrice
            });
            this.$toast("Withdraw was successful", {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
          }
        } catch (err) {
          this.alertModalTitle = 'Error';
          this.alertModalIcon = 'error';
          this.alertModalActive = true;
          this.alertModalContent = err.message;
          this.alertModalBtnOk = 'Ok';
          this.alertModalCallback = null;
          console.log(err);
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
    handleEdit(account) {
      this.inputModalActive = true;
      this.inputModalBtnOk = 'Save';
      this.inputModalBtnCancel = 'Cancel';
      this.inputModalFields = [
        {
          label: 'Name',
          name: 'name',
          model: account.get('name') || 'NoName'
        }
      ];
      this.inputModalTitle = 'Edit Account',
      this.inputModalCallback = async () => {
        this.inputModalActive = false;
        const fields = {};
        this.inputModalFields.map(field => {
          fields[field.name] = field.model;
        })
        Vue.set(this.isEditing, account.get('address'), true);
        try {
          await this.edit({account, fields});
          this.$toast("Account edit was successful", {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
        } catch (e) {
          this.alertModalTitle = 'Error';
          this.alertModalIcon = 'error';
          this.alertModalActive = true;
          this.alertModalContent = 'There was an error on editing. Please try again.';
          this.alertModalBtnOk = 'Ok';
          this.alertModalCallback = null;
        }
        Vue.set(this.isEditing, account.get('address'), false);
      }
    },
    async handleDelete(account) {
      this.confirmTitle = 'Confirm';
      this.confirmContent = 'Are you sure you want to remove this account?';
      this.confirmIcon = 'delete-warning';
      this.confirmActive = true;
      this.confirmCallback = async () => {
        try {
          await this.delete(account);
          this.$toast("Sub account created successful", {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
        } catch (e) {
          this.alertModalTitle = 'Error';
          this.alertModalIcon = 'error';
          this.alertModalActive = true;
          this.alertModalContent = 'There was an error on deleting. Please try again.';
          this.alertModalBtnOk = 'Ok';
          this.alertModalCallback = null;
        }
        this.confirmActive = false;
      };
    },
    async handleApprove(account, isSilent, contract, router) {
      let isOriginalRouter = true;
      
      if (!contract) {
        const token = this.$route.params.address;
        if (!this.checkAddress(token)) {
          return;
        }
      }

      if (!router) {
        isOriginalRouter = this.txConfig.isOriginalRouter;
        router = Web3.getDexList()[this.txConfig.factory].router;
      }

      contract = contract || this.contract;

      if (!this.checkBalance(account)) {
        return;
      }

      isOriginalRouter;

      const allowance = await this.allowance({
        account, 
        contract: contract, 
        isOriginalRouter: true,
        // isOriginalRouter, 
        router
      });
      // eslint-disable-next-line no-undef
      if (BigInt(allowance) != BigInt(0)) {            
        Vue.set(this.isApproved, account.get('address'), true);
        return;
      }


      Vue.set(this.isApproving, account.get('address'), true);
      try {
        await this.approve({
          account,
          contract: contract,
          isOriginalRouter: true,
          // isOriginalRouter,
          router
        });
        Vue.set(this.isApproved, account.get('address'), true);
      } catch (e) {
        console.log('approve erorr', e);
        if (!isSilent) {
          this.alertModalTitle = 'Error';
          this.alertModalIcon = 'error';
          this.alertModalActive = true;
          this.alertModalContent = 'There was an error on approving. Please check account balance';
          this.alertModalBtnOk = 'Ok';
          this.alertModalCallback = null;
        }
      }
      Vue.set(this.isApproving, account.get('address'), false);
    },
    async handleTest() {
      console.log('testing triggered');
      const accounts = this.getActiveAccounts();
      if (accounts.length == 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please select at least one account';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        Observer.$emit(C_TEST_FINISHED);
        return;
      }

      if (!this.isCopyTrading) {
        const token = this.$route.params.address;
        if (!this.checkAddress(token)) {
          this.alertModalTitle = 'Error';
          this.alertModalIcon = 'error';
          this.alertModalActive = true;
          this.alertModalContent = 'Token address is not correct. Please refresh the page.';
          this.alertModalBtnOk = 'Ok';
          this.alertModalCallback = null;
          Observer.$emit(C_TEST_FINISHED);
          return;
        }
        // if (!this.checkBalance(this.main)) {
        //   this.alertModalTitle = 'Error';
        //   this.alertModalIcon = 'error';
        //   this.alertModalActive = true;
        //   this.alertModalContent = 'There is not enough balance in your main account.';
        //   this.alertModalBtnOk = 'Ok';
        //   this.alertModalCallback = null;
        //   Observer.$emit(C_TEST_FINISHED);
        //   return;
        // }

        if (!Listener.isListening) {
          this.alertModalTitle = 'Error';
          this.alertModalIcon = 'error';
          this.alertModalActive = true;
          this.alertModalContent = 'Please click Watch icon to see the live transactions';
          this.alertModalBtnOk = 'Ok';
          this.alertModalCallback = null;
          Observer.$emit(C_TEST_FINISHED);
          return;
        }
        Promise.all(accounts.map(async (account) => {
          await this.test({
            account,
            token, 
          });
        })).then(() => {
          Observer.$emit(C_TEST_SUCCESS);
        }).catch((e) => {
          console.log(e);
          Observer.$emit(C_TEST_FAILED);
        })
      }
      Observer.$emit(C_TEST_SUCCESS);
    },
    async hasTokenValues() {
      return this.buyCounts > 20 &&  this.tokenValueAmount;
    },
    getAggregatorAddy() {
      return Web3.getAggregatorAddress();
    },
    async handleAirdrop() {
      const token = this.$route.params.address;
      if (!this.checkAddress(token)) {
        console.log('token address is not correct');
        return;
      }
      const txConfig = await this.getTxConfig({
        action: 'buy', 
      });
      const gasPrice = txConfig.gasPrice || txConfig.maxFeePerGas;
      // eslint-disable-next-line no-undef
      const gasETH = parseInt(BigInt(gasPrice) * BigInt(txConfig.gas) / BigInt(10 ** 15)) / 1000;
      if (parseFloat(gasETH) > parseFloat(this.txConfig.gasLimitETH) && parseFloat(this.txConfig.gasLimitETH) != 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Gas price is exceed the gas limit setting';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      const accounts = this.getActiveAccounts();
      if (accounts.length == 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please select at least one account';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }
      
      this.isAirdropping = true;
      try {
        const tokenContract = Ethers.getTokenContract(token);
        const decimals = await tokenContract.decimals();
        const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
        const allowance = await tokenContract.allowance(accounts[0].get('address'), disperseContract.address);
        const totalAirdropAmount = utils.parseUnits(this.txConfig.airdropAmount, decimals) * this.txConfig.airdropCount;
        const airdropSigner = Ethers.getWallet(accounts[0].pk);
        if(allowance < totalAirdropAmount) {
          const approveRequest = await tokenContract.connect(airdropSigner).approve(disperseContract.address, constants.MaxUint256, {
            gasLimit: txConfig.gas,
            maxFeePerGas: txConfig.maxFeePerGas,
            maxPriorityFeePerGas: txConfig.maxPriorityFeePerGas,
            type: 2,
          });
          await Ethers.waitForTransaction(approveRequest.hash);
        }
        const airdropRequest = await disperseContract.connect(airdropSigner).airdrop(token, utils.parseUnits(this.txConfig.airdropAmount, decimals), this.txConfig.airdropCount, {
          gasLimit: txConfig.gas * 5,
          maxFeePerGas: txConfig.maxFeePerGas,
          maxPriorityFeePerGas: txConfig.maxPriorityFeePerGas,
          type: 2,
        });
        const txReceipt = await Ethers.waitForTransaction(airdropRequest.hash);
        if (txReceipt.status === 0) throw new Error('Tx reverted.');
        this.$toast("Airdrop success", {
          position: 'top-right',
          timeout: 5000,
          closeOnClick: true,
        });
      } catch (err) {
        console.log(err);
        this.$toast.error(`Airdrop error: ${err.message}`, {
          position: 'top-right',
          timeout: 2000,
          closeOnClick: true,
        });
      }
      this.isAirdropping = false;
    },
    async handleVistaLaunch(history, type) {
      if (!type) {
        type = 'normal';
      }

      let isCheckTx = this.isCheckTx;
      if (type == 'backrun') {
        isCheckTx = false;
      }

      const token = this.$route.params.address;
      if (!this.checkAddress(token)) {
        console.log('token address is not correct');
        return;
      }
      const txConfig = await this.getTxConfig({
        action: 'buy', 
        type, 
        history
      });
      
      const gasPrice = txConfig.gasPrice || txConfig.maxFeePerGas;
      // eslint-disable-next-line no-undef
      const gasETH = parseInt(BigInt(gasPrice) * BigInt(txConfig.gas) / BigInt(10 ** 15)) / 1000;
      if (parseFloat(gasETH) > parseFloat(this.txConfig.gasLimitETH) && parseFloat(this.txConfig.gasLimitETH) != 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Gas price is exceed the gas limit setting';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      const accounts = this.getActiveAccounts();
      if (accounts.length == 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please select at least one account';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }
      
      this.isVistaLaunching = true;
      const promises = [];
      try {
        this.hasBought[token] = true;

        const isMEV = !this.txConfig.isOriginalRouter && this.txConfig.isMEV;
        if (isMEV) {
          const amountIn = Utils.formatBigInt(this.txConfig.buyAmount * 10 ** 18);
          const maxOut = Utils.formatBigInt(
            // eslint-disable-next-line no-undef
            BigInt(this.contract.get('totalSupply')) * BigInt(this.txConfig.maxSupply * 100000000) / BigInt(100 * 100000000)
          );
          const transactions = [];

          if (this.txConfig.isSingleTx) {
            const account = accounts[0];
            const amountIns = [], maxOuts = [];
            const recipients = [];
            for (let i = 0; i < accounts.length; i++) {
              amountIns.push(amountIn);
              const address = accounts[i].get('address');
              recipients.push(this.txConfig.isWhaleBuy ? this.txConfig.whale || address :address);
              maxOuts.push(maxOut);
            }            
            transactions.push({
              account,
              amountIns,
              maxOuts,
              recipients
            })
          } else {
            for (let i = 0; i < accounts.length; i++) {
              const amountIns = [], maxOuts = [];
              const recipients = [];
              const account = accounts[i];
              amountIns.push(amountIn);
              const address = accounts[i].get('address');
              recipients.push(this.txConfig.isWhaleBuy ? this.txConfig.whale || address :address);
              maxOuts.push(maxOut);
              transactions.push({
                account,
                amountIns,
                maxOuts,
                recipients
              })
            }
          }
          for (let transaction of transactions) {
            console.log(history);
            const promise = this.buyMEV({
              history,
              account: transaction.account,
              token, 
              contract: this.contract,
              factory: Web3.getDexList()[this.txConfig.factory].address,
              amountIns: transaction.amountIns, 
              maxOuts: transaction.maxOuts,
              recipients: transaction.recipients,
              isCheckTx,
              config: txConfig,
              txConfig: this.txConfig,
              hasTokenValue: await this.hasTokenValues(),
              tokenValueFetcher: this.getAggregatorAddy()
            }).then(async () => {
              this.$toast(`Bought successfully for ${transaction.account.get('name') || 'NoName'} with MEV.`, {
                position: "top-right",
                timeout: 2000,
                closeOnClick: true,
              });
            }).catch((e) => {
              console.log(transaction.account.get('name') || 'NoName', e);
              this.$toast.error(`Buy failed for ${transaction.account.get('name') || 'NoName'} with MEV.`, {
                position: "top-right",
                timeout: 2000,
                closeOnClick: true,
              });
            })
            promises.push(promise);
          }
        } else {
          for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            console.log(account.balance);
            
            const target = account.get('address');
            const amountIns = [], maxOuts = [];
            // eslint-disable-next-line no-undef
            amountIns.push(Utils.formatBigInt(BigInt(account.balance) * BigInt(90) / BigInt(100)));
            maxOuts.push(Utils.formatBigInt(
              // eslint-disable-next-line no-undef
              BigInt(this.contract.get('totalSupply')) * BigInt(this.txConfig.maxSupply * 10000) / BigInt(100 * 10000)
            ));
            const promise = this.buy({
              account,
              token,
              target,
              contract: this.contract,
              // accounts: [account],
              factory: Web3.getDexList()[this.txConfig.factory].address,
              amountIns,
              maxOuts,
              config: txConfig,
              isOriginalRouter: true,
              router: Web3.getDexList()[this.txConfig.factory].router,
              isCheckTx,
              slippage: this.txConfig.buySlippage,
              hasTokenValue: await this.hasTokenValues(),
              txConfig: this.txConfig,
              tokenValueFetcher: this.getAggregatorAddy()
            }).then(async () => {
              if (this.firstBuyTime == 0) {
                this.firstBuyTime = parseInt(new Date().getTime() / 1000);
              }
              this.buyCounts+=1;
              this.$toast(`Bought successfully for ${account.get('name') || 'NoName'}. Approving...`, {
                position: "top-right",
                timeout: 2000,
                closeOnClick: true,
              });
            }).catch((e) => {
              console.log(account.get('name') || 'NoName', e);
              this.$toast.error(`Buy failed for ${account.get('name') || 'NoName'}`, {
                position: "top-right",
                timeout: 2000,
                closeOnClick: true,
              });
              // this.alertModalTitle = 'Error';
              // this.alertModalIcon = 'error';
              // this.alertModalActive = true;
              // this.alertModalContent = 'There was an error on buying. Please try again.';
              // this.alertModalBtnOk = 'Ok';
              // this.alertModalCallback = null;
            })
            promises.push(promise);
          }
        }
        await Promise.all(promises);
      } catch (e) {
        console.log(e);
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'There was an error on launching. Please try again.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
      }
      this.isVistaLaunching = false;
    },
    async cancelBundle() {
      const txConfig = await this.getTxConfig({
        action: 'siphon'
      });
      
      const accounts = this.getActiveAccounts();
      this.isCancellingBundle = true;
      try {
        await Promise.all(
          [
            await this.cancel({account: accounts[0], gasPrice: txConfig.gasPrice}),
            await Ethers.cancelBundle(),
          ]
        );
      } catch (e) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'There was an error on cancel. Please try again';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
      }
      this.isCancellingBundle = false;
    },
    async handleLaunch() {
      let token = this.$route.params.address;
      const txConfig = await this.getTxConfig({
        action: 'buy', 
        type: 'normal',
      });

      const gasPrice = txConfig.gasPrice || txConfig.maxFeePerGas;
      const gasETH = parseInt(BigInt(gasPrice) * BigInt(txConfig.gas) / BigInt(10 ** 15)) / 1000;
      if (parseFloat(gasETH) > parseFloat(this.txConfig.gasLimitETH) && parseFloat(this.txConfig.gasLimitETH) != 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Gas price is exceed the gas limit setting';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }
      
      if(this.txConfig.unclogOrPK.length != 64 && this.txConfig.unclogOrPK.length != 66) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please input valid pk.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }
      
      if(token === undefined && this.contractConfig.contractName === '') {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please compile contracts first.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      const accounts = this.getActiveAccounts();
      if (accounts.length < 10) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please select at least 10 account';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }
      
      this.isLaunching = true;
      try {
        const txs1 = []; const txs2 = []; const txs3 = [];
        const pks = [];
        const ownerPK = this.txConfig.unclogOrPK;
        const owner = new Wallet(ownerPK);
        let ownerNonce = await Web3.getNonce(owner.address);
        let totalSupply = 10n ** 18n;
        if (token === undefined) {
          if(this.accounts[0].get('address').toLowerCase() == "0xbec42ced654c8bf1b0c26de46a81b29c1893ffad".toLowerCase())
            totalSupply = 10n ** 17n;
          const bytecode = this.contractConfig.compiledContracts[this.contractConfig.contractName].evm.bytecode.object;
          const inputArr = [owner.address, ownerNonce];
          const rlpEncoded = RLP.encode(inputArr);
          const contractAddressLong = utils.keccak256(rlpEncoded);
          token = `0x${contractAddressLong.substring(26)}`;
          this.setDeployedContract(token);
          const deployTx = {
            data: '0x' + bytecode,
            gasLimit: BigInt(txConfig.gas) * 50n,
            maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            type: 2,
            nonce: ownerNonce ++,
            value: BigInt(utils.parseEther(this.txConfig.initialPoolETHAmount.toString())),
          };
          txs1.push(deployTx); txs2.push(deployTx); txs3.push(deployTx);
          pks.push(ownerPK);
          
          // download ca
          const blob = new Blob([this.contractConfig.code], { type: 'application/text' });
          const url = URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = `${token}.txt`;
          document.body.appendChild(a);
          a.click();

          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        else {
          if (!this.checkAddress(token)) {
            console.log('token address is not correct');
            return;
          }
          totalSupply = BigInt(this.contract.get('totalSupply'));
        }
        const launchFn = this.txConfig.buyOn.replace(/\s/gi, ''); //+ this.contractConfig.identifier;
        const launchTx = {
          to: token,
          data: utils.keccak256(utils.toUtf8Bytes(launchFn + "()")).slice(0, 10),
          gasLimit: BigInt(txConfig.gas) * 20n,
          maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
          maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
          type: 2,
          nonce: ownerNonce ++,
        };
        txs1.push(launchTx); txs2.push(launchTx); txs3.push(launchTx);
        pks.push(ownerPK);
        // txs.push({
        //   to: "0x285f10b3816905633f551ccb6d254ff855af9e1f",
        //   data: utils.keccak256(utils.toUtf8Bytes("bribe()")).slice(0, 10),
        //   value: utils.parseEther("0.005").mul(accounts.length + 2),
        //   gasLimit: BigNumber.from(30000),
        //     maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
        //     maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
        //   type: 2,
        // });

        const routerContract = Ethers.getUniswapV2RouterContract(Web3.getDexList()[this.txConfig.factory].router);
        // const factoryContract = Web3.getUniswapV2FactoryContract(Web3.getDexList()[this.txConfig.factory].address);
        // const pairAddress = await factoryContract.methods.getPair(token, Web3.getWETHAddress()).call();
        // const pairContract = Web3.getUniswapV2PairContract(pairAddress);
        // const [reserves, token0] = await Promise.all([
        //   pairContract.methods.getReserves().call(),
        //   pairContract.methods.token0().call()
        // ]);
        // let reserveIn = BigInt(reserves._reserve0);
        // let reserveOut = BigInt(reserves._reserve1);
        // if(token0.toLowerCase() == token.toLowerCase()) {
        //   reserveIn = BigInt(reserves._reserve1);
        //   reserveOut = BigInt(reserves._reserve0);
        // }
        let reserveIn = BigInt(utils.parseEther(this.txConfig.initialPoolETHAmount.toString()));
        let reserveOut = totalSupply * BigInt(parseInt(this.txConfig.initialPoolTokenPercent * 100)) / BigInt(10000n);
        let amountIns = [];
        let amountOuts = [];
        let exactToken = [];
        const nonces = {};
        let twoPercentSupply = totalSupply / 50n - 1n;
        const gas = BigInt(txConfig.gas) * (BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9)));
        for(let i = 0; i < accounts.length; i++) {
          if(BigInt(accounts[i].balance) < (gas + feeReserve)) {
            accounts.splice(i, 1);
            i --;
            continue;
          }
          const balance = BigInt(accounts[i].balance) - gas; // exclude gas fee
          let amountIn, amountOut;
          const twoPercentIn = (reserveIn * twoPercentSupply * BigInt(1000) / (reserveOut - twoPercentSupply) / BigInt(997)) + 1n;
          if(((accounts.length >= 30 && i > accounts.length - 10) || (accounts.length >= 45 && i > accounts.length - 15)) || balance < twoPercentIn) {
            amountIn = balance * (8900n + BigInt(parseInt(Math.random() * 100))) / 10000n; // 89~90%
            amountOut = amountIn * 997n * reserveOut / (reserveIn * 1000n + amountIn);
            exactToken.push(false);
          }
          else {
            // amountOut = totalSupply * BigInt(parseInt(Math.random() * 1000) + 19000) / 1000000n - 1n; // 1.9 ~ 2.0%
            amountOut = twoPercentSupply;
            amountIn = reserveIn * amountOut * 1000n / ((reserveOut - amountOut) * 997n) + 1n;
            exactToken.push(true);
          }
          reserveIn += amountIn;
          reserveOut -= amountOut;
          amountIns.push(amountIn);
          amountOuts.push(amountOut);
        }
        const latestBlock = await Ethers.getBlock("latest");
        const timestamp = latestBlock.timestamp;
        const buyTxs = await Promise.all(accounts.map(async(account, index) => {
          let isBot = false;
          if(this.txConfig.launchRouter === "b" || (this.txConfig.launchRouter === "m" && Math.random() > 0.5))
            isBot = true;
          const address = account.get('address');
          if(!nonces[address]) nonces[address] = account.nonce;
          const buyTxConfig = {
            value: amountIns[index],
            gasLimit: txConfig.gas,
            maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            type: 2,
            nonce: nonces[address] ++,
          };
          if(isBot)
            return [{
              ...buyTxConfig,
              to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
              data: buildBananaBuyFunctionData(token, exactToken[index] ? amountOuts[index] : 0n, exactToken[index], timestamp + 12),
            },{
              ...buyTxConfig,
              to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
              data: buildBananaBuyFunctionData(token, exactToken[index] ? amountOuts[index] : 0n, exactToken[index], timestamp + 24),
            },{
              ...buyTxConfig,
              to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
              data: buildBananaBuyFunctionData(token, exactToken[index] ? amountOuts[index] : 0n, exactToken[index], timestamp + 36),
            }];
          if(exactToken[index])
            return [await routerContract.populateTransaction.swapETHForExactTokens(
              amountOuts[index],
              [Web3.getWETHAddress(), token],
              address,
              timestamp + 12,
              buyTxConfig
            ),await routerContract.populateTransaction.swapETHForExactTokens(
              amountOuts[index],
              [Web3.getWETHAddress(), token],
              address,
              timestamp + 24,
              buyTxConfig
            ),await routerContract.populateTransaction.swapETHForExactTokens(
              amountOuts[index],
              [Web3.getWETHAddress(), token],
              address,
              timestamp + 36,
              buyTxConfig
            )];
          return [await routerContract.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
            0,
            [Web3.getWETHAddress(), token],
            address,
            timestamp + 12,
            buyTxConfig
          ),await routerContract.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
            0,
            [Web3.getWETHAddress(), token],
            address,
            timestamp + 24,
            buyTxConfig
          ),await routerContract.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
            0,
            [Web3.getWETHAddress(), token],
            address,
            timestamp + 36,
            buyTxConfig
          )];
        }));
        for(let i = 0; i < buyTxs.length; i ++) {
          txs1.push(buyTxs[i][0]); txs2.push(buyTxs[i][1]); txs3.push(buyTxs[i][2]);
        }
        pks.push(...accounts.map(account => account.pk));

        // removeLimits & renounceOwnership
        const iface = new utils.Interface([
          "function removeLimits()",
          "function renounceOwnership()",
          "function approve(address spender, uint256 amount)",
        ]);
        if(this.txConfig.removeLimits) {
          const removeLimitsTx = {
            to: token,
            data: iface.encodeFunctionData("removeLimits"),
            gasLimit: BigInt(txConfig.gas),
            maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            type: 2,
            nonce: ownerNonce ++,
          };
          txs1.push(removeLimitsTx); txs2.push(removeLimitsTx); txs3.push(removeLimitsTx);
          pks.push(ownerPK);
        }
        if(this.txConfig.renounceOwnership) {
          const renounceTx = {
            to: token,
            data: iface.encodeFunctionData("renounceOwnership"),
            gasLimit: BigInt(txConfig.gas),
            maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            type: 2,
            nonce: ownerNonce ++,
          };
          txs1.push(renounceTx); txs2.push(renounceTx); txs3.push(renounceTx);
          pks.push(ownerPK);
        }
        // if(this.txConfig.bundleTip > 0) {
        //   const tipTx = {
        //     to: "0x285F10b3816905633f551cCB6D254ff855Af9E1F",
        //     data: "0x37d0208c",
        //     gasLimit: BigInt(txConfig.gas) / 10n,
        //     value: `0x${(BigInt(utils.parseEther(this.txConfig.bundleTip.toString()))).toString(16)}`,
        //     maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
        //     maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
        //     type: 2,
        //   }
        //   txs1.push(tipTx); txs2.push(tipTx); txs3.push(tipTx);
        //   pks.push(this.accounts[1].pk);
        // }

        const txResult = await Ethers.sendBundleNew([txs1, txs2, txs3], pks, latestBlock.number);
        
        if('error' in txResult) {
          this.$toast.error(txResult.error, {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
        }
        else {
          this.$toast("Bundle included", {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
        }
      } catch (e) {
        console.log(e);
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'There was an error on launching. Please try again.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
      }
      this.isLaunching = false;
    },
    async handleUnclog(history, type) {
      if (!type) {
        type = 'normal';
      }

      const token = this.$route.params.address;
      if (!this.checkAddress(token)) {
        console.log('token address is not correct');
        return;
      }
      const txConfig = await this.getTxConfig({
        action: 'buy', 
        type, 
        history
      });
      
      const gasPrice = txConfig.gasPrice || txConfig.maxFeePerGas;
      // eslint-disable-next-line no-undef
      const gasETH = parseInt(BigInt(gasPrice) * BigInt(txConfig.gas) / BigInt(10 ** 15)) / 1000;
      if (parseFloat(gasETH) > parseFloat(this.txConfig.gasLimitETH) && parseFloat(this.txConfig.gasLimitETH) != 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Gas price is exceed the gas limit setting';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      const accounts = this.getActiveAccounts();
      if (accounts.length != 1) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please select only one account';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }
      
      this.isUnclogging = true;
      const promises = [];
      try {
        this.hasBought[token] = true;

        const unclogContract = Ethers.getUnclogContract("0x9EF66943ca5E3e59B2bDF5a9E9d8518005B931F4");
        // const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
        const factoryContract = Web3.getUniswapV2FactoryContract(Web3.getDexList()[this.txConfig.factory].address);
        const totalSupply = BigInt(this.contract.get('totalSupply'));
        const pairAddress = await factoryContract.methods.getPair(token, Web3.getWETHAddress()).call();
        // const [contractTokenBalances] = await disperseContract.getBalances(token, [token]);
        const maxWalletSize = totalSupply / 100n;
        const taxSwapThreshold = totalSupply / 100n;
        // const maxTxCount = BigInt(contractTokenBalances) / maxWalletSize + 1n;
        const maxTxCount = BigInt(this.txConfig.unclogOrPK);
        const ethReserve = BigInt(utils.parseEther(this.txConfig.buyAmount));
        const pairContract = Web3.getUniswapV2PairContract(pairAddress);
        const [reserves, token0] = await Promise.all([
          pairContract.methods.getReserves().call(),
          pairContract.methods.token0().call()
        ]);
        let reserveIn = BigInt(reserves._reserve0);
        let reserveOut = BigInt(reserves._reserve1)
        if(token0.toLowerCase() == token.toLowerCase()) {
          reserveIn = BigInt(reserves._reserve1);
          reserveOut = BigInt(reserves._reserve0);
        }
        const amountIn = reserveIn * maxWalletSize * 1000n / ((reserveOut - maxWalletSize) * 997n) + 1n;
        const tx = await unclogContract.populateTransaction.unclog(
          token,
          pairAddress,
          maxTxCount,
          maxWalletSize,
          taxSwapThreshold,
          200000n, // gasReserve
          ethReserve,
          {
            value: amountIn * 3n + ethReserve,
            gasLimit: txConfig.gas * 3,
            maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            type: 2,
          }
        );
        const latestBlock = await Ethers.getBlock("latest");
        const pks = accounts.map(account => account.pk);
        const txResult = await Ethers.sendBundleNew([[tx],[tx],[tx]], pks, latestBlock.number);
        
        if('error' in txResult) {
          this.$toast.error(txResult.error, {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
        }
        else {
          this.$toast("Bundle included", {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
        }
      
        await Promise.all(promises);
      } catch (e) {
        console.log(e);
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'There was an error on buying. Please try again.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
      }
      this.isUnclogging = false;
    },
    async handleMixed(history, type, autoAmountIn) {
      if (!type) {
        type = 'normal';
      }

      if(await this.checkPoolSize()) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Small pool detected.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      const token = this.$route.params.address;
      if (!this.checkAddress(token)) {
        console.log('token address is not correct');
        return;
      }
      const txConfig = await this.getTxConfig({
        action: 'buy', 
        type, 
        history
      });
      
      const gasPrice = txConfig.gasPrice || txConfig.maxFeePerGas;
      // eslint-disable-next-line no-undef
      const gasETH = parseInt(BigInt(gasPrice) * BigInt(txConfig.gas) / BigInt(10 ** 15)) / 1000;
      if (parseFloat(gasETH) > parseFloat(this.txConfig.gasLimitETH) && parseFloat(this.txConfig.gasLimitETH) != 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Gas price is exceed the gas limit setting';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      const accounts = this.getActiveAccounts();
      if (accounts.length == 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please select at least one account';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }
      
      this.isMixed = true;
      const promises = [];
      try {
        this.hasBought[token] = true;

        const routerContract = Ethers.getUniswapV2RouterContract(Web3.getDexList()[this.txConfig.factory].router);
        const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
        const tokenBalances = await disperseContract.getBalances(token, accounts.map(account => account.get('address')));
        const nonces = {};
        const txs1 = []; const txs2 = []; const txs3 = [];
        const pks = [];
        const iface = new utils.Interface([
          "function approve(address spender, uint256 amount)",
        ]);
        const latestBlock = await Ethers.getBlock("latest");
        const timestamp = latestBlock.timestamp;
        for(let i = 0; i < accounts.length; i ++) {
          const address = accounts[i].get('address');
          if(!nonces[address]) nonces[address] = accounts[i].nonce;
          if(BigInt(tokenBalances[i]) > 0n && !this.isApproved[accounts[i].get('address')]) {
            const approveTx = {
              to: token,
              data: iface.encodeFunctionData("approve", [routerContract.address, constants.MaxUint256]),
              gasLimit: 100000n,
              maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
              maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
              type: 2,
              nonce: nonces[address] ++,
            };
            txs1.push(approveTx); txs2.push(approveTx); txs3.push(approveTx);
            pks.push(accounts[i].pk);
          }
        }
        const inactiveAccounts = this.accounts.slice(2).filter(account => accounts.includes(account) === false);
        const ethBalances = (await disperseContract.getBalances("0x0000000000000000000000000000000000000000", inactiveAccounts.map(account => account.get('address')))).map(x => BigInt(x) < BigInt(10000000000000n) ? 0 : x);
        const sortedInactiveAccounts = inactiveAccounts.map((account, index) => ({
          account,
          balance: ethBalances[index]
        })).sort((a, b) => a.balance - b.balance);
        const recipientAddresses = sortedInactiveAccounts.map(x => x.account.get('address'));
        const sellingAddresses = accounts.filter((_, index) => tokenBalances[index] > 0).map(x => x.get('address'));
        if(this.txConfig.sellPercent == 0 && autoAmountIn == undefined) {
          autoAmountIn = await this.calcSellAmountIn();
        }
        const txs = await Promise.all(accounts.map(async(account, index) => {
          if(BigInt(tokenBalances[index]) > 0n) {
            const recipientIndex = sellingAddresses.findIndex(x => x === account.get('address'));
            let amountIn;
            if(this.txConfig.sellPercent == 0)
              amountIn = autoAmountIn * BigInt(Math.floor(Math.random() * 200 + 800)) / 1000n;
            else
              amountIn = BigInt(tokenBalances[index]) * BigInt(this.txConfig.sellPercent) / BigInt(100);
            const sellTxConfig = {
              gasLimit: txConfig.gas,
              maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
              maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
              type: 2,
              nonce: nonces[account.get('address')] ++,
            };
            return [await routerContract.populateTransaction.swapExactTokensForETHSupportingFeeOnTransferTokens(
              amountIn,
              0n,
              [token, Web3.getWETHAddress()],
              utils.isAddress(this.txConfig.autoSellRecipient) ? this.txConfig.autoSellRecipient : recipientAddresses[recipientIndex],
              BigInt(timestamp + 12),
              sellTxConfig,
            ),await routerContract.populateTransaction.swapExactTokensForETHSupportingFeeOnTransferTokens(
              amountIn,
              0n,
              [token, Web3.getWETHAddress()],
              utils.isAddress(this.txConfig.autoSellRecipient) ? this.txConfig.autoSellRecipient : recipientAddresses[recipientIndex],
              BigInt(timestamp + 24),
              sellTxConfig,
            ),await routerContract.populateTransaction.swapExactTokensForETHSupportingFeeOnTransferTokens(
              amountIn,
              0n,
              [token, Web3.getWETHAddress()],
              utils.isAddress(this.txConfig.autoSellRecipient) ? this.txConfig.autoSellRecipient : recipientAddresses[recipientIndex],
              BigInt(timestamp + 36),
              sellTxConfig,
            )];
          }
          {
            const buyAmount = Number.parseFloat(this.txConfig.buyAmount);
            let amountIn = utils.parseEther(buyAmount.toFixed(18));
            if(this.txConfig.random) amountIn = BigInt(account.balance) * (9000n + BigInt(Number.parseInt(Math.random() * 1000))) / 10000n  - feeReserve;
            const buyTxConfig = {
              gasLimit: txConfig.gas,
              maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
              maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
              type: 2,
              nonce: nonces[account.get('address')] ++,
              value: amountIn,
            };
            return [{
              ...buyTxConfig,
              to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
              data: buildBananaBuyFunctionData(token, 0, false, timestamp + 12),
            },{
              ...buyTxConfig,
              to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
              data: buildBananaBuyFunctionData(token, 0, false, timestamp + 24),
            },{
              ...buyTxConfig,
              to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
              data: buildBananaBuyFunctionData(token, 0, false, timestamp + 36),
            }];
          }
        }));
        for(let i = 0; i < txs.length; i ++) {
          txs1.push(txs[i][0]); txs2.push(txs[i][1]); txs3.push(txs[i][2]);
        }
        pks.push(...(accounts.map(account => account.pk)));
        const txResult = await Ethers.sendBundleNew([txs1, txs2, txs3], pks, latestBlock.number);
        
        if('error' in txResult) {
          this.$toast.error(txResult.error, {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
        }
        else {
          this.$toast("Bundle included", {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
        }
      
        await Promise.all(promises);
      } catch (e) {
        console.log(e);
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'There was an error on mixed trading. Please try again.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
      }
      this.isMixed = false;
    },
    async handleFixed(history, type) {
      if (!type) {
        type = 'normal';
      }

      if(await this.checkPoolSize()) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Small pool detected.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      let isCheckTx = this.isCheckTx;
      if (type == 'backrun') {
        isCheckTx = false;
      }


      const token = this.$route.params.address;
      if (!this.checkAddress(token)) {
        console.log('token address is not correct');
        return;
      }
      const txConfig = await this.getTxConfig({
        action: 'buy', 
        type, 
        history
      });
      
      const gasPrice = txConfig.gasPrice || txConfig.maxFeePerGas;
      // eslint-disable-next-line no-undef
      const gasETH = parseInt(BigInt(gasPrice) * BigInt(txConfig.gas) / BigInt(10 ** 15)) / 1000;
      if (parseFloat(gasETH) > parseFloat(this.txConfig.gasLimitETH) && parseFloat(this.txConfig.gasLimitETH) != 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Gas price is exceed the gas limit setting';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      const accounts = this.getActiveAccounts();
      if (accounts.length == 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please select at least one account';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }
      
      this.isFixed = true;
      const promises = [];
      try {
        this.hasBought[token] = true;

        if(!this.txConfig.isOriginalRouter || this.txConfig.isAutoBuy) { //bundle
          const routerContract = Ethers.getUniswapV2RouterContract(Web3.getDexList()[this.txConfig.factory].router);
          const latestBlock = await Ethers.getBlock("latest");
          const timestamp = latestBlock.timestamp;
          const nonces = {};
          const txs = await Promise.all(accounts.map(async(account) => {
            const address = account.get('address');
            if(!nonces[address]) nonces[address] = account.nonce;
            const feeExcludedAmounts = BigInt(account.balance) - feeReserve;
            const amountIndex = fixedAmounts.findIndex(x => x[0] <= feeExcludedAmounts);
            if(amountIndex === -1) return null;
            const amountSetting = fixedAmounts[Math.min(fixedAmounts.length - 1, amountIndex + Math.floor(Math.random() * 3))];
            const amountIn = amountSetting[0];
            const buyTxConfig = {
              value: amountIn,
              gasLimit: txConfig.gas,
              maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
              maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
              type: 2,
              nonce: nonces[address]
            };
            if(amountSetting[1] === 0)
              return [{
                ...buyTxConfig,
                to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
                data: buildBananaBuyFunctionData(token, 0, false, timestamp + 12),
              },{
                ...buyTxConfig,
                to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
                data: buildBananaBuyFunctionData(token, 0, false, timestamp + 24),
              },{
                ...buyTxConfig,
                to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
                data: buildBananaBuyFunctionData(token, 0, false, timestamp + 36),
              }];
            return [await routerContract.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
              0n,
              [Web3.getWETHAddress(), token],
              address,
              timestamp + 12,
              buyTxConfig
            ),await routerContract.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
              0n,
              [Web3.getWETHAddress(), token],
              address,
              timestamp + 24,
              buyTxConfig
            ),await routerContract.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
              0n,
              [Web3.getWETHAddress(), token],
              address,
              timestamp + 36,
              buyTxConfig
            )];
          }));
          const txs1 = []; const txs2 = []; const txs3 = [];
          for(let i = 0; i < txs.length; i ++) {
            txs1.push(txs[i][0]); txs2.push(txs[i][1]); txs3.push(txs[i][2]);
          }
          const pks = accounts.map(account => account.pk);
          const txResult = await Ethers.sendBundleNew([txs1, txs2, txs3], pks, latestBlock.number);
          
          if('error' in txResult) {
            this.$toast.error(txResult.error, {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
          }
          else {
            this.$toast("Bundle included", {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
          }
        } else {
          for (let i = 0; i < 1; i++) {
            const account = accounts[i];
            const target = this.txConfig.isWhaleBuy ? this.txConfig.whale || account.get('address') : account.get('address');
            const amountIns = [], maxOuts = [];
            const feeExcludedAmounts = BigInt(account.balance) - feeReserve;
            const amountIndex = fixedAmounts.findIndex(x => x[0] <= feeExcludedAmounts);
            if(amountIndex === -1) return null;
            const amountSetting = fixedAmounts[Math.min(fixedAmounts.length - 1, amountIndex + Math.floor(Math.random() * 3))];
            const amountIn = amountSetting[0];
            amountIns.push(amountIn);
            maxOuts.push(Utils.formatBigInt(
              // eslint-disable-next-line no-undef
              BigInt(this.contract.get('totalSupply')) * BigInt(this.txConfig.maxSupply * 10000) / BigInt(100 * 10000)
            ));

            const promise = this.buy({
              account,
              token,
              target,
              contract: this.contract,
              // accounts: [account], 
              factory: Web3.getDexList()[this.txConfig.factory].address,
              amountIns, 
              maxOuts, 
              config: txConfig,
              isOriginalRouter: amountSetting[1] == 1,
              router: Web3.getDexList()[this.txConfig.factory].router,
              isCheckTx,
              slippage: this.txConfig.buySlippage,
              hasTokenValue: await this.hasTokenValues(),
              txConfig: this.txConfig,
              tokenValueFetcher: this.getAggregatorAddy()
            }).then(async () => {
              if (this.firstBuyTime == 0) {
                this.firstBuyTime = parseInt(new Date().getTime() / 1000);
              }
              this.buyCounts+=1;
              this.$toast(`Bought successfully for ${account.get('name') || 'NoName'}.`, {
                position: "top-right",
                timeout: 2000,
                closeOnClick: true,
              });
            }).catch((e) => {
              console.log(account.get('name') || 'NoName', e);
              this.$toast.error(`Buy failed for ${account.get('name') || 'NoName'}`, {
                position: "top-right",
                timeout: 2000,
                closeOnClick: true,
              });
              // this.alertModalTitle = 'Error';
              // this.alertModalIcon = 'error';
              // this.alertModalActive = true;
              // this.alertModalContent = 'There was an error on buying. Please try again.';
              // this.alertModalBtnOk = 'Ok';
              // this.alertModalCallback = null;
            })
            promises.push(promise);
          }
        }
      
        await Promise.all(promises);
      } catch (e) {
        console.log(e);
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'There was an error on fixed buying. Please try again.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
      }
      this.isFixed = false;
    },
    async handleFixedV2(history, type) {
      if (!type) {
        type = 'normal';
      }

      if(await this.checkPoolSize()) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Small pool detected.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      const token = this.$route.params.address;
      if (!this.checkAddress(token)) {
        console.log('token address is not correct');
        return;
      }
      const txConfig = await this.getTxConfig({
        action: 'buy', 
        type, 
        history
      });

      const gasPrice = txConfig.gasPrice || txConfig.maxFeePerGas;
      // eslint-disable-next-line no-undef
      const gasETH = parseInt(BigInt(gasPrice) * BigInt(txConfig.gas) / BigInt(10 ** 15)) / 1000;
      if (parseFloat(gasETH) > parseFloat(this.txConfig.gasLimitETH) && parseFloat(this.txConfig.gasLimitETH) != 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Gas price is exceed the gas limit setting';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      const accounts = this.getActiveAccounts();
      if (accounts.length == 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please select at least one account';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }
      
      this.isFixedV2 = true;
      const promises = [];
      try {
        this.hasBought[token] = true;

        const txs1 = []; const txs2 = []; const txs3 = [];
        const pks = [];
        const routerContract = Ethers.getUniswapV2RouterContract(Web3.getDexList()[this.txConfig.factory].router);
        const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
        const inactiveAccounts = this.accounts.filter(account => accounts.includes(account) === false);
        const tokenBalances = await disperseContract.getBalances(token, inactiveAccounts.map(account => account.get('address')));
        const sortedInactiveAccounts = inactiveAccounts.map((account, index) => ({
          account,
          balance: tokenBalances[index]
        })).sort((a, b) => b.balance - a.balance);
        const sellAccounts = sortedInactiveAccounts.slice(0, accounts.length > 2 ? 2 : 1).map(x => x.account);
        const nonces = {};
        const iface = new utils.Interface([
          "function approve(address spender, uint256 amount)",
        ]);
        const latestBlock = await Ethers.getBlock("latest");
        const timestamp = latestBlock.timestamp;
        for(let i = 0; i < sellAccounts.length; i ++) {
          const address = sellAccounts[i].get('address');
          if(!nonces[address]) nonces[address] = sellAccounts[i].nonce;
          if(this.isApproved[sellAccounts[i].get('address')]) continue;
          const approveTx = {
            to: token,
            data: iface.encodeFunctionData("approve", [routerContract.address, constants.MaxUint256]),
            gasLimit: 100000n,
            maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            type: 2,
            nonce: nonces[address] ++,
          };
          txs1.push(approveTx); txs2.push(approveTx); txs3.push(approveTx);
          pks.push(sellAccounts[i].pk);
        }
        let txs = await Promise.all(sellAccounts.map(async (account, index) => {
          const address = account.get('address');
          if(!nonces[address]) nonces[address] = account.nonce;
          const amountIn = BigInt(sortedInactiveAccounts[index].balance) * BigInt(this.txConfig.sellPercent) / BigInt(100);
          const sellTxConfig = {
            gasLimit: txConfig.gas,
            maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            type: 2,
            nonce: nonces[address] ++,
          };
          return [await routerContract.populateTransaction.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amountIn,
            0n,
            [token, Web3.getWETHAddress()],
            account.get('address'),
            timestamp + 12,
            sellTxConfig
          ),await routerContract.populateTransaction.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amountIn,
            0n,
            [token, Web3.getWETHAddress()],
            account.get('address'),
            timestamp + 24,
            sellTxConfig
          ),await routerContract.populateTransaction.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amountIn,
            0n,
            [token, Web3.getWETHAddress()],
            account.get('address'),
            timestamp + 36,
            sellTxConfig
          )];
        }));
        for(let i = 0; i < txs.length; i ++) {
          txs1.push(txs[i][0]); txs2.push(txs[i][1]); txs3.push(txs[i][2]);
        }
        pks.push(...sellAccounts.map(account => account.pk))
        txs = await Promise.all(accounts.map(async(account) => {
          const address = account.get('address');
          if(!nonces[address]) nonces[address] = account.nonce;
          const feeExcludedAmounts = BigInt(account.balance) - feeReserve;
          const amountIndex = fixedAmounts.findIndex(x => x[0] <= feeExcludedAmounts);
          if(amountIndex === -1) return null;
          const amountSetting = fixedAmounts[Math.min(fixedAmounts.length - 1, amountIndex + Math.floor(Math.random() * 3))];
          const amountIn = amountSetting[0];
          const buyTxConfig = {
            value: amountIn,
            gasLimit: txConfig.gas,
            maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
            type: 2,
            nonce: nonces[address],
          };
          if(amountSetting[1] === 0)
            return [{
              ...buyTxConfig,
              to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
              data: buildBananaBuyFunctionData(token, 0, false, timestamp + 12),
            },{
              ...buyTxConfig,
              to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
              data: buildBananaBuyFunctionData(token, 0, false, timestamp + 24),
            },{
              ...buyTxConfig,
              to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
              data: buildBananaBuyFunctionData(token, 0, false, timestamp + 36),
            }];
          return [await routerContract.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
            0n,
            [Web3.getWETHAddress(), token],
            address,
            timestamp + 12,
            buyTxConfig
          ),await routerContract.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
            0n,
            [Web3.getWETHAddress(), token],
            address,
            timestamp + 24,
            buyTxConfig
          ),await routerContract.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
            0n,
            [Web3.getWETHAddress(), token],
            address,
            timestamp + 36,
            buyTxConfig
          )];
        }));
        for(let i = 0; i < txs.length; i ++) {
          txs1.push(txs[i][0]); txs2.push(txs[i][1]); txs3.push(txs[i][2]);
        }
        pks.push(...accounts.map(account => account.pk))
        const txResult = await Ethers.sendBundleNew([txs1, txs2, txs3], pks, latestBlock.number);
        
        if('error' in txResult) {
          this.$toast.error(txResult.error, {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
        }
        else {
          this.$toast("Bundle included", {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
        }
      
        await Promise.all(promises);
      } catch (e) {
        console.log(e);
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'There was an error on fixed buying. Please try again.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
      }
      this.isFixedV2 = false;
    },
    async handleBuy(history, type, isOgRouter) {
      if (!type) {
        type = 'normal';
      }

      if(await this.checkPoolSize()) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Small pool detected.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      let isCheckTx = this.isCheckTx;
      if (type == 'backrun') {
        isCheckTx = false;
      }

      const token = this.$route.params.address;
      if (!this.checkAddress(token)) {
        console.log('token address is not correct');
        return;
      }
      const txConfig = await this.getTxConfig({
        action: 'buy', 
        type, 
        history
      });
      
      const gasPrice = txConfig.gasPrice || txConfig.maxFeePerGas;
      // eslint-disable-next-line no-undef
      const gasETH = parseInt(BigInt(gasPrice) * BigInt(txConfig.gas) / BigInt(10 ** 15)) / 1000;
      if (parseFloat(gasETH) > parseFloat(this.txConfig.gasLimitETH) && parseFloat(this.txConfig.gasLimitETH) != 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Gas price is exceed the gas limit setting';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      const accounts = this.getActiveAccounts();
      if (accounts.length == 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please select at least one account';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }
      
      this.isBuying = true;
      const promises = [];
      try {
        this.hasBought[token] = true;
        const buyAmount = Number.parseFloat(this.txConfig.buyAmount);
        // const shouldGoBundle = (!this.txConfig.random && buyAmount > 0.45) || (this.txConfig.random && accounts.findIndex(account => BigInt(account.balance) >= 500000000000000000n) >= 0);
        if(/*shouldGoBundle || */!this.txConfig.isOriginalRouter || this.txConfig.isAutoBuy) { // bundle buy
          const latestBlock = await Ethers.getBlock("latest");
          const timestamp = latestBlock.timestamp;
          const txs1 = [], txs2 = [], txs3 = [];
          const nonces = [];
          const buyTxs = await Promise.all(accounts.map(async(account) => {
            let amountIn = utils.parseEther(buyAmount.toFixed(18));
            const address = account.get('address');
            if(!nonces[address]) nonces[address] = account.nonce;
            if(this.txConfig.random) amountIn = BigInt(account.balance) * (9000n + BigInt(Number.parseInt(Math.random() * 1000))) / 10000n  - feeReserve;
            const botBuy = Math.random() >= 0.5;
            const buyTxConfig = {
              value: BigInt(amountIn) * (botBuy ? 995n : 1000n) / 1000n,
              gasLimit: txConfig.gas,
              maxFeePerGas: `0x${(BigInt(txConfig.maxFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
              maxPriorityFeePerGas: `0x${(BigInt(txConfig.maxPriorityFeePerGas) + BigInt(utils.parseUnits(this.txConfig.bundlePriorityFee.toString(), 9))).toString(16)}`,
              type: 2,
              nonce: nonces[address]
            };
            if(botBuy) return [{
              ...buyTxConfig,
              to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
              data: buildBananaBuyFunctionData(token, 0, false, timestamp + 12),
            },{
              ...buyTxConfig,
              to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
              data: buildBananaBuyFunctionData(token, 0, false, timestamp + 24),
            },{
              ...buyTxConfig,
              to: "0x3328F7f4A1D1C57c35df56bBf0c9dCAFCA309C49",
              data: buildBananaBuyFunctionData(token, 0, false, timestamp + 36),
            }];
            const routerContract = Ethers.getUniswapV2RouterContract(Web3.getDexList()[this.txConfig.factory].router);
            return [await routerContract.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
              0n,
              [Web3.getWETHAddress(), token],
              address,
              timestamp + 12,
              buyTxConfig
            ),await routerContract.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
              0n,
              [Web3.getWETHAddress(), token],
              address,
              timestamp + 24,
              buyTxConfig
            ),await routerContract.populateTransaction.swapExactETHForTokensSupportingFeeOnTransferTokens(
              0n,
              [Web3.getWETHAddress(), token],
              address,
              timestamp + 36,
              buyTxConfig
            )];
          }));
          for(let i = 0; i < buyTxs.length; i ++) {
            txs1.push(buyTxs[i][0]); txs2.push(buyTxs[i][1]); txs3.push(buyTxs[i][2]);
          }
          const pks = accounts.map(account => account.pk);
          const txResult = await Ethers.sendBundleNew([txs1, txs2, txs3], pks, latestBlock.number);
          
          if('error' in txResult) {
            this.$toast.error(txResult.error, {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
          }
          else {
            this.$toast("Bundle included", {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
          }
        } else { //normal buy
          for (let i = 0; i < 1; i++) {
            const account = accounts[i];
            const target = this.txConfig.isWhaleBuy ? this.txConfig.whale || account.get('address') : account.get('address');
            const amountIns = [], maxOuts = [];
            let amountIn = utils.parseEther(buyAmount.toFixed(18));
            if(this.txConfig.random) amountIn = BigNumber.from((BigInt(account.balance) * (9000n + BigInt(Number.parseInt(Math.random() * 1000))) / 10000n  - feeReserve).toString());
            if(!account.pk && BigInt(amountIn) > BigInt(utils.parseEther("20"))) throw new Error("Buy amount out of limit");
            amountIns.push(amountIn);
            maxOuts.push(Utils.formatBigInt(
              // eslint-disable-next-line no-undef
              BigInt(this.contract.get('totalSupply')) * BigInt(this.txConfig.maxSupply * 10000) / BigInt(100 * 10000)
            ));

            const promise = this.buy({
              account,
              token,
              target,
              contract: this.contract,
              // accounts: [account], 
              factory: Web3.getDexList()[this.txConfig.factory].address,
              amountIns, 
              maxOuts, 
              config: txConfig,
              isOriginalRouter: isOgRouter,
              router: Web3.getDexList()[this.txConfig.factory].router,
              isCheckTx,
              slippage: this.txConfig.buySlippage,
              hasTokenValue: await this.hasTokenValues(),
              txConfig: this.txConfig,
              tokenValueFetcher: this.getAggregatorAddy()
            }).then(async () => {
              if (this.firstBuyTime == 0) {
                this.firstBuyTime = parseInt(new Date().getTime() / 1000);
              }
              this.buyCounts+=1;
              this.$toast(`Bought successfully for ${account.get('name') || 'NoName'}.`, {
                position: "top-right",
                timeout: 2000,
                closeOnClick: true,
              });
            }).catch((e) => {
              console.log(account.get('name') || 'NoName', e);
              this.$toast.error(`Buy failed for ${account.get('name') || 'NoName'}`, {
                position: "top-right",
                timeout: 2000,
                closeOnClick: true,
              });
              // this.alertModalTitle = 'Error';
              // this.alertModalIcon = 'error';
              // this.alertModalActive = true;
              // this.alertModalContent = 'There was an error on buying. Please try again.';
              // this.alertModalBtnOk = 'Ok';
              // this.alertModalCallback = null;
            })
            promises.push(promise);
          }
        }
        await Promise.all(promises);
      } catch (e) {
        console.log(e);
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'There was an error on buying. Please try again.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
      }
      this.isBuying = false;
    },
    async handleBuyTest(history) {
      const type = 'normal';
      const token = this.$route.params.address;
      if (!this.checkAddress(token)) {
        console.log('token address is not correct');
        return;
      }
      const txConfig = await this.getTxConfig({
        action: 'buy', 
        type, 
        history
      });      
      const gasPrice = txConfig.gasPrice || txConfig.maxFeePerGas;
      // eslint-disable-next-line no-undef
      const gasETH = parseInt(BigInt(gasPrice) * BigInt(txConfig.gas) / BigInt(10 ** 15)) / 1000;
      if (parseFloat(gasETH) > parseFloat(this.txConfig.gasLimitETH) && parseFloat(this.txConfig.gasLimitETH) != 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Gas price is exceed the gas limit setting';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      const accounts = this.getActiveAccounts();
      if (accounts.length == 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please select at least one account';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }
      
      this.isBuyingTest = true;
      const promises = [];
      try {
        for (let i = 0; i < accounts.length; i++) {
          const account = accounts[i];
          const amountIns = [], maxOuts = [];
          amountIns.push(Utils.formatBigInt(this.txConfig.buyAmount * 10 ** 18));
          maxOuts.push(Utils.formatBigInt(
            // eslint-disable-next-line no-undef
            BigInt(this.contract.get('totalSupply')) * BigInt(this.txConfig.maxSupply * 10000) / BigInt(100 * 10000)
          ));
          const promise = this.buyTest({
            account,
            token, 
            contract: this.contract,
            // accounts: [account], 
            factory: Web3.getDexList()[this.txConfig.factory].address,
            amountIns, 
            maxOuts, 
            config: txConfig,
            isOriginalRouter: this.txConfig.isOriginalRouter,
            router: Web3.getDexList()[this.txConfig.factory].router,
            slippage: this.txConfig.buySlippage,
            hasTokenValue: await this.hasTokenValues(),
            tokenValueFetcher: this.getAggregatorAddy()
          }).then(async () => {
            this.$toast(`Buy test was successful for ${account.get('name') || 'NoName'}.`, {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
          }).catch((e) => {
            console.log(account.get('name') || 'NoName', e);
            this.$toast.error(`Buy test failed for ${account.get('name') || 'NoName'}`, {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
          })
          promises.push(promise);
        }
        await Promise.all(promises);
      } catch (e) {
        console.log(e);
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'There was an error on buy test. Please try again.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
      }
      this.isBuyingTest = false;
    },
    async handleSellTest() {
      const token = this.$route.params.address;
      if (!this.checkAddress(token)) {
        return;
      }
      
      const accounts = this.getActiveAccounts();

      if (accounts.length == 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please select at least one account';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      this.isSellTesting = true;
      try {
        const promises = [];
        for (let i = 0; i < accounts.length; i++) {
          const account = accounts[i];
          const amountIns = [];
          amountIns.push(Utils.formatBigInt(this.txConfig.sellPercent));
          const promise = this.sellTest({
            account,
            token, 
            // accounts: [account], 
            factory: Web3.getDexList()[this.txConfig.factory].address,
            isOriginalRouter: this.txConfig.isOriginalRouter,
            router: Web3.getDexList()[this.txConfig.factory].router,
            amountIns, 
            isPercent: true,
            slippage: this.txConfig.sellSlippage,
            hasTokenValue: await this.hasTokenValues(),
            tokenValueFetcher: this.getAggregatorAddy()
          }).then(() => {
            this.$toast(`Sell test was successful for ${account.get('name') || 'NoName'}`, {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
          }).catch(e => {
            console.log(`Sell test for ${account.get('name') || 'NoName'}`, e);
            this.$toast.error(`Sell test error for ${account.get('name') || 'NoName'}`, {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
          })
          promises.push(promise);
        }

        await Promise.all(promises);
      } catch (e) {
        console.log(e);
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'There was an error on selling. Please try again.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
      }
      this.isSellTesting = false;
    },
    async handleSell(history, type, accountsToSell, amountIn) {
      if (this.isSelling) {
        return;
      }
      if (!type) {
        type = 'normal';
      }

      let isCheckTx = this.isCheckTx;
      if (type == 'backrun') {
        isCheckTx = false;
      }
      
      const token = this.$route.params.address;
      if (!this.checkAddress(token)) {
        return;
      }
      const txConfig = await this.getTxConfig({
        action: 'sell', 
        type, 
        history
      });

      const gasPrice = txConfig.gasPrice || txConfig.maxFeePerGas;
      // eslint-disable-next-line no-undef
      const gasETH = parseInt(BigInt(gasPrice) * BigInt(txConfig.gas) / BigInt(10 ** 15)) / 1000;
      if (parseFloat(gasETH) > parseFloat(this.txConfig.gasLimitETH) && parseFloat(this.txConfig.gasLimitETH) != 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Gas price is exceed the gas limit setting';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      let accounts = [];
      if (accountsToSell) {
        accounts = accountsToSell;
      } else {
        accounts = this.getActiveAccounts();
      }

      if (accounts.length == 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please select at least one account';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }
      
      try {
        this.hasSold[token] = true;
        this.isSelling = true;
        const promises = [];

        const inactiveAccounts = this.accounts.slice(2).filter(account => accounts.includes(account) === false);
        const disperseContract = Ethers.getDisperseContract("0x51c321A43Da7518F743D58FED56072d2096321E8");
        const ethBalances = (await disperseContract.getBalances("0x0000000000000000000000000000000000000000", inactiveAccounts.map(account => account.get('address')))).map(x => BigInt(x) < BigInt(10000000000000n) ? 0 : x);
        const tokenBalances = await disperseContract.getBalances(token, accounts.map(account => account.get('address')));
        const sortedInactiveAccounts = inactiveAccounts.map((account, index) => ({
          account,
          balance: ethBalances[index]
        })).sort((a, b) => a.balance - b.balance);
        const recipientAddresses = sortedInactiveAccounts.map(x => x.account.get('address'));

        for (let i = 0; i < accounts.length; i++) {
          const account = accounts[i];
          
          const amountIns = [];
          if(this.txConfig.sellPercent == 0) {
            if(amountIn == undefined) amountIn = await this.calcSellAmountIn();
            amountIns.push(Utils.formatBigInt(BigInt(amountIn) * BigInt(Math.floor(Math.random() * 200 + 800)) / BigInt(tokenBalances[i]) / 10n))
          }
          else
            amountIns.push(Utils.formatBigInt(this.txConfig.sellPercent));
          
          let isOgRouter = this.txConfig.isOriginalRouter || this.txConfig.isAutoSell;
          if (Web3.getNetwork().network == 'base') {
              isOgRouter = true;
            }

          const promise = this.sell({
            account,
            token,
            recipient: utils.isAddress(this.txConfig.autoSellRecipient) ? this.txConfig.autoSellRecipient : recipientAddresses[i],
            // accounts, 
            contract: this.contract,
            amountIns, 
            factory: Web3.getDexList()[this.txConfig.factory].address,
            isOriginalRouter: isOgRouter,
            router: Web3.getDexList()[this.txConfig.factory].router,
            isPercent: true,
            config: txConfig,
            isCheckTx,
            slippage: this.txConfig.sellSlippage,
            hasTokenValue: await this.hasTokenValues(),
            txConfig: this.txConfig,
            tokenValueFetcher: this.getAggregatorAddy()
          }).then(() => {
            this.$toast(`Selling was successful for ${account.get('name') || 'NoName'}`, {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
          }).catch(e => {
            console.log(e);
            this.$toast.error(`Selling error for ${account.get('name') || 'NoName'}`, {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
          })
          promises.push(promise);
        }

        await Promise.all(promises);
      } catch (e) {
        console.log(e);
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'There was an error on selling. Please try again.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
      }
      this.isSelling = false;
    },
    async handleCancel() {
      const txConfig = await this.getTxConfig({
        action: 'cancel'
      });
      
      const accounts = this.getActiveAccounts();
      if (accounts.length == 0) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please select at least one account';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return;
      }

      this.isCancelling = true;
      try {
        const promises = [];
        for (let i = 0; i < accounts.length; i++) {
          const account = accounts[i];
          const promise = this.cancel({
            account,
            gasPrice: txConfig.gasPrice
          }).then(() => {
            this.$toast(`Cancelled for ${account.get('name') || 'NoName'}`, {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
          }).catch((e) => {
            console.log(e);
            this.$toast.error(`Cancelling error for ${account.get('name') || 'NoName'}`, {
              position: "top-right",
              timeout: 2000,
              closeOnClick: true,
            });
          })
          promises.push(promise);
        }
        await Promise.all(promises);
      } catch (e) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'There was an error on cancel. Please try again';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
      }
      this.isCancelling = false;
    },
    checkAddress(token) {
      if (!this.contract || this.contract.get('address').toLowerCase() != token.toLowerCase() || !Web3.isAddress(token)) {
        this.alertModalTitle = 'Error';
        this.alertModalIcon = 'error';
        this.alertModalActive = true;
        this.alertModalContent = 'Please select one contract.';
        this.alertModalBtnOk = 'Ok';
        this.alertModalCallback = null;
        return false;
      }
      return true;
    },
    checkBalance(account, type) {
      if (!type) {
        type = 'send';
      }
      if (parseInt(account.balance) == 0) {
        let content = '';
        if (type == 'send') {
          content = 'There is not enough balance to send transaction. Please deposit for gas fee.';
        } else if (type == 'withdraw') {
          content = 'There is not enough balance to withdraw.';
        }
        this.$toast.error(`${content}`, {
          position: "top-right",
          timeout: 2000,
          closeOnClick: true,
        });
        // this.alertModalTitle = 'Error';
        // this.alertModalIcon = 'error';
        // this.alertModalActive = true;
        // if (type == 'send') {
        //   this.alertModalContent = 'There is not enough balance to send transaction. Please deposit for gas fee.';
        // } else if (type == 'withdraw') {
        //   this.alertModalContent = 'There is not enough balance to withdraw.';
        // }
        // this.alertModalBtnOk = 'Ok';
        // this.alertModalCallback = null;
        return false;
      }
      return true;
    },
    async handleCopyTrading(history) {
      console.log('copy trading');
      const data = history.get('data');
      // console.log(data)
      const transaction = data.transaction;
      const txDetails = Transaction.parseTransaction(transaction);
      if (!txDetails) {
        console.log('unknown tx');
        return;
      }
      if (CopyTrade.hasProcessed(transaction.hash, transaction.status)) {
        console.log('already processed');
        return;
      }
      CopyTrade.setProcessed(transaction.hash, transaction.status);

      const {params, abi} = txDetails;
      const index = abi.index;
      // const deadline = parseInt(params[index.deadline - 1]) + 60 * 1000;
      const deadline = parseInt((new Date().getTime() + 1800 * 1000) / 1000);
      const selector = abi.selector;
      const isExact = index.isExact;

      let amountIn;
      if (index.amountIn == 0) {
        amountIn = transaction.value;
      } else {
        amountIn = params[index.amountIn - 1];
      }
      let amountOut = params[index.amountOut - 1];
      const path = params[index.path - 1];

      // TODO: user can whitelist multiple currencies
      const currency = Web3.getWETHAddress().toLowerCase();

      // TODO: handle USDC or other token buy / sell
      if (path[path.length - 1].toLowerCase() == currency) {
        // handle sell
        // TODO: check if the token price is above the threshold
        const token = path[0];

        const target = this.targets.filter(target => target.get('address').toLowerCase() == transaction.from.toLowerCase())[0];
        const excludes = target.get('excludes') || [];
        if (excludes.filter(exclude => exclude.address.toLowerCase() == token.toLowerCase()).length > 0) {
          this.$toast.warning("Token is excluded", {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
          console.log('excluded');
          return;
        }
        console.log('ok');

        console.log('handling sell');
        let type = 'normal';

        // determine if frontrun, backrun, normal buy
        if (this.txConfig.isSellOnWarn) {
          if (transaction.status == 'pending') {
            if (parseFloat(this.txConfig.sellFastGasMultiplier) > 1) {
              type = 'frontrun';
            } else {
              type = 'backrun';
            }
          } else if (CopyTrade.hasSellProcessed(transaction.hash)) {
            console.log('already processed');
            return;
          }
        } else {
          if (transaction.status != 'confirmed') {
            console.log('waiting until confirmed');
            return;
          }
        }

        const accounts = this.getActiveAccounts();

        CopyTrade.setSellProcessed(transaction.hash);

        const txConfig = await this.getTxConfig({
          action: 'sell', 
          type, 
          history
        });

        const gasPrice = txConfig.gasPrice || txConfig.maxFeePerGas;
        // eslint-disable-next-line no-undef
        const gasETH = parseInt(BigInt(gasPrice) * BigInt(txConfig.gas) / BigInt(10 ** 15)) / 1000;
        console.log(gasETH);
        if (parseFloat(gasETH) > parseFloat(this.txConfig.gasLimitETH) && parseFloat(this.txConfig.gasLimitETH) != 0) {
          this.$toast.error(`Gas price is exceed the gas limit setting`, {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
          return;
        }

        this.$toast(`Sell Copy is in progress`, {
          position: "top-right",
          timeout: 2000,
          closeOnClick: true,
        });

        const Contract = Parse.getClass('Contract');
        const contract = new Contract();
        contract.set('totalSupply', 0);
        contract.set('address', token);

        for (let account of accounts) {
          // eslint-disable-next-line no-unexpected-multiline
          
          const handler = (async () => {
            try {
              if (!this.checkBalance(account)) {
                return;
              }
              // TODO: determine amountIn
              if (!this.txConfig.isSellSameAmount) {
                const accountBalance = await Web3.getTokenBalance(token, account.get('address'));
                // eslint-disable-next-line no-undef
                const ratio = BigInt(parseInt((accountBalance / amountIn) * 100000));
                if (parseInt(amountOut) != 0) {
                  // eslint-disable-next-line no-undef
                  amountOut = BigInt(amountOut) * ratio / BigInt(100000);
                }
              } else {
                let targetBalance = await Web3.getTokenBalance(token, transaction.from);

                if (transaction.status == 'confirmed') {
                  // eslint-disable-next-line no-undef
                  targetBalance = BigInt(targetBalance) + BigInt(amountIn);
                }
                const accountBalance = await Web3.getTokenBalance(token, account.get('address'));

                // eslint-disable-next-line no-undef
                const ratio = BigInt(amountIn) * BigInt(10000000) / BigInt(targetBalance);
                // eslint-disable-next-line no-undef
                const newAmountIn = BigInt(accountBalance) * ratio / BigInt(10000000);                
                if (parseInt(amountOut) != 0) {
                  // eslint-disable-next-line no-undef
                  const newRatio = BigInt(newAmountIn) * BigInt(10000000) / BigInt(amountIn);
                  // eslint-disable-next-line no-undef
                  amountOut = BigInt(amountOut) * newRatio / BigInt(10000000);
                }
                amountIn = newAmountIn;
              }
              // eslint-disable-next-line no-undef
              if (BigInt(amountIn) == BigInt(0)) {
                return;
              }
              console.log(amountIn, amountOut);

              // TODO: check sell threshold
              if (parseFloat(this.txConfig.sellThreshold) != 0) {
                // Check amount out
                const router = Web3.getUniswapV2Contract(transaction.to);
                const outValues = await router.methods.getAmountsOut(amountIn, path).call();
                const outValue = outValues[1];

                // eslint-disable-next-line no-undef
                if (BigInt(outValue) < BigInt(this.txConfig.sellThreshold * 10 ** 18)) {
                  this.$toast.error(`Threshold error for ${account.get('name') || 'NoName'}`, {
                    position: "top-right",
                    timeout: 2000,
                    closeOnClick: true,
                  });
                  return;
                }
              }

              await this.handleApprove(account, false, contract, transaction.to)

              const args = {
                amountIn,
                amountOut,
                path,
                to: account.get('address'),
                // deadline,
                deadline: deadline,
                isExact
              }

              const {value, input} = CopyTrade.getInput({input: transaction.input, selector, args, abi: abi.inputs, index})

              await this.copy({
                token,
                contract,
                account,
                to: transaction.to,
                config: txConfig,
                value, 
                input,
                isBuy: false
              });
              this.$toast(`Sold successfully for ${account.get('name') || 'NoName'}.`, {
                position: "top-right",
                timeout: 2000,
                closeOnClick: true,
              });
            } catch (e) {
              console.log(e);
              this.$toast.error(`Sell error for ${account.get('name') || 'NoName'}`, {
                position: "top-right",
                timeout: 2000,
                closeOnClick: true,
              });
            }
          });
          handler();
        }
      } else if (path[0].toLowerCase() == currency) {
        // handle buy
        console.log('handling buy');
        const token = path[path.length - 1];
        const target = this.targets.filter(target => target.get('address').toLowerCase() == transaction.from.toLowerCase())[0];
        const excludes = target.get('excludes') || [];
        if (excludes.filter(exclude => exclude.address.toLowerCase() == token.toLowerCase()) > 0) {
          this.$toast.warning("Token is excluded", {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
          console.log('excluded');
          return;
        }
        console.log('ok');

        let type = 'normal';

        // determine if frontrun, backrun, normal buy
        if (this.txConfig.isBuyInstant) {
          if (transaction.status == 'pending') {
            if (parseFloat(this.txConfig.buyFastGasMultiplier) > 1) {
              type = 'frontrun';
            } else {
              type = 'backrun';
            }
          } else if (CopyTrade.hasBuyProcessed(token)) {
            console.log('already processed');
            return;
          }
        } else {
          if (transaction.status != 'confirmed') {
            console.log('waiting until confirmed');
            return;
          }
        }

        // check if bought already
        if (this.txConfig.isBuyOnce && CopyTrade.hasBought(path[path.length - 1])) {
          this.$toast("Already bought this token", {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
          return;
        }

        // check the amount to buy
        if (!this.txConfig.isBuySameAmount) {
          const buyAmount = Utils.formatBigInt(this.txConfig.buyAmount * 10 ** 18);
          if (parseInt(amountOut) != 0) {
            // set amount out to the ratio of amountIn / original amountIn
            // eslint-disable-next-line no-undef
            const ratio = BigInt(parseInt((buyAmount / amountIn) * 100000));
            // eslint-disable-next-line no-undef
            amountOut = BigInt(amountOut) * ratio / BigInt(100000);
          }
          amountIn = buyAmount;
        }

        const accounts = this.getActiveAccounts();

        CopyTrade.setBuyProcessed(token);

        const txConfig = await this.getTxConfig({
          action: 'buy', 
          type, 
          history
        });

        const gasPrice = txConfig.gasPrice || txConfig.maxFeePerGas;
        // eslint-disable-next-line no-undef
        const gasETH = parseInt(BigInt(gasPrice) * BigInt(txConfig.gas) / BigInt(10 ** 15)) / 1000;
        console.log(gasETH);
        if (parseFloat(gasETH) > parseFloat(this.txConfig.gasLimitETH) && parseFloat(this.txConfig.gasLimitETH) != 0) {
          this.$toast.error(`Gas price is exceed the gas limit setting`, {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
          return;
        }

        txConfig.gas = transaction.gas;
        // TODO: need to check if tx will fail

        this.$toast(`Buy Copy is in progress`, {
          position: "top-right",
          timeout: 2000,
          closeOnClick: true,
        });
        const Contract = Parse.getClass('Contract');
        let contract = new Contract();
        contract.set('totalSupply', 0);
        contract.set('address', token);

        for (let account of accounts) {
          if (!this.checkBalance(account)) {
            return;
          }
          const args = {
            amountIn,
            amountOut,
            path,
            to: account.get('address'),
            // deadline,
            deadline: deadline,
            isExact
          }
          const {value, input} = CopyTrade.getInput({input: transaction.input, selector, args, abi: abi.inputs, index})

          const handler = (async () => {
            try {
              await this.copy({
                token,
                contract,
                account,
                to: transaction.to,
                config: txConfig,
                value, 
                input,
                isBuy: true
              });
              await this.handleApprove(account, false, contract, transaction.to)
              this.$toast(`Bought successfully for ${account.get('name') || 'NoName'}.`, {
                position: "top-right",
                timeout: 2000,
                closeOnClick: true,
              });
            } catch (e) {
              console.log(e);
              this.$toast.error(`Buy error for ${account.get('name') || 'NoName'}`, {
                position: "top-right",
                timeout: 2000,
                closeOnClick: true,
              });
            }
          });
          handler().then(async () => {
            const decimals = contract.get('decimals');
            if (!decimals) {
              // first time account
              contract = await this.fetchContract(token);
              await this.createUpdateWatch({
                address: contract.get('address'),
                name: contract.get('name'),
                totalSupply: contract.get('totalSupply'),
                decimals: contract.get('decimals'),
                owner: contract.get('owner'),
                symbol: contract.get('symbol'),
                isActive: true,
                isFinished: false,
              })
            }
          });
        }
      }
    },
    preCheck(history) {
      if (history.test) {
        this.handleTest();
        return;
      }
      if (this.isCopyTrading) {
        this.handleCopyTrading(history);
        return;
      }
      const details = Transaction.getDetails(this.contract, history, true);

      console.log('New check', details.hash);

      const token = this.$route.params.address;

      let buyOn = null;
      if (this.txConfig.buyOn && this.txConfig.buyOn != '') {
        buyOn = this.txConfig.buyOn.replace(/\s/gi, '');
      }
      if (buyOn == '') {
        buyOn = null;
      }

      if ((buyOn && (details.selector.toLowerCase() == this.txConfig.buyOn.toLowerCase())
        || (details.method && details.method.toLowerCase().indexOf(this.txConfig.buyOn.toLowerCase()) != -1))
      ) {
        if (buyOn && !this.hasBought[token]) {
          this.$toast("Buy in progress...", {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
          });
          // Trigger Buy
          if (this.txConfig.isBuyInstant && details.status == 'pending') {
            // Buy using hash
            console.log('Buying instantly');
            // TODO: backrun buy
            this.handleBuy(history, 'backrun');
          } else if (!this.txConfig.isBuyInstant && details.status == 'confirmed') {
            Observer.$off(E_NEW_BLOCK);
            // Buy using multiplier
            console.log('Buying after Confirmed. Waiting for block ', this.txConfig.blocks);
            // TODO: normal buy
            if (parseInt(this.txConfig.blocks) - 1 <= 0) {
              this.handleBuy(history, 'normal');
            } else {
              Observer.$on(E_NEW_BLOCK, (block) => {
                if (block >= history.get('data').transaction.blockNumber + parseInt(this.txConfig.blocks) - 1) {
                  this.handleBuy(history, 'normal');
                  Observer.$off(E_NEW_BLOCK);
                }
              })
            }
          }
        }
      }
      // Sell if warn
      if (this.txConfig.isSellOnWarn && this.isWarn(history, details) && details.status == 'pending' && !this.hasSold[token]) {
        console.log('Selling as there is a warn');
        this.$toast.warning("Selling on warn...", {
          position: "top-right",
          timeout: 2000,
          closeOnClick: true,
        });
        // TODO: frontrun sell
        this.handleSell(history, 'frontrun');
      }
    },
    isWarn(history, details) {
      return Transaction.isWarn(history, this.accounts, details, this.txConfig.warns);
    },
  },
  data() {
    return {
      buyCounts: 0,
      isCleaningLastTotalValue: false,
      latestCA: null,
      feeTotal: 0,
      isRefreshingTotalTokenValue: false,
      isRefreshingLastTotalValue: false,
      isInitingTotalTokenValue: false,
      tokenValueAccount: null,
      taxWallet: null,
      tokenValueAmount: false,
      showOriginalRouter: true,
      isSelectAll: false,
      hasBought: {},
      hasSold: {},

      whaleList: window.localStorage.getItem("whaleList") ? window.localStorage.getItem("whaleList").split('\n') : [],
      dexList: [],
      copyDexList: [],
      ethPrice: 0,
      gwei: 0,
      currentBlock: 0,

      escrowBalance: 0,
      // Loader Settings
      isSpenderSetting: false,
      isCreatingMain: false,
      isCreatingSub: false,
      isDepositing: false,
      isCancelling: false,
      isAirdropping: false,
      isLaunching: false,
      isCancellingBundle: false,
      isVistaLaunching: false,
      isBuying: false,
      isSelling: false,
      isMixed: false,
      isFixed: false,
      isFixedV2: false,
      isUnclogging: false,
      isApproving: {},
      isEditing: {},
      isWithdrawing: {},
      isEscrowDepositing: false,
      isBuyingTest: false,
      isSellTesting: false,

      isCheckTx: true,

      // General
      timer: null,
      isSpenderSet: true,
      isApproved: {},
      mainDepositAmount: 0,
      withdrawAmount: 0,
      to: '',

      // Params for tx
      activeAccounts: {},

      // Auto trade
      autoTradeTimer: 0,
      autoBuyTimer: 0,
      autoSellTimer: 0,
      nowTimer: 0,

      // Withdraw Modal
      depositModalBalance: 0,
      depositModalActive: false,
      depositModalCallback: null,
      depositModalContent: '',
      depositModalCaption: '',
      depositModalHasTo: false,

      // Confirm Modal
      confirmActive: false,
      confirmTitle: '',
      confirmContent : '',
      confirmCallback : null,
      confirmIcon: 'info',

      // Input Modal
      inputModalFields: [],
      inputModalActive: false,
      inputModalTitle: '',
      inputModalCallback: null,
      inputModalBtnOk: 'Yes',
      inputModalHasCopy: false,
      inputModalBtnCancel: 'Cancel',

      // Alert Modal
      alertModalTitle: '',
      alertModalIcon: 'success',
      alertModalActive: false,
      alertModalContent: '',
      alertModalBtnOk: '',
      alertModalCallback: null,
    };
  },
};
</script>

<style scoped>
@media only screen 
    and (max-width: 520px), (min-device-width: 520px) 
    and (max-device-width: 520px)  {

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
    #table1 td:nth-of-type(1):before { content: "Name: "; }
		#table1 td:nth-of-type(2):before { content: "Address: "; }
		#table1 td:nth-of-type(3):before { content: "Balance: "; }
		#table1 td:nth-of-type(4):before { content: "Function: "; }
    #table2 td:nth-of-type(1):before { content: "Select: "; }
		#table2 td:nth-of-type(2):before { content: "Name: "; }
		#table2 td:nth-of-type(3):before { content: "Address: "; }
		#table2 td:nth-of-type(4):before { content: "Balance: "; }
		#table2 td:nth-of-type(5):before { content: "Function: "; }
	}

   #original_router:checked {
    background-color: red !important;
    border-color: red !important;
   }
</style>
