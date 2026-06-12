# Changelog

All notable changes to the World Cup 2026 Tracker. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); dates are 2026.

## [1.6.0] — 2026-06-12 — Background push (Batch 3 of 3)

### Added
- **Background push notifications** — goal / kick-off / full-time alerts that arrive even when the app is fully closed.
  - Service worker `push` + `notificationclick` handlers (notification deep-links to the match).
  - Client subscribe/unsubscribe flow and a **"📲 Background alerts"** toggle in *My Teams* (hidden until configured).
  - A small **Cloudflare Worker** (`worker/`) that stores subscriptions in KV and, on a 1-minute cron, polls ESPN, detects events, and sends Web Push (VAPID). Free tier; full setup in `worker/README.md`.
- Respects the existing 🔔 Alerts scope (your teams vs all matches).

### Setup required
- Background push needs a one-time deploy of the Worker (free Cloudflare account) and two values pasted into `src/config.ts`. Until then the toggle stays hidden and nothing else changes. See `worker/README.md`.

## [1.5.0] — 2026-06-12 — New look + personality (Batch 2 of 3)

### Added
- **Bold new visual identity** — a deep-plum "Americas 2026" palette with magenta/gold/mint accents, layered glow background, dot texture, and an original hand-drawn confetti hero (no copyrighted photos/branding).
- **Light & dark themes** — toggle in the header; preference saved.
- **Favorite-team accent** — the app tints to your top-followed team's colour (e.g. Argentina sky-blue).
- **First-run onboarding** — a welcome flow to pick teams, time zone, region, and alerts in one screen (returning users are skipped).
- **Predictions game (solo)** — predict scorelines on upcoming matches; auto-graded when they finish (exact = 3 pts, right result = 1 pt) with an accuracy/points summary in My Teams.

## [1.4.1] — 2026-06-12 — Stats tab + all four FIFA awards

### Added
- Tournament stats moved out of Groups into their own **Stats** tab.
- All **four individual FIFA awards** as live cards:
  - **🏆 Golden Ball** — goal-involvement (G+A) leaders as a live indicator (official award is a media vote).
  - **🥇 Golden Boot** — top scorers (goals, then assists).
  - **🧤 Golden Glove** — goalkeepers ranked by clean sheets → fewest conceded → saves, computed from the same cached match data (no extra fetches).
  - **🌟 Best Young Player** — explained with an honest note (subjective vote, announced after the final).
- Each award clearly labels statistical vs. officially-decided, and players are tappable for their profile.

## [1.4.0] — 2026-06-12 — Daily-use depth (Batch 1 of 3)

### Added
- **Live-events strip** in the ticker — recent goals/red cards across all in-play matches, newest first, refreshing every ~20s.
- **Golden Boot / top-scorers leaderboard** (Groups tab) — built by reading each finished match once and caching the goals locally; goals + assists, tap a name for the player card.
- **Player profiles** — tap any player (lineups, squad, scorers) for a card with position, age, club, tournament goals/assists, a follow button, and an ESPN link.
- **Qualification status** in group tables — guaranteed-only badges: ✓ through, "3rd?" best-third race, ✗ eliminated (conservative math, never shows a false result).

### Notes
- Part 1 of a 3-batch push (daily depth → personality/stickiness → background push).

## [1.3.1] — 2026-06-12 — Installable-app polish

