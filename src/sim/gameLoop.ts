// Deterministic game loop (GDD section 11, "hard split between sim and render").
// ADAPTED from caravan-and-kingdom/src/sim/gameLoop.ts. The discipline ports 1:1:
//   - rebuild derived indices first,
//   - run systems in a FIXED order every tick,
//   - gate the AI to every Nth tick,
//   - sweep eliminations authoritatively at the end,
//   - never touch rendering (so it runs headless for batch testing).
// System order (Sovereign): Happiness -> Extraction -> Metabolism -> Governor ->
//   Trade -> Court -> Combat -> Stability/Authority regen -> Events.
import { extractionSystem, metabolismSystem, happinessSystem } from './systems/colonyEconomy.ts';
import { tradeSystem } from './systems/trade.ts';
import { eventsSystem, resolvePendingEvents } from './systems/events.ts';
import { governorSystem } from './governor.ts';
import { courtSystem } from './diplomacy/court.ts';
import { combatSystem } from './diplomacy/combat.ts';
import { regenAuthority } from './economy.ts';
import { chronicle } from './chronicle.ts';
import type { World } from '../types.ts';

export function indexColonies(world: World) {
  world.colonyById = new Map();
  world.coloniesByFaction = new Map();
  for (const f of world.factions) world.coloniesByFaction.set(f.id, []);
  for (const c of world.colonies) {
    world.colonyById.set(c.id, c);
    (world.coloniesByFaction.get(c.factionId) ?? []).push(c);
  }
}

export function step(world: World) {
  world.tick++;
  indexColonies(world);

  happinessSystem(world);    // update per-system happiness from sliders (GDD section 5)
  extractionSystem(world);   // output scaled by happiness gradient -> system stockpiles
  metabolismSystem(world);
  governorSystem(world);     // self-gated to every AI_INTERVAL ticks
  tradeSystem(world);
  courtSystem(world);        // self-gated to every DIPLO.INTERVAL ticks
  combatSystem(world);

  // Roll system happiness up into empire Stability, which modulates Authority
  // regen (GDD section 3 + 5): a stable, content empire grants more political room.
  for (const f of world.factions) {
    if (f.eliminated) continue;
    const cols = world.coloniesByFaction?.get(f.id) ?? [];
    f.stability = cols.length ? cols.reduce((s, c) => s + c.happiness, 0) / cols.length : 0;
    regenAuthority(world, f.id, 0.5 + f.stability);  // stability 0..1 -> regen x0.5..1.5
  }

  // Authoritative elimination sweep (port of C&K's end-of-tick check).
  for (const f of world.factions) {
    if (f.eliminated) continue;
    if (!world.colonies.some(c => c.factionId === f.id)) {
      f.eliminated = true;
      world.fleets = world.fleets.filter(fl => fl.factionId !== f.id);
      world.diplo.wars = world.diplo.wars.filter(w => w.a !== f.id && w.b !== f.id);
      chronicle(world, 'system', `${f.name} has fallen. Their name passes into history.`);
    }
  }

  resolvePendingEvents(world);
  eventsSystem(world);
}
