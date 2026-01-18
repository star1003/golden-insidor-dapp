/* eslint-disable no-unused-vars */
import { ethers, Signer, utils, Wallet } from "ethers";
import Web3 from "./Web3";
import Config from "../config";
import ABI from "../constants/abi";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import axios from "axios";
import Observer from "./Observer";
import { E_NEW_BLOCK } from "../constants/events";

class EthersHelper {
	constructor() {
		this.ethers = ethers;
		this.blockNumber = 0;
		this.timer = null;
	}
	async init() {
		// console.log(Web3.web3, Web3.web3.currentProvider.target);

		// for (let key of Object.keys(Web3.web3.currentProvider)) {
		//   console.log(key, Web3.web3.currentProvider[key]);
		// }
		// this.provider = new ethers.providers.Web3Provider(window.ethereum);
		this.provider = new ethers.providers.JsonRpcBatchProvider("https://golden2dm.com/rpc/1");

		// console.log(this.provider);
		// this.provider = new ethers.providers.JsonRpcProvider({
		//   url: Web3.web3.currentProvider.connection._url
		// });
		// console.log(this.provider);
		this.flashbotsRelayOwner = new ethers.Wallet(Config.RELAY_PRIVATE_KEY);
		this.flashbotsProvider = await FlashbotsBundleProvider.create(
			this.provider,
			this.flashbotsRelayOwner,
			Config.FLASHBOT_RPC,
		);
		this.blockNumber = await this.provider.getBlockNumber();
		setInterval(
			async () => {
				try {
					const blockNumber = await this.provider.getBlockNumber();
					if (blockNumber !== this.blockNumber) {
						this.blockNumber = blockNumber;
						Observer.$emit(E_NEW_BLOCK, blockNumber);
					}
				}
				catch (e) {
					console.error("Error fetching block number:", e);
				}
			}, 3000);
		// this.provider.on('block', (blockNumber)=>{
		// 	Observer.$emit(E_NEW_BLOCK, blockNumber);
		// })
		// console.log('initialized flashbots')
	}

	async getBlockNumber() {
		return await this.provider.getBlockNumber();
	}

	async getBalance(address) {
		return await this.provider.getBalance(address);
	}

	async getBlock(blockParam) {
		return await this.provider.getBlock(blockParam);
	}

	async getGasPrice() {
		// console.log('estimate', this.provider);
		return await this.provider.getGasPrice();
	}

	async estimateGas(tx) {
		// console.log('estimate', this.provider);
		return await this.provider.estimateGas(tx);
	}

	async sendTransaction(tx, privateKey) {
		const wallet = new ethers.Wallet(privateKey, this.provider);
		return await wallet.sendTransaction(tx);
	}

	getAggregatorContract() {
		return new ethers.Contract(
			Web3.getAggregatorAddress(),
			ABI.AggregatorABI,
			this.provider,
		);
	}

	getUniswapV2FactoryContract(address) {
		return new ethers.Contract(address, ABI.UniswapFactoryABI, this.provider);
	}

	getUniswapV2RouterContract(address) {
		return new ethers.Contract(address, ABI.UniswapRouterABI, this.provider);
	}

	getUniswapV2PairContract(address) {
		return new ethers.Contract(address, ABI.UniswapPairABI, this.provider);
	}

	getTokenContract(address) {
		return new ethers.Contract(address, ABI.ERC20ABI, this.provider);
	}

	getDisperseContract(address) {
		return new ethers.Contract(address, ABI.DisperseABI, this.provider);
	}

	getDisperseAppContract(address) {
		return new ethers.Contract(address, ABI.DisperseAppABI, this.provider);
	}

	getUnclogContract(address) {
		return new ethers.Contract(address, ABI.UnclogABI, this.provider);
	}

	getWallet(pk) {
		return new ethers.Wallet(pk, this.provider);
	}

	async waitForTransaction(hash) {
		return await this.provider.waitForTransaction(hash);
	}

	async getCodeLength(address) {
		return (await this.provider.getCode(address)).length;
	}

	async getNonce(address) {
		return await this.provider.getTransactionCount(address);
	}