### Added
- Proper **PNG app icons** (192, 512, maskable, and a 180px Apple touch icon) so the home-screen icon is crisp on both Android and iOS (iOS ignores SVG icons).
- **iOS install hint** — a one-time, dismissible banner explaining *Share → Add to Home Screen* (iOS can't show the automatic install prompt that Android/desktop Chrome gets).

### Notes
- The app is a full PWA: installable to the home screen, runs full-screen, works offline. No app store needed. (A native wrapper via Capacitor remains an option for store distribution / true background push.)

## [1.3.0] — 2026-06-12 — Official "Watch" links

### Added
- **Where to watch** now shows official broadcaster **links** per region with **Free / Subscription** and **4K-UHD** badges. Prioritised for India, UK, and US:
  - **UK** — BBC iPlayer (free, select matches in 4K UHD) and ITVX (free).
  - **US** — FOX/FS1 and Telemundo (free over-the-air) and Peacock (subscription); the list narrows to the channels ESPN says carry each specific match.
  - **India** — ZEE5 (main broadcaster, streaming) and Unite8 HD on Tata Play (DTH).
  - Plus Canada and Australia free-to-air options.
- Only legitimate rights-holders are linked (no unauthorized streams). Availability and 4K for 2026 are indicative and editable in `src/data/broadcasts.ts`.

## [1.2.0] — 2026-06-08 — Depth, format & platform

### Added
- **Match detail panel** with sub-tabs (parsed from the ESPN summary payload):
  - **Lineups** — formations, starters and substitutes; follow a player from here.
  - **Stats** — possession, shots, on-target, corners, fouls, cards, offsides, saves as comparison bars.
  - **Head-to-head** — recent meetings between the two teams.
- **Best third-placed teams** table (Groups tab) — the live 8-of-12 qualification race that decides the Round of 32.
- **Dynamic bracket** — Round-of-32 fixtures fill in from live standings; winner/runner-up resolved, third-place slots show qualifying candidates (`*` = provisional while a group is unfinished).
- **Head-to-head tiebreakers** in group standings (Pts → GD → GF → H2H).
- **Follow individual players** — star players from any squad (squad browser) or from match lineups; their matches surface in *My Teams* and their events are highlighted.
- **Foreground live alerts** — opt-in browser notifications for goals, kickoff, and full-time (scope: My teams / All matches).
- **Installable PWA + offline** — web manifest, app icons, and a service worker that caches the shell + bundled schedule.
- **Shareable / deep-linkable URLs** — a Share button copies a link that opens a specific match; the active tab is reflected in the URL.
- **Localized "where to watch"** — region picker (US / UK / IN / CA / AU / International) shows the relevant broadcaster instead of US-only listings.
- **Venue map links** in stadium info.

### Changed
- Live polling is now **adaptive** — ~12s while any match is in play, ~45s otherwise.
- Accessibility: ARIA live region for live updates, keyboard-friendly controls, and `prefers-reduced-motion` support.

### Not included (intentional)
- Background push notifications (require a server/serverless component).
- Tournament Golden Boot leaderboard (no ready ESPN endpoint; needs per-match aggregation).

## [1.1.0] — 2026-06-08 — Reminders & live commentary

### Added
- **Country picker** (*My Teams* tab) — checkbox selector for all 48 nations with top footballing nations grouped first, search, and bulk select/clear.
- **Calendar reminders** — `.ics` export embeds VALARM reminders at configurable lead times (1 week, 1 day, 3 hours, 1 hour, 15 min, at kickoff) for selected countries' matches or all 104.
- **Live commentary & events** — expandable per-match panel showing ESPN key events (goals, cards, substitutions with minute + team) and a running commentary feed; auto-refreshes while a match is live.

## [1.0.0] — 2026-06-08 — Initial release

### Added
- Full **104-match schedule** grouped by day with filters (Today / Live / Upcoming / Finished, by group, by stage, search).
- **Time-zone selector** (IST, ET, PT, BST, CET, JST, AEST, … or auto-detect) converting every kickoff, with part-of-day chips (early morning → midnight).
- **Country flags**, **venues with stadium tidbits**, and broadcast info.
- **Live ticker + scores** via ESPN's public API (no key); countdown to the next match before kickoff.
- **Group standings** computed live from results.
- **Knockout bracket** (Round of 32 → Final + third place).
- **Favorite teams** — pin/highlight, persisted locally.
- **Calendar export** to `.ics` (favorites or all matches).
- Responsive desktop + mobile, dark theme. Deployed to GitHub Pages.
