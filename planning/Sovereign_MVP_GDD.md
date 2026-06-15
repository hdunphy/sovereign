# SOVEREIGN — MVP Design Document
*(working title — placeholder, swap freely)*

**One line:** You are the immortal sovereign of a galactic empire that grows on its own. You don't fly ships or build factories — you preside. Watch it live, and reach in only when it matters.

---

## 1. Design Thesis & Fun Hypothesis

This is a **watch-sim with a crown**, not a strategy game. The predecessor (*Void Conquest*) was too click-intensive; this is the deliberate opposite. The empire runs itself through an autonomous **Governor**. The player's job is to sit at the strategic table, watch it grow, and make a small number of weighty decisions — mostly diplomatic — then lean back and watch the consequences unfold.

**Three pillars:**
1. **Legible & alive** — you always understand what you're seeing, and it still surprises you.
2. **Rare decisions that bite** — few levers, pulled seldom, each one genuinely swinging your empire's trajectory.
3. **A story, not a scoreboard** — rival personalities, grudges, and consequences that ripple turns later, so a playthrough reads like the chronicle of a reign.

**The fun hypothesis the MVP must validate:**
> *Presiding over a living empire — making rare, weighty choices (above all, who to trade with, ally, embargo, or war) and watching them play out — is relaxing AND interesting enough to keep watching.*

Everything below is either in service of testing that, or explicitly cut until it's proven.

---

## 2. The Core Loop

There is no per-minute clicking. The loop is:

1. **Watch** the empire grow on the star map (colonies spread, fleets move, resources tick).
2. **Notice** a change in the world — a rival's fleet massing, an event fork, a souring relationship, a slider that's now mispriced for your situation.
3. **Spend Authority** to reach in: a diplomatic move, an edict, or a policy adjustment.
4. **Watch the consequences** roll out over the following ticks via the Chronicle.

Authority (Section 3) is what physically prevents this from becoming twitchy. You *can't* fiddle constantly, so each reach-in feels chosen.

---

## 3. Authority — The King's Will

The spine of the whole design. A single scarce currency representing the sovereign's finite attention and political capital.

- **All active decisions spend it:** declaring war, forming alliances, trade pacts, embargos, edicts, and hard policy swings.
- **It regenerates slowly,** so the gaps between your interventions *are* the watching part.
- **It caps,** so you can't hoard infinitely — pressure to use it, gently.

### Starting numbers (placeholders, to tune)
- Pool cap: **100**
- Regen: **~2 / tick**, modified by Stability (a stable, content empire grants more political room)
- Costs:

| Action | Cost | Why this band |
|---|---|---|
| Trade agreement | 15 | Cheap; the everyday tool |
| Embargo | 25 | Aggressive but reversible |
| Issue edict | 20–40 | Variable by edict |
| Form alliance | 50 | Big commitment |
| Declare war | 60 | ~half a month of saving — can't war-spam |
| Hard slider swing | ~5 / notch beyond a free deadband | Small nudges are free; big shifts cost |

The *deadband* matters: small slider tweaks are free so you're never punished for tuning, but yanking a slider hard is a real decision. This is the knob that sets the entire tempo of the game — tune it last, once the loop exists.

---

## 4. The King's Levers

Three categories, each playing a different role: a **standing posture** (sliders), **deliberate reach-ins** (edicts), and **relationships** (diplomacy — the heart).

### Diplomacy (the heart of the drama)
The part of the game with other minds reacting to you. MVP set:
- **Trade agreement** — waives/reduces this partner's tariff, grows trade volume both ways, steadily builds goodwill; precondition for alliance.
- **Alliance** — mutual defense; dragged into each other's wars.
- **Embargo** — hard-cut a rival's trade; damages their economy, angers them.
- **Declare / sue for peace** — start or end a war.

Each AI empire **remembers**: betrayals, broken pacts, and past wars persist as relationship modifiers (Section 8). This is where your story lives, so it gets the most attention.

