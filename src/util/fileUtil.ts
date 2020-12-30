
export const humanFileSize = (size: number, decimals = 1): string => {
  if (size === 0) {
    return '0B';
  }
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const bucketIndex = Math.floor(Math.log(size) / Math.log(1024));
  const formattedSize = parseFloat((size / (1024 ** bucketIndex)).toFixed(decimals < 0 ? 0 : decimals));
  return `${formattedSize} ${sizes[bucketIndex]}`;
};
