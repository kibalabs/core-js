import React from 'react';

import type { AppKit } from '@reown/appkit/react';
import { BrowserProvider, Eip1193Provider, BrowserProvider as EthersBrowserProvider } from 'ethers';

import { dateToString, generateRandomString, LocalStorageClient } from '..';
import { IMultiAnyChildProps, useEventListener, useInitialization } from '../react';
import { Eip6963AnnounceProviderEvent, Eip6963ProviderDetail, Web3Provider, Web3Signer } from './model';

declare global {
  interface Window {
    ethereum?: Record<string, unknown> | undefined;
  }
}

export type Web3Account = {
  address: string;
  signer: Web3Signer;
};

export type Web3LoginSignature = {
  message: string;
  signature: string;
};

type Web3AccountControl = {
  web3: Web3Provider | undefined | null;
  web3ChainId: number | undefined | null;
  web3Account: Web3Account | undefined | null;
  web3LoginSignature: Web3LoginSignature | undefined | null;
  isRestoringSession: boolean;
  isSafeApp: boolean;
  providers: Eip6963ProviderDetail[];
  chooseEip1193Provider: (eip1193ProviderRdns: string) => void;
  onLinkWeb3AccountsClicked: () => Promise<boolean>;
  onWeb3BaseLoginClicked: (chainId: number, statement: string, appName: string, appLogUrl: string) => Promise<Web3LoginSignature | null>;
  onWeb3LoginClicked: (statement?: string, shouldIncludeProtocol?: boolean) => Promise<Web3LoginSignature | null>;
  onSwitchToChainIdClicked: (chainId: number) => Promise<void>;
};

export const Web3AccountContext = React.createContext<Web3AccountControl | undefined | null>(undefined);

export interface IReownConfig {
  projectId: string;
  name: string;
  description: string;
  url: string;
  icons: string[];
}

export interface IWeb3Config {
  reownConfig?: IReownConfig;
}

interface IWeb3AccountControlProviderProps extends IMultiAnyChildProps {
  localStorageClient: LocalStorageClient;
  onError: (error: Error) => void;
}

let isReownInitializedGlobally = false;
let reownConfig: IReownConfig | null = null;

// NOTE(krishan711): reown and the base account sdk are large (with the libraries they use they're most
// of an app's web3 code), so they're only loaded when they're needed: when restoring a session that uses
// them, when they're used to log in, or in the background once it's clear the user isn't logged in (so
// logging in with them is instant, and popups still open straight from the click).
type ReownModule = typeof import('./reown');
type CreateBaseAccountSdk = typeof import('@base-org/account').createBaseAccountSDK;

let reownModulePromise: Promise<ReownModule> | null = null;
let loadedReownModule: ReownModule | null = null;
let reownAppKit: AppKit | null = null;
const reownModuleListeners = new Set<() => void>();

const loadReown = (): Promise<ReownModule> => {
  if (!reownConfig) {
    return Promise.reject(new Error('Reown has not been initialized, pass a reownConfig to web3Initialize'));
  }
  if (!reownModulePromise) {
    const config = reownConfig;
    reownModulePromise = import('./reown').then((reownModule: ReownModule): ReownModule => {
      reownAppKit = reownModule.createReownAppKit(config);
      loadedReownModule = reownModule;
      reownModuleListeners.forEach((listener: () => void): void => listener());
      return reownModule;
    });
    // NOTE(krishan711): allow retrying if loading failed (e.g. a network error)
    reownModulePromise.catch((): void => {
      reownModulePromise = null;
    });
  }
  return reownModulePromise;
};

const subscribeToReownModule = (listener: () => void): (() => void) => {
  reownModuleListeners.add(listener);
  return (): void => {
    reownModuleListeners.delete(listener);
  };
};

const getLoadedReownModule = (): ReownModule | null => loadedReownModule;

const getServerReownModule = (): ReownModule | null => null;

let createBaseAccountSdkPromise: Promise<CreateBaseAccountSdk> | null = null;
let loadedCreateBaseAccountSdk: CreateBaseAccountSdk | null = null;

