# ArtaPay Frontend
Frontend web app for the ArtaPay dApp built with Next.js that provides wallet onboarding, QR payments, swaps, and activity views for Base Sepolia.

## Overview
ArtaPay Frontend provides:

- **Wallet + Smart Account Onboarding**: Privy auth and ERC-4337 smart accounts
- **QR Payments**: Scan and generate payment requests
- **Stablecoin Swaps**: Quote and prepare swaps via StableSwap
- **Activity Views**: Recent transactions and payment receipts
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
Wraps wagmi/viem configuration and smart account hooks.

**Key Features:**

- Chain and contract config from env
- Smart account initialization
- Privy-based login (optional)

#### 3. **API Clients** - Backend + On-chain Helpers
Frontend calls the backend signer and swap helpers.

**Key Features:**

- Signer API integration for paymaster data
- Swap quote + calldata retrieval

#### 4. **Feature Modules** - Payments + Swap UI
Composable UI for payments, swaps, and activity.

**Key Features:**

- QR scan and generate flows
- Send/receive and swap views
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
# =====================================================
# FRONTEND CONFIGURATION
# =====================================================

# Network
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_CHAIN_NAME=Base Sepolia
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_BLOCK_EXPLORER_NAME=Blockscout
NEXT_PUBLIC_BLOCK_EXPLORER_URL=https://base-sepolia.blockscout.com
NEXT_PUBLIC_NATIVE_CURRENCY_NAME=Ether
NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL=ETH
NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS=18

# Services
GELATO_API_KEY=
NEXT_PUBLIC_SIGNER_API_URL=http://localhost:3001
NEXT_PUBLIC_PRIVY_APP_ID=

# Contracts
NEXT_PUBLIC_ENTRY_POINT_ADDRESS=0x0000000071727De22E5E9d8BAf0edAc6f37da032
NEXT_PUBLIC_SIMPLE_ACCOUNT_FACTORY=<DEPLOYED_ADDRESS>
NEXT_PUBLIC_PAYMASTER_ADDRESS=<DEPLOYED_ADDRESS>
NEXT_PUBLIC_STABLE_SWAP_ADDRESS=<DEPLOYED_ADDRESS>
NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS=<DEPLOYED_ADDRESS>

# Tokens (repeat for all supported stablecoins)
NEXT_PUBLIC_DEFAULT_TOKEN_SYMBOL=USDC
NEXT_PUBLIC_TOKEN_USDC_ADDRESS=<DEPLOYED_ADDRESS>
NEXT_PUBLIC_TOKEN_USDC_DECIMALS=6

# Activity
NEXT_PUBLIC_ACTIVITY_LOOKBACK_BLOCKS=200000
```

Note: Use `.env.example` for the full list of token variables.

## Testing
No automated tests are included yet.

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
SimpleAccountFactory:  <DEPLOYED_ADDRESS>
Paymaster:             <DEPLOYED_ADDRESS>
StableSwap:            <DEPLOYED_ADDRESS>
PaymentProcessor:      <DEPLOYED_ADDRESS>
```

## Security Considerations

- **Public Env Vars**: `NEXT_PUBLIC_*` values are exposed to the browser. Do not put secrets here.
- **API Keys**: Use restricted API keys for client-side services.
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
