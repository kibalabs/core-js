export default (config) => {
  const newConfig = config;
  newConfig.entries = {
    index: './src/index.ts',
    'react/index': './src/react/index.ts',
    'web3/index': './src/web3/index.ts',
    'node/index': './src/node/index.ts',
  };
  return newConfig;
};