const loadBaseAccount = (): Promise<CreateBaseAccountSdk> => {
  if (!createBaseAccountSdkPromise) {
    // NOTE(krishan711): destructuring the import lets bundlers tree-shake the parts of the sdk that aren't used
    createBaseAccountSdkPromise = import('@base-org/account').then(({ createBaseAccountSDK }): CreateBaseAccountSdk => {
      loadedCreateBaseAccountSdk = createBaseAccountSDK;
      return createBaseAccountSDK;
    });
    createBaseAccountSdkPromise.catch((): void => {
      createBaseAccountSdkPromise = null;
    });
  }
  return createBaseAccountSdkPromise;
};

const runWhenIdle = (callback: () => void): (() => void) => {
  if (typeof window.requestIdleCallback === 'function') {
    const idleCallbackId = window.requestIdleCallback(callback, { timeout: 3000 });
    return (): void => window.cancelIdleCallback(idleCallbackId);
  }
  const timeoutId = setTimeout(callback, 1000);
  return (): void => clearTimeout(timeoutId);
};

export const web3Initialize = (config: IWeb3Config): void => {
  if (typeof window === 'undefined') {
    return;
  }
  if (config.reownConfig && !isReownInitializedGlobally) {
    reownConfig = config.reownConfig;
    isReownInitializedGlobally = true;
  }
};

interface ISafeSyncProps {
  localStorageClient: LocalStorageClient;
  setEip1193Provider: (provider: Eip1193Provider | null) => void;
  setWeb3Account: (account: Web3Account | null) => void;
  setWeb3ChainId: (chainId: number) => void;
  setIsSafeApp: (isSafeApp: boolean) => void;
  setLoginCount: React.Dispatch<React.SetStateAction<number>>;
}

function SafeSync(props: ISafeSyncProps): React.ReactElement | null {
  const hasSetAccountRef = React.useRef(false);

  React.useEffect((): void => {
    if (hasSetAccountRef.current) {
      return;
    }
    // Only attempt Safe detection when running inside an iframe
    if (typeof window === 'undefined' || window.parent === window) {
      return;
    }
    const detectSafe = async (): Promise<void> => {
      try {
        const { default: SafeAppsSDK } = await import('@safe-global/safe-apps-sdk');
        const { SafeAppProvider } = await import('@safe-global/safe-apps-provider');
        const safeSDK = new SafeAppsSDK();
        const safeInfo = await Promise.race([
          safeSDK.safe.getInfo(),
          new Promise<never>((_resolve, reject) => { setTimeout(() => reject(new Error('Safe detection timeout')), 2000); }),
        ]);
        if (!safeInfo?.safeAddress || hasSetAccountRef.current) {
          return;
        }
        hasSetAccountRef.current = true;
        props.setIsSafeApp(true);
        const safeProvider = new SafeAppProvider(safeInfo, safeSDK);
        const eip1193Provider = safeProvider as unknown as Eip1193Provider;
        props.setEip1193Provider(eip1193Provider);
        props.localStorageClient.setValue('web3Account-chosenEip1193ProviderRdns', 'safe');
        const browserProvider = new EthersBrowserProvider(eip1193Provider);
        const signer = await browserProvider.getSigner();
        const address = await signer.getAddress();
        props.setWeb3Account({ address, signer });
        props.setWeb3ChainId(safeInfo.chainId);
        // Check if we already have a stored signature for this Safe address
        const existingSignature = props.localStorageClient.getValue(`web3Account-signature-${address}`);
        if (existingSignature) {
          props.setLoginCount((prev) => prev + 1);
        }
      } catch {
        // Not running inside Safe — this is expected for normal browser access
      }
    };
    detectSafe();
  }, [props]);

  return null;
}

