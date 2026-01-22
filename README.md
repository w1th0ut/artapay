# ArtaPay Frontend
Frontend web app for the ArtaPay dApp built with Next.js that provides wallet onboarding, QR payments, swaps, top up IDRX or USDC via IDRX API and activity views for Base Sepolia.

## Overview
ArtaPay Frontend provides:

- **Wallet + Smart Account Onboarding**: Privy auth, Base App login, ERC-4337 smart accounts
- **Gasless Activation**: One-time approval for multi-token paymaster sponsorship
- **Send & Receive**: Single transfer, batch transfer, and multi-token payments
- **ENS Support**: Send to Base mainnet ENS names (via mainnet RPC resolver)
- **QR Payments**: Scan and generate payment requests
- **Stablecoin Swaps**: Quote and execute swaps via StableSwap
- **IDRX Top Up**: IDRX API integration for top-up flow
- **Activity Views**: Recent transfers and payment receipts
- **Configurable Network + Tokens**: Chain, contract, and token metadata via env

## Architecture
### Core Modules
#### 1. **Next.js App Router** - UI Shell
Main UI under `src/app` with layouts and routes.

**Key Features:**

- App router pages and layouts
- Global styles and assets
- SSR/CSR support via Next.js

#### 2. **Web3 Provider** - Wallet + Chain Context
Wraps viem configuration and smart account hooks.

**Key Features:**

- Chain and contract config from env
- Smart account initialization + paymaster flow
- Privy-based login with Base App wallet support

#### 3. **API Clients** - Backend + On-chain Helpers
Frontend calls the backend signer and IDRX helpers.

**Key Features:**

- Signer API integration for paymaster data
- IDRX top-up requests (server-side API keys)

#### 4. **Feature Modules** - Payments + Swap UI
Composable UI for payments, swaps, and activity.

**Key Features:**

- QR scan and generate flows
- Send/receive (single + batch) and swap views
- Activity list and receipts

## Fee Structure
Frontend surfaces the same on-chain fee model defined in `artapay-sc`.

| Fee Type       | Rate          | Paid By | Token      |
| -------------- | ------------- | ------- | ---------- |
| Platform Fee   | 0.3% (30 BPS) | Payer   | Stablecoin |
| Swap Fee       | 0.1% (10 BPS) | User    | Stablecoin |

## Setup & Installation
### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# From repo root
cd artapay-fe

# Install dependencies
npm install
```

### Environment Setup
Create a `.env` file in the root directory:

```bash
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_CHAIN_NAME=Base Sepolia
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_MAINNET_RPC_URL=https://0xrpc.io/eth
NEXT_PUBLIC_BLOCK_EXPLORER_NAME=Blockscout
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://base-sepolia.blockscout.com
NEXT_PUBLIC_NATIVE_CURRENCY_NAME=Ether
NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL=ETH
NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS=18

GELATO_API_KEY=
NEXT_PUBLIC_ENTRY_POINT_ADDRESS=
NEXT_PUBLIC_SIMPLE_ACCOUNT_FACTORY=
NEXT_PUBLIC_PAYMASTER_ADDRESS=
NEXT_PUBLIC_STABLE_SWAP_ADDRESS=
NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=
NEXT_PUBLIC_STABLECOIN_REGISTRY_ADDRESS=

NEXT_PUBLIC_SIGNER_API_URL=http://localhost:3001
NEXT_PUBLIC_PRIVY_APP_ID=

NEXT_PUBLIC_DEFAULT_TOKEN_SYMBOL=USDC
NEXT_PUBLIC_TOKEN_USDC_ADDRESS=
NEXT_PUBLIC_TOKEN_USDC_DECIMALS=6
NEXT_PUBLIC_TOKEN_USDS_ADDRESS=
NEXT_PUBLIC_TOKEN_USDS_DECIMALS=6
NEXT_PUBLIC_TOKEN_EURC_ADDRESS=
NEXT_PUBLIC_TOKEN_EURC_DECIMALS=6
NEXT_PUBLIC_TOKEN_BRZ_ADDRESS=
NEXT_PUBLIC_TOKEN_BRZ_DECIMALS=6
NEXT_PUBLIC_TOKEN_AUDD_ADDRESS=
NEXT_PUBLIC_TOKEN_AUDD_DECIMALS=6
NEXT_PUBLIC_TOKEN_CADC_ADDRESS=
NEXT_PUBLIC_TOKEN_CADC_DECIMALS=6
NEXT_PUBLIC_TOKEN_ZCHF_ADDRESS=
NEXT_PUBLIC_TOKEN_ZCHF_DECIMALS=6
NEXT_PUBLIC_TOKEN_TGBP_ADDRESS=
NEXT_PUBLIC_TOKEN_TGBP_DECIMALS=18
NEXT_PUBLIC_TOKEN_IDRX_ADDRESS=
NEXT_PUBLIC_TOKEN_IDRX_DECIMALS=6

