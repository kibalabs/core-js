import React from 'react';

import { base, mainnet } from '@reown/appkit/networks';
import { AppKit, createAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { EthersAdapter as ReownEthersAdapter } from '@reown/appkit-adapter-ethers';
import { Eip1193Provider, BrowserProvider as EthersBrowserProvider } from 'ethers';

import { LocalStorageClient } from '..';
import type { IReownConfig, Web3Account } from './Web3AccountContext';

// NOTE(krishan711): this module is loaded on demand by Web3AccountContext so apps only download
// reown (and the libraries it uses) when it's needed, not on every page load.

export const createReownAppKit = (config: IReownConfig): AppKit => {
  return createAppKit({
    adapters: [new ReownEthersAdapter()],
    networks: [mainnet, base],
    projectId: config.projectId,
    metadata: {
      name: config.name,
      description: config.description,
      url: config.url,
      icons: config.icons,
    },
    features: {
      analytics: true,
    },
  });
};

export interface IAppKitSyncProps {
  localStorageClient: LocalStorageClient;
  setEip1193Provider: (provider: Eip1193Provider | null) => void;
  setWeb3Account: (account: Web3Account | null) => void;
  setWeb3ChainId: (chainId: number) => void;
}

export function AppKitSync(props: IAppKitSyncProps): React.ReactElement | null {
  const appKitAccount = useAppKitAccount();
  const appKitProviderResult = useAppKitProvider('eip155');
  const hasSetAccountRef = React.useRef(false);
  const noSessionTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle the case when Reown has no session - use a timeout to avoid race conditions
  // Reown initially reports isConnected=false before it finishes restoring the session
  React.useEffect((): (() => void) => {
    const savedRdns = props.localStorageClient.getValue('web3Account-chosenEip1193ProviderRdns');
    // Only set up the timeout if we're expecting a reown session and haven't already set up the account
    if (savedRdns !== 'reown' || hasSetAccountRef.current) {
      return (): void => {};
    }
    // If already connected, no need for timeout
    if (appKitAccount?.isConnected) {
      if (noSessionTimeoutRef.current) {
        clearTimeout(noSessionTimeoutRef.current);
        noSessionTimeoutRef.current = null;
      }
      return (): void => {};
    }
    // Set a timeout - if we don't get connected within this time, assume no session
    noSessionTimeoutRef.current = setTimeout(() => {
      // Double-check we still haven't connected
      if (!hasSetAccountRef.current) {
        props.localStorageClient.removeValue('web3Account-chosenEip1193ProviderRdns');
        props.setWeb3Account(null);
      }
    }, 3000); // 3 second timeout to allow Reown to restore session
    return (): void => {
      if (noSessionTimeoutRef.current) {
        clearTimeout(noSessionTimeoutRef.current);
        noSessionTimeoutRef.current = null;
      }
    };
  }, [appKitAccount?.isConnected, props]);

  React.useEffect((): void => {
    if (!appKitAccount?.isConnected || !appKitAccount?.address || !appKitProviderResult?.walletProvider) {
      return;
    }
    if (hasSetAccountRef.current) {
      return;
    }
    if (noSessionTimeoutRef.current) {
      clearTimeout(noSessionTimeoutRef.current);
      noSessionTimeoutRef.current = null;
    }
    // Mark as set immediately to prevent duplicate calls
    hasSetAccountRef.current = true;
    const walletProvider = appKitProviderResult.walletProvider as Eip1193Provider;
    props.setEip1193Provider(walletProvider);
    props.localStorageClient.setValue('web3Account-chosenEip1193ProviderRdns', 'reown');
    const syncAccount = async (): Promise<void> => {
      const browserProvider = new EthersBrowserProvider(walletProvider);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      props.setWeb3Account({ address, signer });
      const chainIdHex = await browserProvider.send('eth_chainId', []);
      props.setWeb3ChainId(Number(chainIdHex));
    };
    syncAccount();
  }, [appKitAccount?.isConnected, appKitAccount?.address, appKitProviderResult?.walletProvider, props]);

  return null;
}
