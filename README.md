# ArtaPay Frontend

Frontend web app for the ArtaPay dApp built with Next.js.

## Requirements
- Node.js 18+ (LTS recommended)
- npm 9+ (or newer)

## Setup
1. Enter the frontend folder:
    `cd artapay-fe`
2. Copy the environment file:
    `cp .env.example .env`
    PowerShell: `Copy-Item .env.example .env`
3. Fill in the values in `.env` (see the full list in `.env.example`).
4. Install dependencies:
    `npm install --legacy-peer-deps`
5. Start the development server:
    `npm run dev`

The app will run at `http://localhost:3000`.

## Environment Variables
Use `.env.example` as a template. Important variables:
- Chain: `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_CHAIN_NAME`, `NEXT_PUBLIC_RPC_URL`
- Explorer: `NEXT_PUBLIC_BLOCK_EXPLORER_NAME`, `NEXT_PUBLIC_BLOCK_EXPLORER_URL`
- Native currency: `NEXT_PUBLIC_NATIVE_CURRENCY_NAME`, `NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL`,
`NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS`
- Smart account: `NEXT_PUBLIC_ENTRY_POINT_ADDRESS`, `NEXT_PUBLIC_SIMPLE_ACCOUNT_FACTORY`,
`NEXT_PUBLIC_PAYMASTER_ADDRESS`
- Contracts: `NEXT_PUBLIC_STABLE_SWAP_ADDRESS`, `NEXT_PUBLIC_PAYMENT_PROCESSOR_ADDRESS`
- Services: `NEXT_PUBLIC_GELATO_API_KEY`, `NEXT_PUBLIC_SIGNER_API_URL`, `NEXT_PUBLIC_PRIVY_APP_ID`
- Token list + decimals: `NEXT_PUBLIC_TOKEN_*_ADDRESS`, `NEXT_PUBLIC_TOKEN_*_DECIMALS`
- Misc: `NEXT_PUBLIC_ACTIVITY_LOOKBACK_BLOCKS`

## Available Scripts
 - `npm run dev` - start dev server
- `npm run build` - build for production
- `npm run start` - start production server
- `npm run lint` - run ESLint

## Production Build
```bash
npm run build
npm run start

## Troubleshooting

- If npm install fails due to peer dependencies, use npm install --legacy-peer-deps.
- Ensure NEXT_PUBLIC_RPC_URL and contract addresses match the selected network.