# Sui Explorer Frontend

[Sui Explorer](https://explorer.devnet.sui.io/) is a network explorer for the Sui network, similar in functionality to [Etherscan](https://etherscan.io/) or [Solana Explorer](https://explorer.solana.com/). Use Sui Explorer to see the latest transactions and objects.

# Set Up

**Requirements**: Node 14.0.0 or later.

Currently the Explorer depends on an unreleased version of `sui.js`, the TypeScript SDK for Sui. Therefore, you need to build the SDK first:

```bash
$ cd <Your Sui Repository>/sdk/typescript
$ yarn && yarn build
```

Then, in the project directory, run:

```bash
$ yarn
```

> **Note:** If you are updating the SDK and Explorer at the same time, you need to run the following commands to make sure the Explorer depends on the updated SDK.

```bash
$ cd <Your Sui Repository>/sdk/typescript
$ yarn build

$ cd ../../explorer/client
$ rm -rf node_modules/ && yarn
```

Before running any of the following scripts `yarn` must run in order to install the necessary dependencies.

# How to Switch Environment

## Connecting to the DevNet Remote Gateway Server

The Sui Explorer frontend will use the DevNet Gateway server by default: https://gateway.devnet.sui.io:443

```bash
yarn start

```

## Connecting to a Local RPC Server

Refer to [Local RPC Server & JSON-RPC API Quick Start](../../doc/src/build/json-rpc.md) on setting up a Local RPC Server. If we wish to locally run the website using a Local RPC Server, then run the following:

```bash
yarn start:local

```

Alternatively, having run `yarn start`, click the green button at the top of the page and select the option 'Local'.

## Connecting to a Custom RPC URL

First run the following:

```bash
yarn start

```

Then, click the green button at the top and select the option 'Custom RPC URL'. Type the Custom RPC URL into the input box that emerges.

## Connecting to the Static Data

The Sui Explorer can also connect to a local, static JSON dataset that can be found at `./src/utils/static/mock_data.json` and `./src/utils/static/owned_object.json`.

For example, suppose we wish to locally run the website using the static JSON dataset and not the API, then we could run the following:

```bash
yarn start:static

```

# Other Yarn commands

### `yarn test`

This runs a series of end-to-end browser tests using the website as connected to the static JSON dataset. This command is run by the GitHub checks. The tests must pass before merging a branch into main.

### `yarn build`

Builds the app for production to the `build` folder.

It bundles React in production mode and optimizes the build for the best performance.

### `yarn lint`

Run linting check (prettier/eslint/stylelint).

### `yarn lint:fix`

Run linting check but also try to fix any issues.

# Features

Currently the Explorer supports

-   Landing page with latest transactions
-   Transaction details page
-   Object details page
-   Address page with owned objects
-   Search for transactions, addresses, and Objects by ID

See [Experiment with Sui DevNet](https://docs.sui.io/explore/devnet) for use.
