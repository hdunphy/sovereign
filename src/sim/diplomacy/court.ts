// The Court - faction-level AI brain, meets every DIPLO.INTERVAL ticks.
// ADAPTED from caravan-and-kingdom/src/sim/diplomacy/court.ts (~400 lines). The
// structure ports directly: warm relations from trade, apply forgiveness drift,
// evaluate pacts/embargoes/war, drive AI policy from traits. The personalities
// (GDD section 8) are the three archetypes in constants/factions.ts:
//   Swarm    -> expands aggressively, resents being boxed in (border friction)
//   Megacorp -> seeks trade pacts, pays to avoid war, furious at embargoes
//   Fallen   -> isolationist; ignores neighbors until provoked, then devastating
import { DIPLO } from '../../core/constants/index.ts';
import { pairKey, getRelation, addRelation, atWar, hasPact } from './relations.ts';
import { chronicle } from '../chronicle.ts';
import type { World } from '../../types.ts';

export function courtSystem(world: World) {
  if (world.tick % DIPLO.INTERVAL !== 0 || world.tick === 0) return;
  const d = world.diplo;

  // 1. Convert accrued trade into relation gains, then forgiveness drift.
  for (const k of Object.keys(d.tradeCounts).sort()) {
    const [a, b] = k.split('|').map(Number);
    addRelation(world, a, b, d.tradeCounts[k] * DIPLO.TRADE_RELATION);
  }
  d.tradeCounts = {};

  const n = world.factions.length;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) {
    const r = getRelation(world, a, b);
    if (r !== 0 && !atWar(world, a, b)) {
      addRelation(world, a, b, Math.sign(-r) * Math.min(DIPLO.DRIFT, Math.abs(r)));
    }
  }

  // 2. TODO: per-persona decisions - sign pacts (Megacorp), declare war (Swarm
  //    when boxed in / Fallen when provoked), embargo, sue for peace by exhaustion.
  void pairKey; void hasPact; void chronicle;
}
