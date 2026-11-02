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

For use, see other projects. We will update this README over time :)
