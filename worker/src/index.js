// Cloudflare Worker: stores push subscriptions and, on a cron, polls ESPN for
// goals / kickoff / full-time and sends Web Push notifications.
//
// Uses `web-push` only to BUILD each request (VAPID + payload encryption) via
// generateRequestDetails(); delivery is done with the Worker's own fetch().
import webpush from 'web-push'

const SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(env) })

    if (url.pathname === '/health') return json({ ok: true }, env)

    if (url.pathname === '/subscribe' && request.method === 'POST') {
      const { subscription, scope, teams } = await request.json().catch(() => ({}))
      if (!subscription || !subscription.endpoint) return json({ error: 'bad subscription' }, env, 400)
      const id = await sha256(subscription.endpoint)
      await env.SUBS.put(
        'sub:' + id,
        JSON.stringify({ subscription, scope: scope === 'all' ? 'all' : 'my', teams: teams || [] }),
      )
      return json({ ok: true }, env)
    }

    if (url.pathname === '/unsubscribe' && request.method === 'POST') {
      const { endpoint } = await request.json().catch(() => ({}))
      if (endpoint) await env.SUBS.delete('sub:' + (await sha256(endpoint)))
      return json({ ok: true }, env)
    }

    return new Response('Not found', { status: 404, headers: cors(env) })
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(poll(env))
  },
}

async function poll(env) {
  const now = Date.now()
  const ymd = (t) => {
    const d = new Date(t)
    return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
  }
  const res = await fetch(`${SCOREBOARD}?dates=${ymd(now - 864e5)}-${ymd(now + 864e5)}&limit=200`, {
    headers: { accept: 'application/json' },
  })
  if (!res.ok) return
  const data = await res.json()
  const events = data.events || []

  const prev = JSON.parse((await env.STATE.get('state')) || '{}')
  const next = {}
  const outbox = []

  for (const e of events) {
    const comp = e.competitions && e.competitions[0]
    const state = (comp && comp.status && comp.status.type && comp.status.type.state) || 'pre'
    const cs = (comp && comp.competitors) || []
    const home = cs.find((c) => c.homeAway === 'home') || {}
    const away = cs.find((c) => c.homeAway === 'away') || {}
    const hs = num(home.score)
    const as = num(away.score)
    const hN = (home.team && home.team.displayName) || 'Home'
    const aN = (away.team && away.team.displayName) || 'Away'
    const codes = [home.team && home.team.abbreviation, away.team && away.team.abbreviation].filter(Boolean)
    const url = `${env.SITE_URL || ''}?m=${e.id}`

    next[e.id] = { state, hs, as }
    const old = prev[e.id]
    if (!old) continue // first sighting — don't notify (avoids cold-start spam)

    if (old.state === 'pre' && state === 'in')
      outbox.push({ codes, payload: { title: 'Kick-off ⚽', body: `${hN} vs ${aN} has started`, tag: `m${e.id}`, url } })

    if (state === 'in' || state === 'post') {
      if (hs > old.hs)
        outbox.push({ codes, payload: { title: `GOAL! ${hN} ⚽`, body: `${hN} ${hs}–${as} ${aN}`, tag: `m${e.id}`, url } })
      if (as > old.as)
        outbox.push({ codes, payload: { title: `GOAL! ${aN} ⚽`, body: `${hN} ${hs}–${as} ${aN}`, tag: `m${e.id}`, url } })
    }

    if (old.state !== 'post' && state === 'post')
      outbox.push({ codes, payload: { title: 'Full time', body: `${hN} ${hs}–${as} ${aN}`, tag: `m${e.id}`, url } })
  }

  await env.STATE.put('state', JSON.stringify(next))
  if (outbox.length === 0) return

  const subs = []
  const list = await env.SUBS.list({ prefix: 'sub:' })
  for (const k of list.keys) {
    const v = await env.SUBS.get(k.name)
    if (v) subs.push({ key: k.name, ...JSON.parse(v) })
  }
  if (subs.length === 0) return

  webpush.setVapidDetails(
    env.VAPID_SUBJECT || 'mailto:admin@example.com',
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  )

  for (const n of outbox) {
    for (const s of subs) {
      if (s.scope !== 'all' && !n.codes.some((c) => (s.teams || []).includes(c))) continue
      try {
        const d = webpush.generateRequestDetails(s.subscription, JSON.stringify(n.payload))
        const r = await fetch(d.endpoint, { method: d.method || 'POST', headers: d.headers, body: d.body })
        if (r.status === 404 || r.status === 410) await env.SUBS.delete(s.key) // expired
      } catch {
        /* skip individual delivery failures */
      }
    }
  }
}

function num(s) {
  return s == null || s === '' ? 0 : Number(s)
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function cors(env) {
  return {
    'access-control-allow-origin': env.ALLOWED_ORIGIN || '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  }
}

function json(obj, env, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...cors(env) },
  })
}
