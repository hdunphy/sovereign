// Per-tick colony economy + happiness (GDD section 5). ADAPTED from
// caravan-and-kingdom extraction.ts + metabolism.ts, minus the hauling/logistics
// layer (no villager agents). Production accrues into the SYSTEM'S stockpiles
// (the market-ready store, GDD section 4), scaled by the colony's happiness GRADIENT.
import { ECON } from '../../core/constants/index.ts';
import { getModifier } from './events.ts';
import { deposit, withdraw } from '../market.ts';
import { policyOf } from '../policy.ts';
import type { World, Colony } from '../../types.ts';

// Happiness -> output multiplier. A GRADIENT, not a cliff (GDD section 5): output scales
// smoothly with happiness; below STRIKE_FLOOR the system is fully struck (0); a
// content system earns a small bonus (a sweet spot to hunt, not just a pit to avoid).
export function outputMultiplier(happiness: number): number {
  if (happiness <= ECON.STRIKE_FLOOR) return 0;            // strike: stable floor
  return happiness * ECON.OUTPUT_SWEET_SPOT;               // 0..~1.1
}

// Move happiness toward the slider-derived target with lag (no threshold flicker).
// CRITICAL (GDD section 5): output suppression must NEVER feed back into happiness, or a
// strike becomes a death spiral. Happiness depends only on sliders/war/events.
export function happinessSystem(world: World) {
  for (const c of world.colonies) {
    const p = policyOf(world, c.factionId);
    const tax = p.taxRate ?? 1;
    const subsidy = p.lifeSupport ?? 1;
    // TODO(GDD section 5): also fold in war weariness, events, and edicts (Largesse +, Crackdown -).
    let target = ECON.HAPPINESS_NEUTRAL
      - (tax - 1) * ECON.HAPPINESS_TAX_PENALTY
      + (subsidy - 1) * ECON.HAPPINESS_SUBSIDY_BONUS;
    target = Math.max(0, Math.min(1, target));
    c.happiness += Math.sign(target - c.happiness) * Math.min(ECON.HAPPINESS_DRIFT, Math.abs(target - c.happiness));
  }
}

export function extractionSystem(world: World) {
  for (const c of world.colonies) {
    const sys = world.systems.get(c.systemId);
    if (!sys) continue;
    const mult = outputMultiplier(c.happiness);
    if (mult === 0) continue;                               // struck: produces nothing
    const rate = sys.richness * (1 + c.buildings.length * 0.25) * mult;
    // Production lands in the SYSTEM stockpiles (market-ready store, GDD section 4).
    deposit(world, c.systemId, 'alloys', rate * getModifier(world, c.factionId, 'alloy_rate'));
    deposit(world, c.systemId, 'energy', rate * 0.8 * getModifier(world, c.factionId, 'energy_rate'));
  }
}

export function metabolismSystem(world: World) {
  for (const c of world.colonies) {
    const upkeep = c.stock.population * ECON.ENERGY_PER_POP;
    const got = withdraw(world, c.systemId, 'energy', upkeep);  // draw from system store
    if (got >= upkeep) {
      c.stock.population += c.stock.population * ECON.POP_GROWTH_RATE * 0.1;
    } else {
      c.stock.population -= c.stock.population * ECON.POP_DECLINE_RATE * 0.1;
    }
  }
}
