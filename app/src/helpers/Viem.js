/* eslint-disable no-unused-vars */
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

class ViemHelper {
	constructor() {
		this.publicClient = null;
	}
	async init() {
		this.publicClient = createPublicClient({
			transport: http("https://golden2dm.com/rpc/1"),
		});
	}

	async sendRawTransaction(rawTx) {
		const hash = await this.publicClient.sendRawTransaction({
			serializedTransaction: rawTx,
		});
		return hash;
	}

	async waitForTransactionReceipt(txHash) {
		const transaction = await this.publicClient.waitForTransactionReceipt({
			hash: txHash,
		});
		return transaction;
	}
}

const helper = new ViemHelper();
helper.init();
export default helper;
