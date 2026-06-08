# 🏆 World Cup 2026 Tracker

A personal, responsive web app to follow the **FIFA World Cup 2026** (USA · Canada · Mexico,
June 11 → July 19, 2026): full schedule, country flags, venues with stadium tidbits, group
standings, the knockout bracket, favorite-team pinning, calendar export — and every kickoff
shown in **your** time zone with a friendly part-of-day label.

## Features

- **Full 104-match schedule** grouped by day, with filters (Today / Live / Upcoming / Finished,
  by group, by stage, and free-text search).
- **Time-zone aware** — pick IST, ET, PT, BST, CET, JST, AEST… (or auto-detect your device).
  Every kickoff converts on the fly and gets a part-of-day chip: 🌅 early morning, ☀️ morning,
  🌤️ afternoon, 🌇 evening, 🌙 night, 🌌 midnight.
- **Live ticker + scores** — pulls from ESPN's public feed. Played and in-progress matches show
  status (LIVE 67′ / FT) and score; before kickoffs the ticker counts down to the next match.
- **Group standings** that compute live from results (Pts → GD → GF).
- **Knockout bracket** (Round of 32 → Final + third-place), filling in as teams are decided.
- **Favorite teams** — star a team to pin/highlight its matches; saved in your browser.
- **Calendar export** — download your matches (or all 104) as an `.ics` file for Google/Apple Calendar.
- **Desktop + mobile** responsive, dark football theme. Your time zone and favorites persist locally.

## Run it

Node.js is required. If you used the project's setup it was installed via [nvm](https://github.com/nvm-sh/nvm);
load it first with `nvm use --lts` if `node` isn't on your PATH.

```bash
npm install      # first time only
npm run dev      # → http://localhost:5173
```

Other scripts:

```bash
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build locally
```

## How it works

- **Static schedule** (`src/data/matches.json`) — all 104 fixtures with UTC kickoff times, venues,
  teams (or knockout placeholders like "Group A 2nd Place"), groups and rounds. Bundled so the app
  works instantly and offline.
- **Live data** (`src/lib/espn.ts`) — calls ESPN's public scoreboard
  (`/apis/site/v2/sports/soccer/fifa.world/scoreboard`). No API key required. In dev, requests go
  through a Vite proxy (`/espn` → `site.api.espn.com`, see `vite.config.ts`) so there are no CORS
  issues. Live status/scores are merged onto the static fixtures, and resolved knockout teams replace
  placeholders automatically.
- **Times** (`src/lib/time.ts`) — pure native `Intl` API, no date library.
- **Flags** — ESPN's country logos (already in the data).

### Regenerating the schedule

The bundled data was generated from ESPN's date-range endpoint:

```
https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=950
```

plus the standings endpoint (`/apis/v2/sports/soccer/fifa.world/standings?season=2026`) for the
group assignments. If FIFA changes a venue or time, re-fetch those and rebuild
`src/data/matches.json` / `src/data/teams.json`.

## Notes & caveats

- ESPN's API is unofficial (no SLA). The bundled schedule means the app never breaks if ESPN
  changes — you just lose live scores until it recovers (the header shows "Offline — showing schedule").
- Group tiebreakers are simplified (Points → Goal Difference → Goals For), not the full FIFA
  head-to-head ruleset.
- Knockout fixtures show placeholders until results decide the teams.

## Project layout

```
src/
  data/        matches.json, teams.json, venues.ts, timezones.ts
  lib/         espn, time, standings, ics, storage, match, types
  hooks/       useLiveScores, useTimezone, useFavorites
  components/  Header, TimezonePicker, LiveTicker, ScheduleView,
               MatchCard, GroupsView, BracketView, FavoritesView
  App.tsx      tab shell + wiring
  index.css    theme + responsive styles
```