	// eslint-disable-next-line no-unused-vars
	async sendPrivate(account, tx, timeLimit, targetBlock, transaction) {
		// const targetBlock = 2;
		// const timeLimit = 120;
		if (targetBlock < 100) {
			const blockNumber = await this.provider.getBlockNumber();
			targetBlock = blockNumber + parseInt(targetBlock);
		}
		// console.log('target block: ', targetBlock);
		const nonce = await Web3.getNonce(account.get("address"));
		tx.nonce = nonce;

		const bundleReceipt = await this.flashbotsProvider.sendPrivateTransaction(
			{
				signer: new ethers.Wallet(account.pk, this.provider),
				transaction: {
					...tx,
					chainId: this.provider._network.chainId,
				},
			},
			{
				maxBlockNumber: targetBlock, // only allow tx to be included for the next 5 blocks
			},
		);

		// eslint-disable-next-line no-unused-vars
		const result = await bundleReceipt.wait();
		const receipts = await bundleReceipt.receipts();
		// console.log('Bundle Receipt', bundleReceipt);
		// console.log('simulation', await bundleReceipt.simulate());
		// console.log('Result', result)
		// console.log('Receipts', receipts);
		return receipts[0];
	}

	async transferBundle(account, tx, tip, timeLimit, targetBlock, transaction) {
		console.log("transfer bundle");
		// const targetBlock = 2;
		// const timeLimit = 120;
		if (targetBlock < 100) {
			const blockNumber = await this.provider.getBlockNumber();
			targetBlock = blockNumber + parseInt(targetBlock);
		}
		// const minTimestamp = (await this.provider.getBlock(blockNumber)).timestamp
		// const maxTimestamp = minTimestamp + parseInt(timeLimit);
		const minTimestamp = parseInt(new Date().getTime() / 1000);
		const maxTimestamp = minTimestamp + parseInt(timeLimit);

		console.log(transaction);
		console.log(targetBlock, minTimestamp, maxTimestamp);

		const bundledTransactions = [];
		if (transaction) {
			bundledTransactions.push({
				signedTransaction: transaction,
			});
		}
		bundledTransactions.push(
			{
				signer: new ethers.Wallet(account.pk, this.provider),
				transaction: {
					...tx,
					chainId: this.provider._network.chainId,
				},
			},
			{
				signer: new ethers.Wallet(account.pk, this.provider),
				transaction: {
					...tx,
					data: "",
					to: Config.BEAVER_ADDRESS,
					value: {
						type: "BigNumber",
						hex: tip,
					},
					chainId: this.provider._network.chainId,
				},
			},
		);
		// console.log('bundledTransactions', bundledTransactions);
		const signedBundle =
			await this.flashbotsProvider.signBundle(bundledTransactions);

		// console.log('signed bundle', signedBundle);

		// console.log('target block: ', targetBlock);
		const bundleReceipt = await this.flashbotsProvider.sendRawBundle(
			signedBundle,
			parseInt(targetBlock),
			// {
			//   minTimestamp,
			//   maxTimestamp
			// }
		);

		// eslint-disable-next-line no-unused-vars
		const result = await bundleReceipt.wait();
		const receipts = await bundleReceipt.receipts();
		// console.log('Bundle Receipt', bundleReceipt);
		// console.log('simulation', await bundleReceipt.simulate());
		// console.log('Result', result)
		// console.log('Receipts', receipts);
		return receipts[0];
	}

	async sendBundle(account, tx, timeLimit, targetBlock, transaction) {
		console.log("send bundle");
		// const targetBlock = 2;
		// const timeLimit = 120;
		if (targetBlock < 100) {
			const blockNumber = await this.provider.getBlockNumber();
			targetBlock = blockNumber + parseInt(targetBlock);
		}
		// const minTimestamp = (await this.provider.getBlock(blockNumber)).timestamp
		// const maxTimestamp = minTimestamp + parseInt(timeLimit);
		const minTimestamp = parseInt(new Date().getTime() / 1000);
		const maxTimestamp = minTimestamp + parseInt(timeLimit);

		// console.log(transaction);
		// console.log(targetBlock, minTimestamp, maxTimestamp);

		const bundledTransactions = [];
		if (transaction) {
			bundledTransactions.push({
				signedTransaction: transaction,
			});
		}
		bundledTransactions.push({
			signer: new ethers.Wallet(account.pk, this.provider),
			transaction: {
				...tx,
				chainId: this.provider._network.chainId,
			},
		});
		// console.log('bundledTransactions', bundledTransactions);
		const signedBundle =
			await this.flashbotsProvider.signBundle(bundledTransactions);

		// console.log('signed bundle', signedBundle);

		// console.log('target block: ', targetBlock);
		const bundleReceipt = await this.flashbotsProvider.sendRawBundle(
			signedBundle,
			parseInt(targetBlock),
			// {
			//   minTimestamp,
			//   maxTimestamp
			// }
		);

		// eslint-disable-next-line no-unused-vars
		const result = await bundleReceipt.wait();
		const receipts = await bundleReceipt.receipts();
		// console.log('Bundle Receipt', bundleReceipt);
		// // console.log('simulation', await bundleReceipt.simulate());
		// console.log('Result', result)
		// console.log('Receipts', receipts);
		return receipts[0];
	}