export function Web3AccountControlProvider(props: IWeb3AccountControlProviderProps): React.ReactElement {
  const [eip1193Provider, setEip1193Provider] = React.useState<Eip1193Provider | null | undefined>(undefined);
  const [web3ChainId, setWeb3ChainId] = React.useState<number | null | undefined>(undefined);
  const [web3Account, setWeb3Account] = React.useState<Web3Account | undefined | null>(undefined);
  const [loginCount, setLoginCount] = React.useState<number>(0);
  const [providers, setProviders] = React.useState<Eip6963ProviderDetail[] | undefined>(undefined);
  const [isWaitingToLinkAccount, setIsWaitingToLinkAccount] = React.useState<boolean>(false);
  const [isSafeApp, setIsSafeApp] = React.useState<boolean>(false);
  // Check if there's a saved provider that might be restoring (used to prevent flash of logged-out state)
  const savedProviderRdns = props.localStorageClient.getValue('web3Account-chosenEip1193ProviderRdns');
  const isRestoringSession = savedProviderRdns != null && web3Account === undefined;
  const providersRef = React.useRef<Eip6963ProviderDetail[] | undefined>(undefined);
  providersRef.current = providers;
  const onError = props.onError;
  const reownModule = React.useSyncExternalStore(subscribeToReownModule, getLoadedReownModule, getServerReownModule);

  React.useEffect((): void => {
    if (isReownInitializedGlobally && savedProviderRdns === 'reown') {
      loadReown().catch((error: unknown): void => {
        console.error('Failed to load reown:', error);
      });
    }
  }, [savedProviderRdns]);

  React.useEffect((): (() => void) | undefined => {
    if (web3Account !== null) {
      return undefined;
    }
    return runWhenIdle((): void => {
      if (isReownInitializedGlobally) {
        loadReown().catch((error: unknown): void => {
          console.error('Failed to load reown:', error);
        });
      }
      loadBaseAccount().catch((error: unknown): void => {
        console.error('Failed to load the base account sdk:', error);
      });
    });
  }, [web3Account]);

  const chooseEip1193Provider = React.useCallback((eip1193ProviderRdns: string): void => {
    if (eip1193Provider != null) {
      return;
    }
    const provider = providersRef.current?.find((providerDetail: Eip6963ProviderDetail): boolean => providerDetail.info.rdns === eip1193ProviderRdns);
    if (provider) {
      setEip1193Provider(provider.provider);
      props.localStorageClient.setValue('web3Account-chosenEip1193ProviderRdns', eip1193ProviderRdns);
    } else {
      setEip1193Provider(null);
      props.localStorageClient.removeValue('web3Account-chosenEip1193ProviderRdns');
    }
  }, [eip1193Provider, providersRef, props.localStorageClient]);

  // NOTE(krishan711): we need to depend on web3ChainId so that when the chain changes we recreate the provider
  // this is required because ethers.js v6 throws an error if you use a provider after the network has changed
  // see: https://github.com/ethers-io/ethers.js/issues/4506
  const web3 = React.useMemo((): EthersBrowserProvider | undefined | null => {
    if (eip1193Provider == null) {
      return null;
    }
    return new EthersBrowserProvider(eip1193Provider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eip1193Provider, web3ChainId]);

  useEventListener(window, 'eip6963:announceProvider', (event: Event): void => {
    const parsedEvent = event as Eip6963AnnounceProviderEvent;
    setProviders((prevProviders: Eip6963ProviderDetail[] | undefined): Eip6963ProviderDetail[] => {
      const newProviders = [...prevProviders ?? []];
      const existingProviderIndex = newProviders.findIndex((provider: Eip6963ProviderDetail): boolean => provider.info.uuid === parsedEvent.detail.info.uuid);
      if (existingProviderIndex >= 0) {
        newProviders[existingProviderIndex] = parsedEvent.detail;
        return newProviders;
      }
      newProviders.push(parsedEvent.detail);
      return newProviders;
    });
  });

  const loadWeb3 = async (): Promise<void> => {
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    // NOTE(krishan711): need to keep window.ethereum as a fallback option for injected wallet
    if (window.ethereum != null) {
      const newProvider: Eip6963ProviderDetail = {
        info: {
          uuid: 'ethers',
          name: 'Injected wallet',
          icon: 'data:image/svg+xml,%3Csvg width=\'500\' height=\'500\' viewBox=\'0 0 500 500\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg clip-path=\'url(%23clip0_13_2)\'%3E%3Crect width=\'500\' height=\'500\' rx=\'250\' fill=\'white\'/%3E%3Cpath d=\'M356.875 175.188H143.125C125.417 175.188 111.062 189.542 111.062 207.25V335.5C111.062 353.208 125.417 367.562 143.125 367.562H356.875C374.583 367.562 388.938 353.208 388.938 335.5V207.25C388.938 189.542 374.583 175.188 356.875 175.188Z\' stroke=\'black\' stroke-width=\'32\' stroke-linejoin=\'round\'/%3E%3Cpath d=\'M353.776 175.187V155.148C353.774 150.234 352.688 145.38 350.594 140.933C348.501 136.486 345.452 132.556 341.664 129.424C337.877 126.291 333.445 124.033 328.685 122.81C323.925 121.588 318.953 121.431 314.125 122.351L138.209 152.376C130.569 153.832 123.677 157.908 118.722 163.902C113.766 169.895 111.057 177.43 111.063 185.207V217.937\' stroke=\'black\' stroke-width=\'32\' stroke-linejoin=\'round\'/%3E%3Cpath d=\'M324.813 292.75C320.585 292.75 316.452 291.496 312.937 289.148C309.422 286.799 306.682 283.461 305.065 279.555C303.447 275.649 303.023 271.351 303.848 267.205C304.673 263.059 306.709 259.25 309.698 256.261C312.687 253.271 316.496 251.235 320.642 250.411C324.789 249.586 329.087 250.009 332.992 251.627C336.898 253.245 340.236 255.985 342.585 259.5C344.934 263.015 346.188 267.147 346.188 271.375C346.188 277.044 343.936 282.481 339.927 286.489C335.918 290.498 330.482 292.75 324.813 292.75Z\' fill=\'black\'/%3E%3C/g%3E%3Cdefs%3E%3CclipPath id=\'clip0_13_2\'%3E%3Crect width=\'500\' height=\'500\' fill=\'white\'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E%0A',
          rdns: 'ethers',
        },
        // @ts-ignore
        provider: (window.ethereum as Eip1193Provider),
      };
      setProviders((prevProviders: Eip6963ProviderDetail[] | undefined): Eip6963ProviderDetail[] => {
        const previousProviders = prevProviders ?? [];
        const existingProviderIndex = previousProviders.findIndex((p: Eip6963ProviderDetail): boolean => p.info.rdns === 'ethers');
        if (existingProviderIndex >= 0) {
          const newProviders = [...previousProviders];
          newProviders[existingProviderIndex] = newProvider;
          return newProviders;
        }
        return [...previousProviders, newProvider];
      });
    } else {
      // NOTE(krishan711): this isn't great because it instantiates to empty but if there are no
      // providers found the array would never be initialized
      setProviders([]);
    }
  };

  useInitialization((): void => {
    loadWeb3();
  });

  const autoReconnectBaseProvider = React.useCallback(async (): Promise<boolean> => {
    const baseConnectionString = props.localStorageClient.getValue('web3Account-baseConnection');
    if (!baseConnectionString) {
      props.localStorageClient.removeValue('web3Account-chosenEip1193ProviderRdns');
      return false;
    }
    let createBaseAccountSDK: CreateBaseAccountSdk;
    try {
      createBaseAccountSDK = loadedCreateBaseAccountSdk ?? await loadBaseAccount();
    } catch (error: unknown) {
      console.error('Failed to load the base account sdk:', error);
      return false;
    }
    try {
      const baseConnection = JSON.parse(baseConnectionString);
      const { address, chainId, appName, appLogoUrl } = baseConnection;
      const signatureString = props.localStorageClient.getValue(`web3Account-signature-${address}`);
      if (!signatureString) {
        return false;
      }
      const sdk = createBaseAccountSDK({
        appName,
        appLogoUrl,
        appChainIds: [chainId],
      });
      const browserProvider = new BrowserProvider(sdk.getProvider());
      const signer = await browserProvider.getSigner();
      const currentAddress = await signer.getAddress();
      if (currentAddress.toLowerCase() === address.toLowerCase()) {
        setWeb3Account({ address: currentAddress, signer });
        setEip1193Provider(sdk.getProvider());
        setLoginCount((prev) => prev + 1);
        return true;
      }
    } catch (parseError) {
      console.error('Invalid Base connection data:', parseError);
      props.localStorageClient.removeValue('web3Account-baseConnection');
      props.localStorageClient.removeValue('web3Account-chosenEip1193ProviderRdns');
    }
    return false;
  }, [props.localStorageClient]);

  const autoReconnectProvider = React.useCallback(async (): Promise<void> => {
    if (eip1193Provider != null || providers === undefined) {
      return;
    }
    const savedRdns = props.localStorageClient.getValue('web3Account-chosenEip1193ProviderRdns');
    // Reown/WalletConnect is handled by AppKitSync, not here
    if (savedRdns === 'reown') {
      return;
    }
    // Safe is handled by SafeSync, not here
    if (savedRdns === 'safe') {
      return;
    }
    if (savedRdns === 'base') {
      const baseReconnected = await autoReconnectBaseProvider();
      if (!baseReconnected) {
        setWeb3Account(null);
        setEip1193Provider(null);
      }
      return;
    }
    if (savedRdns && providers.length > 0) {
      const savedProvider = providers.find((provider: Eip6963ProviderDetail): boolean => provider.info.rdns === savedRdns);
      if (savedProvider) {
        setEip1193Provider(savedProvider.provider);
      } else {
        props.localStorageClient.removeValue('web3Account-chosenEip1193ProviderRdns');
      }
    } else {
      setWeb3Account(null);
      setEip1193Provider(null);
    }
  }, [providers, props.localStorageClient, eip1193Provider, autoReconnectBaseProvider]);

  React.useEffect((): void => {
    autoReconnectProvider();
  }, [autoReconnectProvider]);

  const onWeb3AccountsChanged = React.useCallback(async (web3AccountAddresses: string[]): Promise<void> => {
    if (!web3) {
      return;
    }
    const potentialLinkedWeb3Accounts: (Web3Signer | null)[] = await Promise.all(web3AccountAddresses.map((web3AccountAddress: string): Promise<Web3Signer | null> => {
      // if (!(web3 instanceof EthersJsonRpcApiProvider)) {
      //   return Promise.resolve(null);
      // }
      return web3.getSigner(web3AccountAddress);
    }));
    const linkedWeb3Accounts = potentialLinkedWeb3Accounts.filter((potentialSigner: Web3Signer | null): boolean => potentialSigner != null) as Web3Signer[];
    if (linkedWeb3Accounts.length === 0) {
      setWeb3Account(null);
      // NOTE(krishan711): Clean up Base connection if it was a Base provider
      const currentProviderRdns = props.localStorageClient.getValue('web3Account-chosenEip1193ProviderRdns');
      if (currentProviderRdns === 'base') {
        props.localStorageClient.removeValue('web3Account-baseConnection');
        props.localStorageClient.removeValue('web3Account-chosenEip1193ProviderRdns');
      }
      return;
    }
    // NOTE(krishan711): metamask only deals with one web3Account at the moment but returns an array for future compatibility
    const linkedWeb3Account = linkedWeb3Accounts[0];
    const linkedWeb3AccountAddress = await linkedWeb3Account.getAddress();
    setWeb3Account({ address: linkedWeb3AccountAddress, signer: linkedWeb3Account });
  }, [web3, props.localStorageClient]);

  const loadWeb3Accounts = React.useCallback(async (): Promise<void> => {
    if (!web3) {
      return;
    }
    const newWeb3AccountAddresses = await web3.send('eth_accounts', []);
    onWeb3AccountsChanged(newWeb3AccountAddresses);
    const newChainId = await web3.send('eth_chainId', []);
    setWeb3ChainId(Number(newChainId));
  }, [web3, onWeb3AccountsChanged]);

  React.useEffect((): void => {
    loadWeb3Accounts();
  }, [loadWeb3Accounts]);

  const onChainChanged = React.useCallback(async (newChainIdHex: string): Promise<void> => {
    // NOTE(krishan711): phantom wallet seems to hit these callbacks straight away, so dont reload here unless we have already initialised
    if (!web3 || !web3ChainId) {
      return;
    }
    const newChainId = parseInt(newChainIdHex, 16);
    if (Number.isNaN(newChainId)) {
      console.error(`Invalid chainId hex string: ${newChainIdHex}`);
      setWeb3ChainId(null);
      return;
    }
    // NOTE(krishan711): setting the new chain id will trigger the web3 provider to be recreated (via the useMemo)
    setWeb3ChainId(newChainId);
  }, [web3, web3ChainId]);

  const monitorWeb3AccountChanges = React.useCallback(async (): Promise<void> => {
    if (!eip1193Provider) {
      return;
    }
    // @ts-expect-error
    eip1193Provider.on('accountsChanged', onWeb3AccountsChanged);
    // @ts-expect-error
    eip1193Provider.on('chainChanged', onChainChanged);
  }, [eip1193Provider, onWeb3AccountsChanged, onChainChanged]);

  React.useEffect((): void => {
    monitorWeb3AccountChanges();
  }, [monitorWeb3AccountChanges]);

  const onLinkWeb3AccountsClicked = React.useCallback(async (): Promise<boolean> => {
    if (web3 == null) {
      setIsWaitingToLinkAccount(true);
      return false;
    }
    try {
      await web3.send('eth_requestAccounts', []);
      await loadWeb3Accounts();
      return true;
    } catch (error: unknown) {
      if ((error as Error).message?.includes('wallet_requestPermissions')) {
        onError(new Error('WALLET_REQUEST_ALREADY_OPEN'));
      } else {
        onError(new Error('WALLET_CONNECTION_FAILED'));
      }
    }
    return false;
  }, [web3, onError, loadWeb3Accounts]);

  React.useEffect((): void => {
    if (isWaitingToLinkAccount && web3) {
      setIsWaitingToLinkAccount(false);
      onLinkWeb3AccountsClicked();
    }
  }, [isWaitingToLinkAccount, web3, onLinkWeb3AccountsClicked]);

  const onSwitchToChainIdClicked = React.useCallback(async (chainId: number): Promise<void> => {
    if (!web3) {
      throw new Error('No web3 provider available to switch chain');
    }
    try {
      await web3.send('wallet_switchEthereumChain', [{
        chainId: `0x${chainId.toString(16)}`,
      }]);
    } catch (error: unknown) {
      // Error code 4902 means the chain hasn't been added to the wallet yet
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 4902) {
        const chainConfigurations: Record<number, { chainName: string; nativeCurrency: { name: string; symbol: string; decimals: number }; rpcUrls: string[]; blockExplorerUrls: string[] }> = {
          8453: { // Base Mainnet
            chainName: 'Base',
            nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org'],
          },
        };

        const chainConfig = chainConfigurations[chainId];
        if (!chainConfig) {
          throw error;
        }
        await web3.send('wallet_addEthereumChain', [{
          chainId: `0x${chainId.toString(16)}`,
          ...chainConfig,
        }]);
      } else {
        throw error;
      }
    }
  }, [web3]);

  const web3LoginSignature = React.useMemo((): Web3LoginSignature | null => {
    if (!web3Account || loginCount < 0) {
      return null;
    }
    const stringValue = props.localStorageClient.getValue(`web3Account-signature-${web3Account.address}`);
    if (!stringValue) {
      return null;
    }
    const signature = JSON.parse(stringValue);
    // TODO(krishan711): could do some checking here
    return signature as Web3LoginSignature;
  }, [web3Account, loginCount, props.localStorageClient]);

  const onWeb3BaseLoginClicked = React.useCallback(async (chainId: number, statement: string, appName: string, appLogoUrl: string): Promise<Web3LoginSignature | null> => {
    let createBaseAccountSDK: CreateBaseAccountSdk;
    try {
      // NOTE(krishan711): use the loaded sdk without awaiting so its popup still opens straight from the user's click
      createBaseAccountSDK = loadedCreateBaseAccountSdk ?? await loadBaseAccount();
    } catch (error: unknown) {
      console.error('Sign in failed:', error);
      return null;
    }
    const sdk = createBaseAccountSDK({
      appName,
      appLogoUrl,
      appChainIds: [chainId],
    });
    const domain = window.location.protocol !== 'https:' ? window.location.origin : window.location.host;
    const actualStatement = statement || `Sign in to ${appName}.`;
    try {
      const response = await sdk.getProvider().request({
        method: 'wallet_connect',
        params: [{
          version: '1',
          capabilities: {
            signInWithEthereum: {
              version: '1',
              domain,
              uri: window.location.origin,
              statement: actualStatement,
              nonce: generateRandomString(16),
              chainId: `0x${chainId.toString(16)}`,
              issuedAt: dateToString(new Date()),
            },
          },
        }],
      });
      // @ts-expect-error
      const address = response.accounts[0].address;
      // @ts-expect-error
      const message = response.accounts[0].capabilities.signInWithEthereum.message;
      // @ts-expect-error
      const signature = response.accounts[0].capabilities.signInWithEthereum.signature;
      const newWeb3LoginSignature = { message, signature };
      props.localStorageClient.setValue(`web3Account-signature-${address}`, JSON.stringify(newWeb3LoginSignature));
      setLoginCount(loginCount + 1);
      const browserProvider = new BrowserProvider(sdk.getProvider());
      const signer = await browserProvider.getSigner();
      setWeb3Account({ address, signer });
      setEip1193Provider(sdk.getProvider());
      const baseConnectionState = {
        address,
        chainId,
        appName,
        appLogoUrl,
        isBaseProvider: true,
      };
      props.localStorageClient.setValue('web3Account-baseConnection', JSON.stringify(baseConnectionState));
      props.localStorageClient.setValue('web3Account-chosenEip1193ProviderRdns', 'base');
      return newWeb3LoginSignature;
    } catch (error) {
      console.error('Sign in failed:', error);
    }
    return null;
  }, [loginCount, props.localStorageClient]);

  const onWeb3LoginClicked = React.useCallback(async (statement?: string, shouldIncludeProtocol?: boolean): Promise<Web3LoginSignature | null> => {
    if (!web3Account) {
      return null;
    }
    const domain = (shouldIncludeProtocol || window.location.protocol !== 'https:') ? window.location.origin : window.location.host;
    const actualStatement = statement ?? 'Sign in to the app.';
    // NOTE(krishan711): SIWE compliant message: https://eips.ethereum.org/EIPS/eip-4361
    let messageParts: string[] = [
      `${domain} wants you to sign in with your Ethereum account:`,
      `${web3Account.address}`,
      '',
      actualStatement,
      '',
    ];
    messageParts = messageParts.concat([
      `URI: ${window.location.origin}`,
      'Version: 1',
      `Chain ID: ${web3ChainId}`,
      `Nonce: ${generateRandomString(16)}`,
      `Issued At: ${dateToString(new Date())}`,
    ]);
    const message = messageParts.join('\n');
    try {
      const signature = await web3Account.signer.signMessage(message);
      const newWeb3LoginSignature = { message, signature };
      props.localStorageClient.setValue(`web3Account-signature-${web3Account.address}`, JSON.stringify(newWeb3LoginSignature));
      setLoginCount(loginCount + 1);
      return newWeb3LoginSignature;
    } catch (error: unknown) {
      console.error(error);
    }
    return null;
  }, [web3Account, web3ChainId, props.localStorageClient, loginCount]);

  const providerValue = React.useMemo((): Web3AccountControl => {
    return { web3Account, web3LoginSignature, isRestoringSession, isSafeApp, providers: providers ?? [], onLinkWeb3AccountsClicked, onWeb3LoginClicked, onWeb3BaseLoginClicked, chooseEip1193Provider, onSwitchToChainIdClicked, web3, web3ChainId };
  }, [web3Account, web3LoginSignature, isRestoringSession, isSafeApp, providers, chooseEip1193Provider, onLinkWeb3AccountsClicked, onWeb3LoginClicked, onWeb3BaseLoginClicked, onSwitchToChainIdClicked, web3, web3ChainId]);

  return (
    <Web3AccountContext.Provider value={providerValue}>
      {reownModule && (
        <reownModule.AppKitSync
          localStorageClient={props.localStorageClient}
          setEip1193Provider={setEip1193Provider}
          setWeb3Account={setWeb3Account}
          setWeb3ChainId={setWeb3ChainId}
        />
      )}
      <SafeSync
        localStorageClient={props.localStorageClient}
        setEip1193Provider={setEip1193Provider}
        setWeb3Account={setWeb3Account}
        setWeb3ChainId={setWeb3ChainId}
        setIsSafeApp={setIsSafeApp}
        setLoginCount={setLoginCount}
      />
      {props.children}
    </Web3AccountContext.Provider>
  );
}

