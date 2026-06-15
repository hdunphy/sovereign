# Sovereign — Implementation & Porting Plan

**Audience:** the next developer/agent taking over Sovereign from this scaffold.
**Source of truth for design:** `../Sovereign_MVP_GDD.md` (the GDD; section refs below like "§4" point to it).
**Source of reusable code:** the sibling `caravan-and-kingdom/` project (referred to as **C&K**).

This document explains (1) the architecture, (2) what already exists in the scaffold, (3) a milestone-by-milestone build plan mapped to the GDD, and (4) a **file-by-file porting map** stating exactly which C&K files and code apply and whether to port them as-is, adapt them, or write fresh.

> **Updated for GDD revision (June 2026).** Two design additions are now folded in: §4's **market-ready data model** directive (build the data model for the post-MVP supply/demand market *now*, ship it abstracted) and §5's **Happiness / Strikes / Stability** subsystem (which is *in* MVP scope — it gives the Tax and Life-Support sliders their downside and feeds Authority regen). Both are reflected in the scaffold and called out below.

---

## 0. TL;DR — why C&K is the right donor

C&K already solves, in production-tested code, four of the hardest problems the GDD calls for:

1. **A deterministic, headless, render-decoupled tick loop** (GDD §11) — C&K's `gameLoop.ts` + `rng.ts` + `serialize.ts`.
2. **A non-deadlocking autonomous governor** with self-documenting reasons (GDD §5) — C&K's `governors/` parallel architecture. The GDD explicitly *collapses* C&K's four governors into one thin strategic step + one reusable local builder for MVP, bringing back the tiered version only post-MVP.
3. **Diplomacy with persistent relationship memory, personalities, pacts, embargoes, war, and exhaustion-driven peace** (GDD §8, §6) — C&K's `diplomacy/` package. The single most directly reusable subsystem and "the heart of the drama."
4. **Reactive events with choice forks and timed modifiers** (GDD §7) — C&K's `systems/events.ts`.

The things C&K does **not** give us — the real new work:

- **Node-graph galaxy** instead of a hex grid (GDD §5). Replaces `hex.ts`, `pathfinding.ts`, `worldgen.ts`, and the terrain half of `renderer.ts`.
- **Authority — the King's Will** (GDD §3), a scarce currency gating every player action. C&K has no analog (it used a free-flowing gold treasury). Authority is the spine that makes this a watch-sim, not a clicker — a first-class new subsystem, not a reskin of gold.
- **Happiness / Strikes / Stability** (GDD §5). C&K has nothing like it. Per-system happiness gives the Tax/Life-Support sliders their downside, scales output as a gradient, and rolls up into empire Stability that modulates Authority regen. New subsystem; scaffolded.
- **Market-ready data model** (GDD §4). The live supply/demand market is the flagship *post-MVP* feature, but the GDD requires the **data model be built market-ready now** so the market is a slot-in upgrade, not a rewrite. Scaffolded: every `StarSystem` carries `stockpiles` + a `prices` hook the MVP reads as flat.

Also new but smaller: **abstracted trade-as-income** (GDD §4) replaces C&K's physical caravan agents, and **auto-resolve combat** (GDD §6) replaces C&K's soldier-agent sieges.

---

## 1. Architecture

Same spine as C&K (GDD §11 mandates it):

- **Pure sim core** in plain TS under `src/sim/` and `src/core/`. No DOM, no React. Deterministic given a seed.
- **Thin view** in `src/ui/` (Svelte + Canvas 2D) that reads world state and never mutates it except through the explicit lever/diplomacy entry points in `sim/levers.ts`.
- **Fixed-order tick** in `gameLoop.ts:step(world)`. The loop in `main.ts` advances the sim on a fixed-step accumulator decoupled from the Svelte render — so pause and speed multipliers are free, and the headless harness runs the identical `step()`.

