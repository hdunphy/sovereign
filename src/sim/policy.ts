// Policy accessor (GDD section 4). PORTED discipline from caravan-and-kingdom/src/sim/policy.ts:
// governors and systems read each slider through policyOf() rather than reading UI
// state, so edicts/sliders only ever enter the sim as plain data and the headless
// loop stays deterministic.
import { DEFAULT_POLICY } from '../core/constants/index.ts';
import type { World, Policy } from '../types.ts';

export function policyOf(world: World, factionId: number): Policy {
  return (world.factions.find(f => f.id === factionId)?.policy ?? DEFAULT_POLICY) as Policy;
}