#### Trade Model — always-on, modulated by relationship
Trade is **not** gated by agreements. By default, merchant vessels flow along any open lane and commerce hums across the galaxy — the map is economically alive before you touch anything. The king modulates this living system rather than switching it on:

> **Embargo** (hostile, hard off) → **default tariffed trade** (neutral) → **Trade Agreement** (low/zero tariff, goodwill, alliance precursor)

Trade *is* the relationship, expressed economically. Diplomacy and the economy share one axis.

**The target is a real economy, not abstraction.** Intended system: each system holds per-resource **stockpiles**; local **prices** form from scarcity (low stock → high price); **merchants buy low, haul, and sell high**, with prices settling as goods move. The king's levers then bite for real — tariffs distort routes, embargos starve import-dependent systems, wartime blockades spike prices in cut-off systems — and emergent stories fall out ("the war tripled alloy prices on Vega").

This is the **flagship post-MVP feature**, deferred for one reason: a live market is the most tuning-volatile subsystem in the design (price oscillation, starvation cascades, route freeze), and dropping it into the MVP would add a large confounding variable to an experiment meant to isolate *does presiding feel good?* A market bug must never masquerade as a design failure.

So the MVP ships an **abstracted income flow** — net trickle scaled by surplus, partner demand, tariff/agreement modifiers, and route safety — visually represented by merchant glyphs. **But the data model is built market-ready now:** every system carries per-resource stockpiles and a price hook the MVP reads as flat, so the market is a slot-in upgrade, not a rewrite. (When built: smooth/lag price changes to prevent oscillation; fixed iteration order for determinism.)

### Policy Sliders (your default stance)
A slider is only a decision if **both directions cost you something.** MVP sliders, all with real tension:
- **Tax Rate** — income ↑ vs. population happiness/growth ↓
- **Military Rate** — pop diverted into ships ↑ vs. economy/growth ↓
- **Expansion Drive** — settle fast & overstretch vs. consolidate & stay safe
- **Life-Support Subsidy** — cheap angry miners vs. expensive content ones
- **Tariff Stance** — revenue per trade now ↑ vs. trade volume + partner goodwill ↓ (your global protectionism; trade agreements override it per-partner)

*Deliberately excluded:* a plain "research" slider or anything where more = strictly better. Those feel like choices but aren't — they're filler.

### Edicts (the deliberate reach-in)
Spend Authority + immediate resources for a short, punchy bonus. Examples:
- **Mobilization** — temporary military output surge.
- **Largesse** — burn resources for a happiness/stability spike.
- **Crackdown** — suppress unrest now, breed resentment later.

Edicts are the verbs of kingship — the moment you actually *do* something rather than set a posture.

---

## 5. The Living Simulation (what you watch)

### The Galaxy — a node graph
Star systems are **nodes**; hyperlanes are **edges**. No grid. ~15–25 systems for MVP. Sparse points of light in black space — sleek, dark, glowing, data-driven (the "Commander's Table" look).

### The Economy (kept tiny for MVP)
Three resources only: **Energy** (operations/upkeep), **Alloys** (ships & infrastructure), **Population** (grows; fuels economy and military). Plus **Authority**. Everything from the original doc's resource sprawl is deferred.

Merchant vessels flow along open lanes by default (see Trade Model, §4), rendered as drifting freighter glyphs — Governor-run ambient life on the map that needs zero player input. In wartime these routes are raidable (see §6).

### The Governance Layer (strategic priorities + concurrent local builders)
**Not one serial decision-maker** — that pattern deadlocks: it holds the treasury hostage waiting on a single choice and serializes work that should happen simultaneously. Instead, two decoupled layers:

**Strategic step (thin, once per tick):** the player's sliders translate into a split of incoming resources across a few **budget pools** — Expansion / Infrastructure / Military. The human is doing most of the strategic work via sliders, so the AI here is minimal.