**Tick order (Sovereign):**
```
Happiness -> Extraction -> Metabolism -> Governor (every 10) -> Trade
  -> Court (every 50) -> Combat -> Stability/Authority regen -> Events
```
Mirrors C&K's `Extraction -> Metabolism -> Movement -> AI -> Logistics -> Combat -> Maintenance`, with movement/logistics dropped (no physical agents) and Happiness/Trade/Authority slotted in.

**Two cross-cutting subsystems added since the original plan:**

- **Happiness / Strikes / Stability (GDD §5).** `happinessSystem` (in `systems/colonyEconomy.ts`) moves each colony's `happiness` toward a target derived from the Tax and Life-Support sliders, with lag (no threshold flicker). `extractionSystem` multiplies output by a happiness **gradient**; below `STRIKE_FLOOR` the system is fully **struck** (0 output). Critical invariant (enforced by design, must be preserved): a strike is a **stable floor, not a spiral** — output suppression must **never** feed back into happiness, so a system always recovers once the cause is eased. `gameLoop` rolls system happiness up into each faction's `stability`, which scales Authority regen (a content empire grants more political room).

- **Market-ready data model (GDD §4).** Every `StarSystem` carries `stockpiles: Stock` and `prices: Stock`. Production accrues into `stockpiles` (via `sim/market.ts:deposit`), upkeep is drawn from them (`withdraw`), and `priceOf()` is the single price hook — **flat in the MVP**, dynamic when the live market lands. Build everything that touches goods through `sim/market.ts` so the supply/demand market (per-system scarcity pricing, arbitraging merchants) is a slot-in upgrade rather than a rewrite.

