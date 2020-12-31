import { KibaException } from '../model/kibaException';

// TODO(krish): add proper typings to this
export const timeoutPromise = <T>(timeoutSeconds: number, promise: Promise<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new KibaException('TIMEOUT'));
    }, timeoutSeconds * 1000);
    promise.then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      },
    );
  });
};