export const useWeb3 = (): Web3Provider | undefined | null => {
  const web3AccountsControl = React.useContext(Web3AccountContext);
  if (!web3AccountsControl) {
    throw Error('web3AccountsControl has not been initialized correctly.');
  }
  return web3AccountsControl.web3;
};

export const useWeb3Account = (): Web3Account | undefined | null => {
  const web3AccountsControl = React.useContext(Web3AccountContext);
  if (!web3AccountsControl) {
    throw Error('web3AccountsControl has not been initialized correctly.');
  }
  return web3AccountsControl.web3Account;
};

export const useOnLinkWeb3AccountsClicked = (): (() => Promise<boolean>) => {
  const web3AccountsControl = React.useContext(Web3AccountContext);
  if (!web3AccountsControl) {
    throw Error('web3AccountsControl has not been initialized correctly.');
  }
  return web3AccountsControl.onLinkWeb3AccountsClicked;
};

export const useWeb3OnLoginClicked = (): ((statement?: string, shouldIncludeProtocol?: boolean) => Promise<Web3LoginSignature | null>) => {
  const web3AccountsControl = React.useContext(Web3AccountContext);
  if (!web3AccountsControl) {
    throw Error('web3AccountsControl has not been initialized correctly.');
  }
  return web3AccountsControl.onWeb3LoginClicked;
};