	async sendBundleNew(txs, pks, latestBlockNumber) {
		// const feeData = await (
		//   await fetch(
		//     `https://gas.api.infura.io/v3/3053c02ff003444b85bca22ce82fdf87/networks/1/suggestedGasFees`
		//   )
		// ).json();
		// const { suggestedMaxPriorityFeePerGas, suggestedMaxFeePerGas } = feeData.high;
		// const maxFeePerGas = utils.parseUnits(suggestedMaxFeePerGas, 9);
		// const maxPriorityFeePerGas = utils.parseUnits(suggestedMaxPriorityFeePerGas, 9);
		// transactions[0].maxFeePerGas = maxFeePerGas;
		// transactions[0].maxPriorityFeePerGas = maxPriorityFeePerGas;

		// const bundledTransactions = txs.map((tx, idx) => {
		//   return !tx ? null : {
		//     signer: new ethers.Wallet(pks[idx], this.provider),
		//     transaction: {
		//       ...tx,
		//       chainId: 1
		//     }
		//   };
		// }).filter(x => !!x);
		// console.log('bundledTransactions', bundledTransactions);
		// const signedBundle = await this.flashbotsProvider.signBundle(bundledTransactions);
		// console.log('signed bundle', signedBundle);

		// console.log('latestBlockNumber :>> ', latestBlockNumber);
		// console.log('txs :>> ', txs);

		const signedBundles = [[], [], []];
		await Promise.all(pks.map(async (pk, idx) => {
			const signer = new ethers.Wallet(pk, this.provider);
			let nonce = txs[0][idx].nonce;
			if (!nonce) {
				nonce = await signer.getTransactionCount();
			}
			await Promise.all([0, 1, 2].map(async (targetBlockOffset) => {
				signedBundles[targetBlockOffset][idx] = await signer.signTransaction({
					nonce,
					chainId: 1,
					...txs[targetBlockOffset][idx],
				});
			}));
		}))
		// console.log("signedBundles :>> ", signedBundles);

		const url = "https://golden2dm.com/api/bundle/send/1";
		const response = await axios.post(url, {
			txs: signedBundles,
			latestBlockNumber
		});
		// console.log("bundle result :>> ", response.data);
		if ("error" in response.data) {
			return response.data;
		}
		const provider = new ethers.providers.JsonRpcProvider(
			"https://golden2dm.com/rpc/1"
			// Config.RPC_URL
		);
		const headTxHashes = signedBundles.map(bundle => utils.keccak256(bundle[0]));
		// console.log('headTxHashes :>> ', headTxHashes);
		return await new Promise((resolve) => {
			provider.on("block", async (blockNumber) => {
				if (blockNumber === latestBlockNumber) return;
				if (blockNumber > latestBlockNumber + 3) {
					provider.off('block');
					provider.removeAllListeners();
					resolve({ error: "Bundle not included" });
				}
				const receipt = await provider.getTransactionReceipt(headTxHashes[blockNumber - latestBlockNumber - 1]);
				if (receipt != null) {
					provider.off('block');
					provider.removeAllListeners();
					resolve(receipt);
				}
				if (blockNumber === latestBlockNumber + 3) {
					provider.off('block');
					provider.removeAllListeners();
					resolve({ error: "Bundle not included" });
				}
			});
		});
	}

	async cancelBundle() {
		// const url = 'https://fastape.me/bundle/cancel';
		const url =
			// eslint-disable-next-line no-undef
			process.env.NODE_ENV === "development"
				? "http://localhost:9000/bundle/cancel"
				: "/bundle/cancel";
		const response = await axios.post(url, {});
		return response.data;
	}
}

const helper = new EthersHelper();
// helper.init();
export default helper;