**Execution step (concurrent):** each colony runs the *same* small utility-picker against its own local options, drawing only from the relevant pool. N colonies decide in parallel each tick, so settling, building, and ship production all proceed at once. Because the budget is pre-partitioned, **no decision can hold the shared pot hostage** — any stall (a colony saving toward an expensive build) is *local and bounded* to that colony's pool, never a global freeze. Determinism holds via a fixed colony iteration order.

This isn't four governor AIs — it's one tiny strategic function plus *one* reusable local-builder run once per colony.

Each decision logs a one-line reason to the Chronicle ("Vega III: Hab-Dome — fastest in-reach pop growth"), making the AI self-documenting and killing the #1 rage-quit moment in indirect-control games: *not understanding why the sim did the thing.*

**Why no job-ticket logistics or tiered governors yet:** extraction here is *positional and passive* (a mining station produces per tick — nothing traverses to fetch it), and the only mobile agents — freighters and fleets — are abstracted for MVP. The full tiered-governor + ticketed-logistics architecture (proven anti-deadlock in a prior project) earns its place when mobile logistics gain real depth: the post-MVP Transport governor and per-ship cargo.

### The Tether (simplified)
Colonies project operational reach a few jumps along the graph. The Governor can only settle/operate within reach. Losing a frontier node strands assets — but attrition **ramps over several ticks** with a slow crawl-home option, so it's a tense scramble, not an instant death spiral. (This fixes the original doc's −90%-and-die problem.)

### Happiness, Strikes & Stability
Per-system **Happiness** is the feedback channel that gives the Tax and Life-Support sliders their downside — without it, high tax is free money. Drivers: tax rate, life-support subsidy, war weariness, events, and edicts (Largesse ↑; Crackdown ↓ later).

The consequence is a **gradient, not a cliff.** As happiness falls, the system's output scales down; only at rock bottom does it fully **strike** (zero production). The gradient avoids threshold flicker, and a mild bonus *above* neutral gives the sliders a sweet spot to hunt rather than only a disaster to avoid — "find the optimum," not "don't screw up."

Critically, a strike is a **stable floor, not a spiral:** it suppresses output but **never further lowers happiness**, so a system always recovers once the cause is eased (lower tax, raise subsidy, end the war, spend Largesse). Mistakes stay reversible — the tone stays relaxing. *(Standing design check on every new system: is the failure state recoverable, or does it compound?)*

System happiness rolls up into empire-wide **Stability**, which feeds Authority regen (§3) and, **post-MVP**, rebellion risk: sustained low happiness escalates strike → revolt (a system breaks away / must be re-subjugated). The strike is the warning shot before the gun.

*Forward-compat:* once the live market exists (§4), a struck system stops producing its resource → local scarcity → price spike → merchants swarm in. The mechanics compose for free.

---

## 6. Combat as Outcome (NOT an activity)

The king does not fight battles. You declare war and set doctrine via the Military slider; the Governor builds and dispatches fleets autonomously. When fleets meet at a node, combat **auto-resolves** (fleet power + random factor), producing:
- ship losses,
- possible territory change,
- a Chronicle entry,
- diplomatic fallout.

You *watch* the war unfold and decide when to sue for peace. No orbital/planetary siege layers, no troop transports, no bombardment micro — all deferred. The decision (war: yes/no; peace: now?) is where your agency lives; the execution is spectacle.

---

## 7. Events (reactive + choice, not pure random)

Events are the surprise engine, but weighted by your **current state** so the world feels responsive:
- *At war* → mutinies, war heroes, supply crises.
- *Rich & peaceful* → corruption, piracy, decadence.

The best events present a **fork** ("crush the rebel governor / accept his terms") whose consequences you then watch play out. That's the king deciding — the active ingredient that makes watching feel earned.

---

## 8. Diplomatic AI & Personalities

Reuse the archetypes as personality profiles driving the diplomatic AI:
- **The Swarm** — expansionist, reckless, settles everything; resents being boxed in.
- **The Megacorp** — mercantile; loves trade pacts, hates embargos, will buy mercenaries.
- **The Fallen Empire** — isolationist; ignores you until provoked, then devastating.

