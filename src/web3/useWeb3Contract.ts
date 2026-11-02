import React from 'react';

import { Contract as EthersContract } from 'ethers';

import { Web3Contract, Web3ContractInterface, Web3Signer } from './model';
import { useWeb3, useWeb3ChainId } from './Web3AccountContext';


export const useWeb3Contract = (contractChainIdAddressMap: Record<number, string>, abi: Web3ContractInterface): Web3Contract | null | undefined => {
  const web3 = useWeb3();
  const chainId = useWeb3ChainId();
  const contract = React.useMemo((): Web3Contract | null | undefined => {
    if (web3 === undefined || chainId === undefined) {
      return undefined;
    }
    if (web3 === null || chainId === null) {
      return null;
    }
    const contractAddress = contractChainIdAddressMap[chainId];
    if (!contractAddress) {
      return null;
    }
    return new EthersContract(contractAddress, abi, web3);
  }, [web3, chainId, abi, contractChainIdAddressMap]);
  return contract;
};

export const useWeb3WritableContract = (contractChainIdAddressMap: Record<number, string>, abi: Web3ContractInterface, signer: Web3Signer | null | undefined): Web3Contract | null | undefined => {
  const chainId = useWeb3ChainId();
  const contract = React.useMemo((): Web3Contract | null | undefined => {
    if (chainId === undefined || signer === undefined) {
      return undefined;
    }
    if (chainId === null || signer === null) {
      return null;
    }
    const contractAddress = contractChainIdAddressMap[chainId];
    if (!contractAddress) {
      return null;
    }
    return new EthersContract(contractAddress, abi, signer);
  }, [chainId, abi, contractChainIdAddressMap, signer]);
  return contract;
};
