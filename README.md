
# Ethereum Contract Metrics Dashboard (Secure Serverless Edition)

## Usage

- `npm install`
- `npm run dev`
- Enter your contract ABI in `src/abi.json`.

## Vercel Deployment

- Deploy as a static frontend.
- `/api/fetch-events.js` is a Vercel serverless function.
- Set these **environment variables** in Vercel dashboard:
  - `ETHERSCAN_API_KEY`
  - `RPC_URL`

Your API secrets are **never exposed to the frontend**.
