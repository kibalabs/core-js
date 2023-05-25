import { longFormatNumber, shortFormatNumber } from './numberUtil';

export const ETHER = BigInt('1000000000000000000');

export const etherToNumber = (value: bigint): number => {
  return Number((value * 1000000n) / ETHER) / 1000000.0;
};

export const shortFormatEther = (value: bigint): string => {
  const numberString = shortFormatNumber(etherToNumber(value));
  return `Ξ${numberString}`;
};

export const longFormatEther = (value: bigint, fractionDigits = 2, shouldRemoveTrailingDecimals = false, shouldAddCommas = false): string => {
  const numberString = longFormatNumber(etherToNumber(value), fractionDigits, shouldRemoveTrailingDecimals, shouldAddCommas);
  return `Ξ${numberString}`;
};
