// Background-push config. Fill these in AFTER deploying the Cloudflare Worker
// (see worker/README.md), then redeploy the site. Until both are set, the
// "Background alerts" toggle stays hidden and nothing else is affected.
export const PUSH_API_URL = 'https://wc2026-push.amit78.workers.dev'
export const VAPID_PUBLIC_KEY = 'BL3128TW_NrZvU98hA8LVIYH3dzgyJrx6Rn6wJeeDwacv7FYm28FZfvKrk1CBDXk7Tsyv7CtL_2s5AHGeRo_fuY'

export function pushConfigured(): boolean {
  return PUSH_API_URL.length > 0 && VAPID_PUBLIC_KEY.length > 0
}
