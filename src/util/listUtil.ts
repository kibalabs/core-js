
export const arrayWithRange = (start: number, end: number): number[] => {
  return Array(end - start).fill(null).map((item: unknown, index: number): number => start + index);
};

export const getChunks = <T>(arr: T[], chunkSize: number): T[][] => {
  return arr.reduce((accumulator: T[][], value: T, index: number): T[][] => {
    const chunkIndex = Math.floor(index / chunkSize);
    if (!accumulator[chunkIndex]) {
      accumulator[chunkIndex] = [];
    }
    accumulator[chunkIndex].push(value);
    return accumulator;
  }, []);
};
