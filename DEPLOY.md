# Time Window Deployment Notes

App Name: Time Window
Tagline: Claim a short slot
Description: Claim a public short time slot with label, hour, note, wallet, and timestamp on Base for demos and office hours.

## After Base Gives `base:app_id`

Copy the meta tag to Codex. The app id must be written to:

- `src/app/layout.tsx`
- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_BASE_APP_ID`

Then deploy once with the project token in `Vercel.txt`, deploy the contract, and write the contract address to:

- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_TIME_WINDOW_CONTRACT_ADDRESS`

## After Base Gives Builder Code

Write the Builder Code to:

- `.env.local`
- `Vercel.txt`
- Vercel Production env `NEXT_PUBLIC_BUILDER_CODE`

Then run production deploy again.

## Required Vercel Production Env

```bash
NEXT_PUBLIC_BASE_APP_ID=6a0aff1b7abfff0aca7b1743
NEXT_PUBLIC_BUILDER_CODE=replace_with_builder_code
NEXT_PUBLIC_TIME_WINDOW_CONTRACT_ADDRESS=replace_with_time_window_contract_address
```

## Contract

```bash
npm run deploy:contract
```