**Determinism rules (port these habits from C&K — not optional):**
- All randomness goes through `world.rng` (the ported mulberry32). Never `Math.random()` in sim code.
- Iterate collections in a fixed order (ids ascending; `Object.keys(...).sort()` before consuming a map of pair-keys, as C&K's Court does).
- Derived indices (`colonyById`, `coloniesByFaction`) are rebuilt at the top of every tick and never serialized.
- When the live market is built, **smooth/lag price changes** to prevent oscillation and update prices in a **fixed system iteration order** (GDD §4).
- The headless harness runs the loop twice on one seed and asserts byte-identical saves. Keep it green.

---

## 2. What the scaffold already contains

Everything below compiles (`npm run typecheck` clean), builds (`npm run build`), and runs (`npm run test:headless` -> `DETERMINISM OK`). Stubbed logic is marked with `TODO`.

| File | State | Notes |
|---|---|---|
| `src/core/rng.ts` | **Done (ported verbatim)** | Determinism depends on this exact generator. Do not change. |
| `src/core/graph.ts` | **Done** | Node-graph math: `neighbors`, `hops` (BFS distance), `path` (BFS route), `withinReach` (tether). Replaces C&K `hex.ts` + `pathfinding.ts`. |
| `src/core/constants/*` | **Done (values are placeholders)** | `economy` (now incl. happiness knobs), `diplo` (ported+trimmed), `authority` (new), `factions` (3 GDD personalities), barrel. Tune last (GDD §11 milestone 8). |
| `src/types.ts` | **Done** | Full domain types incl. system `stockpiles`/`prices` (market-ready), colony `happiness`, faction `stability`. |
| `src/sim/gameLoop.ts` | **Done (calls into stubs)** | Tick spine + index rebuild + stability roll-up + elimination sweep. Orchestration is real; some systems it calls are stubbed. |
| `src/sim/economy.ts` | **Done** | Faction stock + Authority accessors (regen takes a `stability` multiplier). |
| `src/sim/market.ts` | **Done (flat hook)** | `priceOf` (flat), `deposit`/`withdraw` into system stockpiles. The market-ready chokepoint (GDD §4). |
| `src/sim/policy.ts` | **Done** | `policyOf()` — the "read sliders as plain data" discipline ported from C&K. |
| `src/sim/chronicle.ts` | **Done** | The Chronicle log sink (GDD §9). |
| `src/sim/serialize.ts` | **Done (ported pattern)** | Save/load; Map<->entries, rngState, drop indices. |
| `src/sim/worldgen.ts` | **Functional, needs polish** | Connected node graph; seeds systems with stockpiles/prices + colonies with happiness. `TODO`: connectivity guarantee (MST), nicer layout. |
| `src/sim/systems/colonyEconomy.ts` | **Functional** | `happinessSystem` (slider-driven, lagged, no spiral), `extractionSystem` (gradient output -> system stockpiles), `metabolismSystem` (upkeep from stockpiles). Simplistic; tune with the economy. |
| `src/sim/diplomacy/relations.ts` | **Done (ported)** | Relations, state, embargo/pact/allies, grudges (memory). Most directly reusable file. |
| `src/sim/diplomacy/court.ts` | **Stub (structure ported)** | Trade->relation + drift done; per-persona decisions `TODO`. |
| `src/sim/diplomacy/war.ts`, `peace.ts` | **Stub** | `declareWar`/`makePeace` work; AI war-council + exhaustion `TODO`. |
| `src/sim/diplomacy/combat.ts` | **Stub** | Auto-resolve rule sketched in comments; not implemented. |
| `src/sim/governor.ts` | **Stub (architecture in place)** | Strategic split + per-colony executor loop exist; utility option-set is `TODO`. This is why colonies don't grow yet. |
| `src/sim/levers.ts` | **Done** | Authority-gated sliders/edicts/diplomacy entry points (GDD §3, §4). |
| `src/sim/systems/trade.ts` | **Stub** | Flat flow between trade-eligible pairs; `TODO`: tariffs, agreements, route safety, tradeCounts. |
| `src/sim/systems/events.ts` | **Stub (structure ported)** | One sample event + modifier system + auto-resolve; `TODO`: state-weighted table + fork consequences. |
| `src/ui/*` | **Minimal but live** | Svelte `App`, `MapCanvas` (lanes + systems), `ControlBar` (Authority + speed), `Chronicle` feed, ported `camera`. `TODO`: pan/zoom/click, the Levers panel. |
| `test/headless.ts` | **Done (ported)** | Determinism harness; prints colonies/authority/stability per faction. |

---

## 3. Build plan — milestones mapped to the GDD

### Milestone 1 — Sim skeleton *(mostly done in scaffold)*
Tick loop, node graph, 3 resources, colonies that grow; happiness gradient + market-ready stockpiles wired.
- **Remaining:** make `governorSystem` actually expand/build so a single colony grows and founds outposts within tether reach. Production already flows into `system.stockpiles` via `market.ts` — keep new resource flows going through that chokepoint.
- **Lean on:** C&K `governors/civil.ts`, `governors/index.ts` (`evaluateGoal`).

### Milestone 2 — Governor *(the core of "watch it live")*
Utility scoring, autonomous settle/build, Chronicle logging with reasons (GDD §5).
- Implement the per-colony utility-picker in `governor.ts:executeColony`: score a small option set (build extractor, upgrade tier, found outpost in reach, queue fleet) drawing from the pre-split budget pools, pick the best, **log one reason line**. Keep the budget pre-partitioned so no colony stalls the shared pot. Fixed colony iteration order for determinism.
- Builds should spend from `system.stockpiles` (market-ready) where they consume goods.
- **Lean on:** C&K `governors/civil.ts` (build-priority ladder, `pay`/`canAfford` discipline), `governors/index.ts:evaluateGoal`.

### Milestone 3 — Map render (GDD §5, "Commander's Table")
Canvas node graph, system glow, fleet glyphs, drifting merchant glyphs.
- Extend `MapCanvas.svelte`: pan (drag), zoom (wheel), click-to-inspect a system (show its stockpiles/prices/happiness). Render fleets + ambient merchant glyphs along active lanes (visual only).
- **Lean on:** C&K `renderer.ts` (camera transform, viewport culling, `smoothPos`), C&K `main.ts` (pan/zoom/click handlers), `ui/camera.ts` (ported).

### Milestone 4 — Levers (GDD §3, §4, §5)
Authority economy, 4-5 sliders, ~3 edicts, **plus the happiness/stability feedback that gives sliders their bite**.
- Build the `<Levers/>` Svelte panel calling `sim/levers.ts` (already implemented): sliders with the free deadband, edict buttons, Authority cost previews.
- Make the Tax and Life-Support sliders visibly drive system happiness (already wired in `happinessSystem`), and surface empire **Stability** + its effect on Authority regen. Fold war weariness, events, and edicts (Largesse +, Crackdown -) into the happiness target (`TODO` in `happinessSystem`).
- **Design check (GDD §5):** keep every failure state recoverable — a struck system must always climb back once the cause is eased. Never let output suppression lower happiness.
- **Lean on:** C&K `policy.ts` + `constants/factions.ts` `DEFAULT_POLICY` (port the "policyOf as the only edict surface" discipline), C&K `ui/hud/*` for panel patterns.

### Milestone 5 — Diplomacy + AI personalities (GDD §8) *(highest-leverage port)*
Relationship memory + the 5 diplo actions (trade/ally/embargo/war/peace).
- Finish `court.ts`: per-persona behavior (Swarm expands + resents being boxed in via border-friction; Megacorp chases pacts + pays tribute to avoid war, furious at embargoes; Fallen ignores neighbors until provoked, then devastating). Convert `tradeCounts` into relation gains; sign/expire pacts; trigger embargoes + wars off relation thresholds + traits.
- **Lean on (port heavily):** C&K `diplomacy/court.ts`, `diplomacy/relations.ts` (ported), `diplomacy/peacetime.ts` (gifts), `constants/diplo.ts` (ported+trimmed).

### Milestone 6 — War (GDD §6)
Auto-resolve combat, fleets dispatched by doctrine (the Military slider).
- Implement `combat.ts`: group fleets by system; where warring factions meet, resolve by `power +/- COMBAT_RANDOM`; apply losses, possibly flip system ownership (capture), log to Chronicle, apply diplomatic fallout + grudges. Governor dispatches fleets from the Military pool per the doctrine slider.
- War exhaustion in `court.ts`/`peace.ts` drives the AI to sue for peace; truce + lingering grudge follow.
- **Lean on:** C&K `diplomacy/combat.ts` (resolution math, capture, ownership flip — *simplify hard*: drop sieges/troops/pillaging), `diplomacy/war.ts`, `diplomacy/strength.ts`, `diplomacy/peace.ts`.

### Milestone 7 — Events (GDD §7)
Reactive table weighted by state, choice forks.
- Expand `events.ts`: replace the flat roll with a **state-weighted** table (at war -> mutinies/war heroes/supply crises; rich & peaceful -> corruption/piracy/decadence). Implement each fork's consequences in `resolveEventChoice`, logging the outcome. Events can also nudge happiness (a fork hook into §5).
- **Lean on:** C&K `systems/events.ts` (modifier lifecycle, fork data shape, AI auto-resolve, `getModifier`), C&K `projects.ts` (`enactProject` for player reach-ins).

### Milestone 8 — Tuning pass (GDD §3, §5, §11)
Authority costs/regen, pacing, the slider deadband, **and the happiness curve** (tax penalty, subsidy bonus, strike floor, sweet-spot bonus).
- Tune `constants/authority.ts`, `economy.ts` (incl. the `HAPPINESS_*`/`STRIKE_FLOOR`/`OUTPUT_SWEET_SPOT` knobs), `diplo.ts`. The deadband sets the entire tempo — tune it **last**.
- **Lean on:** C&K's `planning/` balance docs + the evolve/diag harness pattern (`tools/`, `*diag.mjs`).

### (Post-MVP) Flagship — the live supply/demand market (GDD §4, §10)
Not in MVP, but the data model is ready. When built: derive `system.prices` from local stockpile scarcity (low stock -> high price), smoothed/lagged to prevent oscillation, in fixed iteration order; add arbitraging merchants that buy low / haul / sell high. Because everything goods-related already routes through `sim/market.ts`, this slots in. A struck system (§5) stops producing -> local scarcity -> price spike -> merchants swarm: the mechanics compose for free.

---

## 4. File-by-file porting map (C&K -> Sovereign)

Legend: **PORT** = copy with minimal/no change · **ADAPT** = same logic, reworked · **REPLACE** = concept dropped, new file does the GDD's version · **NEW** = no C&K analog · **DROP** = not in MVP.

### Core
| C&K file | Action | Sovereign target | Why |
|---|---|---|---|
| `core/rng.ts` | **PORT (done)** | `core/rng.ts` | Determinism depends on the exact generator. |
| `core/hex.ts` | **REPLACE** | `core/graph.ts` | Hex axial math -> node-graph BFS/route/reach. |
| `core/pathfinding.ts` (A*) | **REPLACE** | `core/graph.ts` `path()` | BFS over ~20 nodes is sufficient. |
| `core/constants/economy.ts` | **ADAPT (done)** | `core/constants/economy.ts` | 4 resources + roads/tools -> 3 resources + tether/trade + happiness knobs. |
| `core/constants/diplo.ts` | **PORT+trim (done)** | `core/constants/diplo.ts` | Keep relations/pacts/exhaustion; drop siege/soldier knobs. |
| `core/constants/factions.ts` | **ADAPT (done)** | `core/constants/factions.ts` | Trait-scaling ports; roster -> 3 GDD archetypes. |
| `core/constants/terrain.ts`, `tiers.ts` | **ADAPT** | `economy.ts` `TIERS` | Hex terrain dropped; settlement tiers -> colony tiers. |

### Sim spine
| C&K file | Action | Sovereign target | Why |
|---|---|---|---|
| `sim/gameLoop.ts` | **ADAPT (done)** | `sim/gameLoop.ts` | Fixed-order tick + index rebuild + elimination sweep port 1:1; system list changes; stability roll-up added. |
| `sim/serialize.ts` | **PORT+adapt (done)** | `sim/serialize.ts` | Map<->entries + rngState + drop-indices pattern. |
| `sim/economy.ts` | **ADAPT (done)** | `sim/economy.ts` | Single gold treasury -> per-faction Stock + Authority (+ stability-scaled regen). |
| `sim/policy.ts` | **PORT (done)** | `sim/policy.ts` | "policy is the only edict surface" discipline. |
| `sim/settlement.ts` | **ADAPT** | `sim/worldgen.ts:foundColony` (+ a future `colony.ts`) | `foundSettlement`, `log`, `canAfford`/`pay`, `controlledHexes` -> colony/`withinReach` equivalents. |
| `sim/worldgen.ts` | **REPLACE (done)** | `sim/worldgen.ts` | Noise hex island -> scattered connected star graph (with market-ready stockpiles). |
| (none) | **NEW (done)** | `sim/market.ts` | Market-ready price hook + stockpile deposit/withdraw (GDD §4). No C&K analog. |
| (none) | **NEW (done)** | happiness in `systems/colonyEconomy.ts` | Per-system happiness + strike gradient + stability roll-up (GDD §5). No C&K analog. |

### Governors (GDD §5 — collapse 4->1+1)
| C&K file | Action | Sovereign target | Why |
|---|---|---|---|
| `sim/governors/index.ts` | **ADAPT** | `sim/governor.ts` | `aiSystem` orchestrator + `evaluateGoal` -> strategic split + executor loop. |
| `sim/governors/civil.ts` | **ADAPT (primary reference)** | `sim/governor.ts:executeColony` | Build/upgrade/expand priority ladder is the model for the utility-picker. Road-paving DROPPED. |
| `sim/governors/labor.ts` | **DROP (fold in)** | — | No villager job assignment. |
| `sim/governors/trade.ts` | **REPLACE** | `sim/systems/trade.ts` | Caravan dispatch -> abstracted income flow (market-ready). |
| `sim/governors/transport.ts` | **DROP (post-MVP)** | — | Tiered Transport governor returns only when mobile logistics gain depth. |

### Diplomacy (GDD §8, §6 — port heavily)
| C&K file | Action | Sovereign target | Why |
|---|---|---|---|
| `diplomacy/relations.ts` | **PORT (done)** | `diplomacy/relations.ts` | Relations/state/embargo/pact/allies + grudges = memory/story layer. |
| `diplomacy/court.ts` | **ADAPT** | `diplomacy/court.ts` | The faction brain; most valuable single port. Strip soldier micro. |
| `diplomacy/war.ts` | **ADAPT** | `diplomacy/war.ts` | `declareWar`, `pickWarGoal`, `warCouncil`; "recruit soldiers" -> "build fleet". |
| `diplomacy/peace.ts` | **ADAPT** | `diplomacy/peace.ts` | `checkPeace`/`makePeace`, exhaustion-driven. |
| `diplomacy/combat.ts` | **ADAPT (simplify hard)** | `diplomacy/combat.ts` | ~400 lines of sieges -> compact node auto-resolve. |
| `diplomacy/strength.ts` | **ADAPT** | `diplomacy/combat.ts` helpers | `strengthOf`/`armyCap` -> fleet power accounting. |
| `diplomacy/peacetime.ts` | **ADAPT** | `diplomacy/court.ts` | Gifts/garrison -> diplomatic gestures. |
| `diplomacy/helpers.ts` | **ADAPT** | inline | `aliveF`/`settlementsF`/`goldF` -> colony/stock helpers. |

### Systems
| C&K file | Action | Sovereign target | Why |
|---|---|---|---|
| `systems/events.ts` | **PORT+adapt (done)** | `sim/systems/events.ts` | Modifier lifecycle + forks + auto-resolve reusable; re-theme + state-weight. |
| `systems/extraction.ts`, `metabolism.ts` | **ADAPT (done)** | `sim/systems/colonyEconomy.ts` | Positional passive production + pop metabolism; minus hauling; + happiness gradient + market stockpiles. |
| `systems/movement.ts`, `logistics.ts` | **DROP** | — | No physical agents in MVP. |
| `systems/maintenance.ts` | **ADAPT (partial)** | folded into `colonyEconomy`/`court` | Upkeep/wages -> simplified faction upkeep. |
| `sim/projects.ts` | **ADAPT (optional)** | `sim/levers.ts` edicts | `enactProject` is a clean template for player reach-ins. |
| `sim/agents/*` | **DROP** | — | Replaced by abstracted flows; revisit post-MVP for per-ship cargo. |

### UI (Svelte -> Svelte)
| C&K file | Action | Sovereign target | Why |
|---|---|---|---|
| `ui/camera.ts` | **PORT (done)** | `ui/camera.ts` | Pixel-space pan/zoom is map-agnostic. |
| `ui/renderer.ts` | **ADAPT** | `ui/MapCanvas.svelte` | Camera transform, culling, `smoothPos` reusable; hex draw -> lanes+nodes. |
| `ui/main.ts` (input) | **ADAPT** | `MapCanvas.svelte` effects + `main.ts` | Pan/zoom/click/selection. |
| `ui/svelte/App.svelte` | **ADAPT** | `ui/App.svelte` | Layout composition. |
| `ui/svelte/BottomLog.svelte` | **ADAPT** | `ui/Chronicle.svelte` | Log feed -> the Chronicle (first-class, §9). |
| `ui/svelte/DiplomacyMatrix.svelte`, `WarPanel.svelte`, `AnalyticsPanel.svelte`, `Banner.svelte` | **ADAPT** | new Svelte panels | Diplomacy matrix + war panel map to Sovereign's diplo actions. |
| `ui/hud/*` | **ADAPT** | Svelte panels (`Levers`, inspector) | Policy/slider UI + settlement card -> colony/system inspector (show stockpiles/prices/happiness). |
| `ui/svelte/store.ts` | **PORT** | Svelte stores | Re-use Svelte store patterns. |

### Test / tooling
| C&K file | Action | Sovereign target | Why |
|---|---|---|---|
| `test/headless.ts` | **PORT+adapt (done)** | `test/headless.ts` | Determinism + health harness. |
| `tools/evolve.js`, `*diag.mjs` | **ADAPT (later)** | `tools/` | Batch tuning/diagnostics — useful at milestone 8. |
| `planning/*.md` | **REFERENCE** | — | Balance methodology + design rationale, esp. war/economy balance docs. |

---

## 5. Key risks & guidance

- **Don't let Authority become gold.** It is *attention/political capital* (GDD §3): caps, regenerates slowly (scaled by Stability), gates only *active player* decisions. The AI does not spend Authority. If it feels like a second economy resource, the design has drifted.
- **Keep combat an outcome, not an activity** (GDD §6). Resist porting C&K's siege depth. Player agency is "war: yes/no" and "peace: now?"; the rest is spectacle in the Chronicle.
- **The Chronicle is a feature, not a log** (GDD §9). Every governor decision + diplomatic shift produces a readable, reason-bearing line. The #1 anti-rage-quit mechanism — budget real effort for the copy.
- **Preserve determinism at every step.** Run `npm run test:headless` after each change; if `DETERMINISM OK` flips, you introduced unordered iteration or non-`world.rng` randomness.
- **Trade is the relationship** (GDD §4). Diplomacy + economy share one axis (embargo -> tariffed trade -> agreement). Don't model them as separate systems.
- **Build market-ready, ship abstracted** (GDD §4). All goods movement goes through `sim/market.ts`. Keep `priceOf` flat for MVP, but never bypass it — that's what makes the live market a slot-in, not a rewrite.
- **Failure states must be recoverable** (GDD §5). Standing design check on every new system: does the failure state climb back out once the cause is eased, or does it compound? A strike must never lower happiness; the tone stays relaxing.

---

## 6. First three concrete tasks for the next agent

1. **Make the empire grow.** Implement `governor.ts:executeColony` (build/upgrade/found-outpost within reach) using C&K `governors/civil.ts` as the reference, with one Chronicle reason line per decision, spending goods through `market.ts`. Verify a single seed grows from 4 colonies to a spread empire over a few thousand ticks, deterministically.
2. **Make the map legible.** Add pan/zoom/click-to-inspect to `MapCanvas.svelte` and a system inspector (stockpiles, prices, happiness), porting input handling from C&K `main.ts` + `renderer.ts`.
3. **Make the levers bite.** Build the player Levers panel wired to `sim/levers.ts`, surface Stability + Authority regen, and finish `court.ts` per-persona behavior so the player can spend Authority to embargo/ally/war and watch relations (and grudges) shift in the Chronicle.

That sequence gets you to the GDD's one question (§12) — *does presiding over a living empire feel alive?* — fastest.

---

## 7. Tooling note (read before editing files)

The source files were authored to be **ASCII-only** on purpose. When syncing to the editing environment, files that contain non-ASCII characters (e.g. the section sign or em-dash) can be truncated by some file-editing tools at the first such character. Keep `src/` and `test/` ASCII-only; if you must touch a file that contains non-ASCII, verify it round-trips (check the line count / end-of-file) after saving. This markdown doc may use richer characters since it isn't compiled.