Each tracks a **relationship score** with memory: trade and shared wars raise it; betrayals, embargos, and broken pacts lower it and *persist*. This memory is what turns "an AI declared war" into "the Megacorp never forgave the embargo of '47."

---

## 9. The Chronicle (the legibility layer)

A running feed in the corner — but written like a **chronicle of your reign**, not status pings. It surfaces governor reasoning, diplomatic shifts, combat outcomes, and event results. This single feature does double duty: it's how you stay oriented in a slow sim, *and* it's where the emergent story accumulates. Treat it as a first-class feature, not decoration.

---

## 10. MVP Scope — In / Out

**IN (the minimum that tests the fun hypothesis):**
- Node-graph galaxy (~20 systems)
- 3 resources + Authority
- One utility-driven Governor with logged reasoning
- Simplified tether
- 4 sliders, ~3 edicts
- Diplomacy: trade / ally / embargo / war / peace
- 3 AI personalities with persistent memory
- Auto-resolve combat
- Reactive events with forks
- The Chronicle feed
- Pause + 2 speed settings

**OUT (deferred until the loop is proven fun):**
- Four specialized governors + job-ticket logistics for mobile agents (the tiered anti-deadlock architecture — returns when mobile logistics gain depth)
- Drive-tech tree (Fission/Fusion/Antimatter)
- Two-layer sieges, bombardment, troop transports
- Megastructures / Dyson Sphere
- Fold-gates, wormholes, nebula terrain variety
- Sensor tiers, scout-probe decay, full fog-of-war richness
- Zoom-to-orbit micro view
- Multiple celestial bodies per star system (planets, asteroid belts of varying richness/habitability). This enables multiple colonies per system and deeper extraction profiles (e.g. rich asteroid belts boosting ore output).
- Full resource set (rare elements, biomass split)
- Manual fleet routing (optional post-MVP toggle)
- **Supply & demand merchant economy** (flagship MVP+1): per-system stockpiles, scarcity-driven prices, arbitraging merchants. Subsumes comparative advantage — *who* you trade with bites because surpluses and deficits are real. Data model built MVP-ready now (see §4).
- Trade-route raiding & blockade as a war mechanic (stretch goal once combat exists)
- Punitive per-partner tariffs (graduated step between default trade and full embargo)

---

## 11. Build Plan

**Stack:** Svelte + TypeScript + Vite (your environment). **Canvas 2D** for the map — ~20 nodes and a handful of fleet glyphs don't need WebGL/Pixi; 2D keeps it simple. **Hard split between sim and render:** a deterministic, headless tick loop in plain TS, with Svelte/Canvas as a pure view over the state. This makes the sim testable, pausable, and speed-adjustable for free.

**Milestones (rough evening-session estimate — focused MVP):**
1. *Sim skeleton* — tick loop, node graph, 3 resources, one colony growing. **(~3 sessions)**
2. *Governor* — utility scoring, autonomous settle/build, Chronicle logging. **(~3)**
3. *Map render* — Canvas node graph, fleet glyphs, the Commander's Table look. **(~3)**
4. *Levers* — Authority economy, 4 sliders, 3 edicts. **(~2)**
5. *Diplomacy + AI personalities* — relationship memory, the 4 diplo actions. **(~3)**
6. *War* — auto-resolve combat, fleets dispatched by doctrine. **(~2)**
7. *Events* — reactive table, choice forks. **(~2)**
8. *Tuning pass* — Authority costs/regen, pacing, the deadband. **(~2)**

**≈ 18–22 evening sessions to a playable MVP.**

---

## 12. The One Question the MVP Must Answer

> *When I lean back and just watch — then occasionally reach in to broker a peace, embargo a rival, or yank the tax slider — does it feel like presiding over a living empire? Or does it feel like nothing I do matters?*

If the answer is the former, everything in the OUT list becomes content worth building. If it's the latter, no Dyson Sphere will save it — and you'll have learned that in ~20 sessions instead of 200.
