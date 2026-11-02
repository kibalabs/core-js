import { Eip1193Provider, Contract as EthersContract, InterfaceAbi as EthersInterfaceAbi, Provider as EthersProvider, Signer as EthersSigner, TransactionReceipt as EthersTransactionReceipt, TransactionResponse as EthersTransactionResponse } from 'ethers';

export type Web3Signer = EthersSigner;
export type Web3Provider = EthersProvider;
export type Web3ContractInterface = EthersInterfaceAbi;
export type Web3Contract = EthersContract;
export type Web3TransactionResponse = EthersTransactionResponse;
export type Web3TransactionReceipt = EthersTransactionReceipt;

export interface Eip6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface Eip6963ProviderDetail {
  info: Eip6963ProviderInfo;
  provider: Eip1193Provider;
}

export interface Eip6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: Eip6963ProviderDetail;
}
