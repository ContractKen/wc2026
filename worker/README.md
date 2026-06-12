# WC 2026 — Background Push Worker

A tiny Cloudflare Worker that powers **background notifications** (goal / kick-off /
full-time) for the tracker — alerts that arrive even when the app is fully closed.

It does two things:
- **Stores push subscriptions** (`POST /subscribe`, `POST /unsubscribe`) in KV.
- **On a 1-minute cron**, polls ESPN, detects new goals / kick-offs / full-times, and
  sends a Web Push to every matching subscription.

Everything runs on Cloudflare's **free** tier.

---

## One-time setup (~5–10 min)

You'll need a free [Cloudflare account](https://dash.cloudflare.com/sign-up).

### 1. Install deps + log in
```bash
cd worker
npm install
npx wrangler login
```

### 2. Generate VAPID keys (the push identity)
```bash
npx web-push generate-vapid-keys
```
Copy the **Public Key** and **Private Key** it prints.

### 3. Create the two KV namespaces
```bash
npx wrangler kv namespace create SUBS
npx wrangler kv namespace create STATE
```
Each prints an `id`. Paste them into `wrangler.toml` (replace `REPLACE_WITH_SUBS_KV_ID`
and `REPLACE_WITH_STATE_KV_ID`).

### 4. Fill in `wrangler.toml`
- `VAPID_PUBLIC_KEY` → the public key from step 2.
- `VAPID_SUBJECT` → your `mailto:` address.
- `ALLOWED_ORIGIN` / `SITE_URL` → already set to the GitHub Pages site; change if you host elsewhere.

### 5. Store the private key as a secret
```bash
npx wrangler secret put VAPID_PRIVATE_KEY
# paste the PRIVATE key when prompted
```

### 6. Deploy
```bash
npx wrangler deploy
```
This prints your Worker URL, e.g. `https://wc2026-push.<your-subdomain>.workers.dev`.

### 7. Point the web app at the Worker
In the main app, edit **`src/config.ts`**:
```ts
export const PUSH_API_URL = 'https://wc2026-push.<your-subdomain>.workers.dev'
export const VAPID_PUBLIC_KEY = '<the public key from step 2>'
```
Commit + push (the site redeploys). The **"📲 Background alerts"** toggle now appears
in the **My Teams** tab.

---

## Test it
1. Open the site, go to **My Teams → Enable** background alerts, allow notifications.
2. `curl https://wc2026-push.<sub>.workers.dev/health` → `{"ok":true}`.
3. During a live match you'll get goal/FT notifications within ~1 minute, even with the
   app closed (PWA installed recommended; required on iOS 16.4+).
4. Watch logs while testing: `npx wrangler tail`.

## Notes
- The cron is every minute (`* * * * *`). To poll less often, change it in `wrangler.toml`.
- On the very first cron run no notifications are sent (it just records current state),
  so you won't get a burst of stale scores.
- Scope: subscriptions made with "your teams" only alert for matches involving a followed
  team (by abbreviation); "all matches" alerts for everything. Set this via the header
  **🔔 Alerts** control before enabling.
- Expired subscriptions (HTTP 404/410) are auto-removed.
- The Worker uses `web-push` only to build the encrypted request, then delivers via the
  Worker runtime's `fetch` (compatible with `nodejs_compat`). If `wrangler deploy` ever
  errors on a Node built-in, ensure `compatibility_flags = ["nodejs_compat"]` is present
  (it is, by default).
