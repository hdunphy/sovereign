// Sue for / make peace. ADAPTED from caravan-and-kingdom/src/sim/diplomacy/peace.ts.
// War exhaustion drives the AI to the table (GDD section 6); a truce + lingering grudge
// follow. Player can broker peace at any time (free, or small Authority cost).
import { DIPLO } from '../../core/constants/index.ts';
import { pairKey, addRelation } from './relations.ts';
import { chronicle } from '../chronicle.ts';
import type { World, War } from '../../types.ts';

export function makePeace(world: World, war: War) {
  world.diplo.wars = world.diplo.wars.filter(w => w !== war);
  world.diplo.truces[pairKey(war.a, war.b)] = world.tick + DIPLO.TRUCE_DURATION;
  addRelation(world, war.a, war.b, DIPLO.PEACE_RELATION);
  chronicle(world, 'diplomacy', `${world.factions[war.a].name} and ${world.factions[war.b].name} signed a truce.`);
}
