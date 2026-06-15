# AGENT.md - Working notes for AI agents on Sovereign

Read this first. It captures the conventions, commands, and gotchas that aren't
obvious from the code. For the full design see `Sovereign_MVP_GDD.md`; for the
build roadmap and the C&K porting map see `planning/IMPLEMENTATION_PLAN.md`.

## What this project is

Sovereign is a "watch-sim with a crown": an autonomous galactic empire the player
presides over, reaching in only with rare, Authority-gated decisions. It is being
built by porting the proven architecture of the sibling `caravan-and-kingdom/`
(C&K) project onto a node-graph galaxy. The scaffold builds and runs; most sim
logic is stubbed with `TODO`s.

## Commands

```
npm install
npm run dev            # Vite dev server
npm run build          # production bundle (see note on dist/ below)
npm run typecheck      # tsc --noEmit  -- run this constantly
npm run test:headless  # deterministic sim + same-seed verification
npx tsx test/headless.ts 5000 7   # custom ticks / seed
```

After ANY sim change, run `npm run typecheck` and `npm run test:headless`. The
headless run must print `DETERMINISM OK`. If it prints `DETERMINISM FAILED`, you
introduced non-determinism (see below) -- fix it before moving on.

## Architecture in one breath

- Pure, headless, deterministic sim in `src/sim/` + `src/core/`. No DOM/Svelte there.
- Thin Svelte + Canvas 2D view in `src/ui/`, a read-only projection of world state.
- One fixed-order tick: `src/sim/gameLoop.ts:step(world)`. `src/main.ts` drives it
  on a fixed-step accumulator decoupled from rendering, so pause/speed are free and
  the headless harness runs the identical `step()`.

Tick order: Happiness -> Extraction -> Metabolism -> Governor (every 10) -> Trade
-> Court (every 50) -> Combat -> Stability/Authority regen -> Events.

## Determinism is a hard invariant

1. All randomness goes through `world.rng` (seeded mulberry32 in `core/rng.ts`).
   Never use `Math.random()` anywhere in `src/sim/` or `src/core/`.
2. Iterate in a fixed order: object ids ascending; `Object.keys(map).sort()` before
   consuming a map keyed by pair-keys.
3. Derived indices (`colonyById`, `coloniesByFaction`) are rebuilt at the top of
   every tick and never serialized.
4. `serialize.ts` is the source of truth for what state matters; the headless test
   compares two same-seed saves byte-for-byte.

## Conventions specific to this repo

- **Three resources only:** `energy`, `alloys`, `population` (+ `Authority`, +
  `Happiness`/`Stability`). Don't add resources; the GDD deferred the rest.
- **Authority (GDD sec 3) is NOT gold.** It is the player's scarce political
  capital: caps at 100, regenerates slowly (scaled by Stability), and gates only
  *active player* actions via `sim/levers.ts`. The AI never spends Authority.
- **Market-ready data model (GDD sec 4).** Every `StarSystem` has `stockpiles` and
  `prices`. ALL goods movement goes through `sim/market.ts` (`deposit`, `withdraw`,
  `priceOf`). `priceOf` is flat for the MVP; do not bypass it -- routing through it
  is what makes the post-MVP live market a slot-in upgrade instead of a rewrite.
- **Happiness / Strikes / Stability (GDD sec 5).** Per-colony `happiness` scales
  output as a gradient; below `STRIKE_FLOOR` output is 0 (a "strike"). Hard rule:
  output suppression must NEVER lower happiness -- a strike is a recoverable floor,
  not a death spiral. Standing design check on every new mechanic: is the failure
  state recoverable, or does it compound? It must be recoverable.
- **Sliders/edicts enter the sim only as data** via `policyOf()` (`sim/policy.ts`).
  Governors/systems read knobs through it; never read UI state in sim code.
- **The Chronicle (GDD sec 9) is a feature, not a log.** Every governor decision and
  diplomatic shift should append one readable, reason-bearing line via
  `chronicle(world, kind, msg, factionId)`.
- **Combat is an outcome, not an activity (GDD sec 6).** Keep it auto-resolved at
  nodes; do not port C&K's siege/troop depth.

## Porting from Caravan & Kingdom

The sibling `caravan-and-kingdom/` repo is the donor codebase. Before writing a
subsystem, open the corresponding C&K file -- most of the hard problems are already
solved there. The exact PORT / ADAPT / REPLACE / NEW / DROP decision for every C&K
file is tabulated in `planning/IMPLEMENTATION_PLAN.md` section 4. Highest-value
ports: `diplomacy/` (relations + court), `gameLoop.ts`, `systems/events.ts`,
`governors/civil.ts`.

## GOTCHA: keep source files ASCII-only

Some file-editing tools truncate a file at the first non-ASCII byte (the section
sign, em-dash, check-mark, etc.) when saving across the workspace mount. This
silently cuts off the rest of the file and breaks the build with confusing parse
errors (`'}' expected`, `Unterminated string literal`) on lines that look fine.

Rules:
- Keep everything in `src/` and `test/` strictly ASCII. Use "section 5" not the
  section sign; "->" not arrows; "-" not em-dashes.
- If you must edit a file that already contains non-ASCII, verify it round-tripped
  after saving: check `wc -l` / the last line on disk, not just the editor view.
- To scan for stray non-ASCII: `grep -rlP '[^\x00-\x7F]' src test`.
- Markdown docs may use richer characters since they aren't compiled, but if a tool
  truncates one, rewrite it via a shell heredoc instead.

## GOTCHA: `npm run build` and the dist/ folder

On this workspace mount, Vite sometimes can't delete an existing `dist/` (a
filesystem quirk, not a code error). If `build` fails in `emptyDir`/`rimraf`,
build to a temp dir to confirm the bundle compiles:
`npx vite build --outDir /tmp/sov-dist --emptyOutDir`. `dist/` is gitignored.

## Current state / where to start

The scaffold compiles, type-checks, runs deterministically, and renders a static
map. Colonies do not grow yet because `sim/governor.ts:executeColony` is a stub.
The recommended first three tasks are in `planning/IMPLEMENTATION_PLAN.md`
section 6: (1) make the empire grow (governor), (2) make the map legible
(pan/zoom/inspect), (3) make the levers bite (Levers panel + court personalities).
