// Background-push config. Fill these in AFTER deploying the Cloudflare Worker
// (see worker/README.md), then redeploy the site. Until both are set, the
// "Background alerts" toggle stays hidden and nothing else is affected.
export const PUSH_API_URL = '' // e.g. 'https://wc2026-push.yourname.workers.dev'
export const VAPID_PUBLIC_KEY = '' // public key from `npx web-push generate-vapid-keys`

export function pushConfigured(): boolean {
  return PUSH_API_URL.length > 0 && VAPID_PUBLIC_KEY.length > 0
}
