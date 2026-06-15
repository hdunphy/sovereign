# Sovereign

A "watch-sim with a crown" (GDD MVP). You are the immortal sovereign of a galactic empire that grows on its own — you preside, watch it live, and reach in only when it matters. Spiritual successor to the *Caravan and Kingdom* prototype, reusing its proven deterministic-sim + parallel-governor + diplomacy-with-memory architecture on a node-graph galaxy.

## Status

**Scaffold stage.** The project builds, type-checks, and runs a deterministic headless loop, but most sim logic is stubbed with `TODO`s. See `planning/IMPLEMENTATION_PLAN.md` for the full build plan and the file-by-file porting map from Caravan and Kingdom.

## Run it

```
npm install
npm run dev            # Vite dev server (http://localhost:5173)
npm run build          # production bundle in dist/
npm run typecheck      # tsc --noEmit
npm run test:headless  # deterministic headless sim + same-seed verification
```

`?seed=123` selects a specific galaxy.

## Layout

```
src/core/        rng (ported), graph (node-graph math), constants/ (split by concern)
src/sim/         worldgen, gameLoop (tick spine), governor, levers, economy,
                 diplomacy/ (relations, court, war, peace, combat), systems/ (trade, events, colonyEconomy)
src/ui/          React + Canvas 2D: App, MapCanvas, ControlBar, Chronicle, camera
src/types.ts     shared domain types (World, StarSystem, Lane, Colony, Fleet, Faction, Diplo, …)
test/            headless determinism harness
```

## Stack

React + TypeScript + Vite, Canvas 2D for the map. Hard split between a deterministic headless sim (plain TS) and the React/Canvas view, exactly as the GDD §11 requires.
