import { formatUnits as ethersFormatUnits, MaxUint256 as EthersMaxUint256, parseUnits as ethersParseUnits } from 'ethers';

export const Web3MaxUint256 = EthersMaxUint256;

export const formatWeb3Units = (value: bigint | null | undefined, decimals: number, fallback: string = ''): string => (value == null ? fallback : ethersFormatUnits(value, decimals));

export const parseWeb3Units = <T = never>(value: string, decimals: number, fallback?: T): bigint | T => {
  try {
    return ethersParseUnits(value, decimals);
  } catch (error) {
    if (fallback === undefined) {
      throw error;
    }
    return fallback;
  }
};
