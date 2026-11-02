# Core-JS

This is Kiba Lab's utility belt for use when creating projects with JavaScript and Typescript.

It has one entry per environment so the main entry stays free of React, Web3 and Node code:

| Import | Contents | Needs installed |
| --- | --- | --- |
| `@kibalabs/core` | plain TypeScript utilities (requests, storage, dates, ...) | - |
| `@kibalabs/core/react` | React hooks and utilities (previously `@kibalabs/core-react`) | `react`, `react-router` |
| `@kibalabs/core/web3` | Web3 account context and hooks (previously `@kibalabs/web3-react`) | `react`, `react-dom`, `react-router`, `ethers`, `@reown/appkit`, `@reown/appkit-adapter-ethers`, `@base-org/account`, `@safe-global/safe-apps-sdk`, `@safe-global/safe-apps-provider` |
| `@kibalabs/core/node` | Node.js file helpers (`copyFileSync`, `copyDirectorySync`) | - |

The libraries needed by `react` and `web3` are optional peer dependencies, so install the ones for the entries you use in your project.

`@kibalabs/core/web3` only loads reown and the base account sdk (most of an app's web3 code) when they're needed: when restoring a session that uses them, when they're used to log in, or in the background a couple of seconds after the page has loaded if no account was restored. So with a bundler that splits dynamic imports (e.g. vite), they aren't part of the code an app loads up front.

For use, see other projects. We will update this README over time :)
