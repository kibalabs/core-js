export const numberWithCommas = (value: number): string => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const shortFormatNumber = (value: number): string => {
  if (value >= 1000000000) {
    return `${(value / 1000000000.0).toFixed(0)}B`;
  }
  if (value >= 10000000) {
    return `${(value / 1000000.0).toFixed(0)}M`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000.0).toFixed(1)}M`;
  }
  if (value >= 10000) {
    return `${(value / 1000.0).toFixed(0)}K`;
  }
  if (value >= 1000) {
    return `${(value / 1000.0).toFixed(1)}K`;
  }
  if (value > 100) {
    return value.toFixed(0);
  }
  if (value > 1) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
};

export const longFormatNumber = (value: number, fractionDigits = 2, shouldRemoveTrailingDecimals = false, shouldAddCommas = false): string => {
  let roundedValue = value.toFixed(fractionDigits);
  if (shouldRemoveTrailingDecimals) {
    while (roundedValue.charAt(roundedValue.length - 1) === ',') {
      roundedValue = roundedValue.slice(0, -1);
    }
    if (roundedValue.endsWith('.0')) {
      roundedValue = roundedValue.replace('.0', '');
    }
  }
  if (shouldAddCommas) {
    const parts = roundedValue.split('.');
    const part0 = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    roundedValue = parts.length === 1 ? part0 : `${part0}.${parts[1]}`;
  }
  return `${roundedValue.toLocaleString()}`;
};
