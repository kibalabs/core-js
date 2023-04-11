
export const arrayWithRange = (start: number, end: number): number[] => {
  return Array(end - start).fill(null).map((item: unknown, index: number): number => start + index);
};
