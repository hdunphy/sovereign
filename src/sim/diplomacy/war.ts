// War declaration + AI war council. ADAPTED from
// caravan-and-kingdom/src/sim/diplomacy/war.ts. Player path costs Authority (section 3);
// AI path is trait-driven from the Court. Declaring marks shared lanes raidable (section 6).
import { DIPLO, AUTHORITY } from '../../core/constants/index.ts';
import { addRelation, addGrudge } from './relations.ts';
import { spendAuthority } from '../economy.ts';
import { chronicle } from '../chronicle.ts';
import type { World } from '../../types.ts';

export function declareWar(world: World, a: number, b: number, viaPlayer = false) {
  if (viaPlayer && !spendAuthority(world, a, AUTHORITY.COST.DECLARE_WAR)) return false;
  world.diplo.wars.push({ a, b });
  addRelation(world, a, b, DIPLO.DECLARE_WAR_PENALTY);
  addGrudge(world, b, a, `Declared war (tick ${world.tick})`);
  chronicle(world, 'diplomacy', `${world.factions[a].name} declared war on ${world.factions[b].name}.`);
  return true;
}
