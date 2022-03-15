export const asyncSleep = (sleepTime: number): Promise<void> => {
  return new Promise((resolve): void => {
    setTimeout(resolve, sleepTime);
  });
};