export const useWeb3OnBaseLoginClicked = (): ((chainId: number, statement: string, appName: string, appLogoUrl: string) => Promise<Web3LoginSignature | null>) => {
  const web3AccountsControl = React.useContext(Web3AccountContext);
  if (!web3AccountsControl) {
    throw Error('web3AccountsControl has not been initialized correctly.');
  }
  return web3AccountsControl.onWeb3BaseLoginClicked;
};

export const useWeb3OnReownLoginClicked = (): (() => Promise<void>) => {
  const openModal = React.useCallback(async (): Promise<void> => {
    await loadReown();
    await reownAppKit?.open();
  }, []);
  return openModal;
};

export const useIsReownInitialized = (): boolean => {
  return isReownInitializedGlobally;
};

export const useIsRestoringWeb3Session = (): boolean => {
  const web3AccountsControl = React.useContext(Web3AccountContext);
  if (!web3AccountsControl) {
    throw Error('web3AccountsControl has not been initialized correctly.');
  }
  return web3AccountsControl.isRestoringSession;
};

export const useWeb3LoginSignature = (): Web3LoginSignature | undefined | null => {
  const web3AccountsControl = React.useContext(Web3AccountContext);
  if (!web3AccountsControl) {
    throw Error('web3AccountsControl has not been initialized correctly.');
  }
  return web3AccountsControl.web3LoginSignature;
};