NEXT_PUBLIC_ACTIVITY_LOOKBACK_BLOCKS=200000

IDRX_API_KEY=
IDRX_SECRET_KEY=
IDRX_BASE_URL=https://idrx.co/api
IDRX_NETWORK_CHAIN_ID=
```

Note: Use `.env.example` for the full list of token variables.

## Deployment
### Run Locally (Dev)

```bash
npm run dev
```

### Build Production

```bash
npm run build
```

### Run Production Server

```bash
npm run start
```

## Network Information
### Base Sepolia Testnet

- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Block Explorer**: https://base-sepolia.blockscout.com
- **EntryPoint v0.7**: `0x0000000071727De22E5E9d8BAf0edAc6f37da032`

### ENS Resolution

- ENS lookups use `NEXT_PUBLIC_MAINNET_RPC_URL` (Base mainnet).

## Supported Stablecoins

| Symbol | Name               | Decimals | Region |
| ------ | ------------------ | -------- | ------ |
| USDC   | USD Coin          | 6        | US     |
| USDS   | Sky Dollar        | 6        | US     |
| EURC   | Euro Coin         | 6        | EU     |
| BRZ    | Brazilian Digital | 6        | BR     |
| AUDD   | AUDD              | 6        | AU     |
| CADC   | CAD Coin          | 6        | CA     |
| ZCHF   | Frankencoin       | 6        | CH     |
| TGBP   | Tokenised GBP     | 18       | GB     |
| IDRX   | Indonesia Rupiah  | 6        | ID     |

## Contract Addresses
### Base Sepolia (Testnet)

```
EntryPoint:            0x0000000071727De22E5E9d8BAf0edAc6f37da032
StablecoinRegistry:    0x573f4D2b5e9E5157693a9Cc0008FcE4e7167c584
Paymaster:             0x1b14BF9ab47069a77c70Fb0ac02Bcb08A9Ffe290
StableSwap:            0x822e1dfb7bf410249b2bE39809A5Ae0cbfae612f
PaymentProcessor:      0x4D053b241a91c4d8Cd86D0815802F69D34a0164B
SimpleAccountFactory:  0xfEA9DD0034044C330c0388756Fd643A5015d94D2

Mock Tokens:
  USDC:  0x74FB067E49CBd0f97Dc296919e388CB3CFB62b4D
  USDS:  0x79f3293099e96b840A0423B58667Bc276Ea19aC0
  EURC:  0xfF4dD486832201F6DC41126b541E3b47DC353438
  BRZ:   0x9d30F685C04f024f84D9A102d0fE8dF348aE7E7d
  AUDD:  0x9f6b8aF49747304Ce971e2b9d131B2bcd1841d83
  CADC:  0x6BB3FFD9279fBE76FE0685Df7239c23488bC96e4
  ZCHF:  0xF27edF22FD76A044eA5B77E1958863cf9A356132
  tGBP:  0xb4db79424725256a6E6c268fc725979b24171857
  IDRX:  0x34976B6c7Aebe7808c7Cab34116461EB381Bc2F8
```

## Security Considerations

- **Public Env Vars**: `NEXT_PUBLIC_*` values are exposed to the browser. Do not put secrets here.
- **API Keys**: `IDRX_*` values are server-side only; do not expose them in `NEXT_PUBLIC_*`.
- **Network Mismatch**: Keep contract addresses aligned with the selected chain.
- **QR Validation**: Validate and sanitize QR payloads before use.

## Development
### Code Style
This project uses:

- TypeScript
- Next.js App Router
- Tailwind CSS
- wagmi/viem + Privy for wallet/auth

### Project Structure

```
artapay-fe/
|-- src/
|   |-- app/              # Next.js app router pages
|   |-- components/       # UI components
|   |-- config/           # Chain, ABI, and env config
|   |-- hooks/            # Web3 hooks
|   |-- api/              # Backend API helpers
|   |-- lib/              # Utilities
|-- public/               # Static assets
|-- package.json
|-- next.config.ts
```

## License
MIT License - see LICENSE file for details
