# Changelog

All notable changes to the World Cup 2026 Tracker. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); dates are 2026.

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