export const useWeb3ChainId = (): number | undefined | null => {
  const web3AccountsControl = React.useContext(Web3AccountContext);
  if (!web3AccountsControl) {
    throw Error('web3AccountsControl has not been initialized correctly.');
  }
  return web3AccountsControl.web3ChainId;
};

export const useWeb3Providers = (): [Eip6963ProviderDetail[], ((eip1193ProviderRdns: string) => void)] => {
  const web3AccountsControl = React.useContext(Web3AccountContext);
  if (!web3AccountsControl) {
    throw Error('web3AccountsControl has not been initialized correctly.');
  }
  return [web3AccountsControl.providers, web3AccountsControl.chooseEip1193Provider];
};

export const useOnSwitchToWeb3ChainIdClicked = (): ((chainId: number) => Promise<void>) => {
  const web3AccountsControl = React.useContext(Web3AccountContext);
  if (!web3AccountsControl) {
    throw Error('web3AccountsControl has not been initialized correctly.');
  }
  return web3AccountsControl.onSwitchToChainIdClicked;
};

export const useIsSafeApp = (): boolean => {
  const web3AccountsControl = React.useContext(Web3AccountContext);
  if (!web3AccountsControl) {
    throw Error('web3AccountsControl has not been initialized correctly.');
  }
  return web3AccountsControl.isSafeApp;
};
