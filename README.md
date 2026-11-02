# @kibalabs/core

Kiba Labs' utilities for TypeScript projects, with optional React, Web3 and Node entries.

## Install

```bash
npm install @kibalabs/core
```

## Entries

| Import | Contents |
| --- | --- |
| `@kibalabs/core` | Requests, service clients, storage, dates and other plain TypeScript utilities |
| `@kibalabs/core/react` | React hooks and utilities (was `@kibalabs/core-react`) |
| `@kibalabs/core/web3` | Web3 account context, contracts and transactions (was `@kibalabs/web3-react`) |
| `@kibalabs/core/node` | Node.js file helpers |

The main entry has no React, Web3 or Node code. The other entries' libraries are optional peer dependencies, so install the ones for the entries you use:

```bash
# @kibalabs/core/react
npm install react react-router
# @kibalabs/core/web3
npm install react react-dom react-router ethers @reown/appkit @reown/appkit-adapter-ethers @base-org/account @safe-global/safe-apps-sdk @safe-global/safe-apps-provider
```

`@kibalabs/core/web3` loads reown and the Base account SDK only when they're needed (restoring a session that uses them, logging in with them, or in the background after the page has loaded), so bundlers that split dynamic imports keep them out of an app's initial load.

## Development

```bash
make install
make lint-check
make type-check
make build
```
