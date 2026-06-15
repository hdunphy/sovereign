// Combat as outcome, auto-resolved at nodes (GDD section 6). HEAVILY SIMPLIFIED from
// caravan-and-kingdom/src/sim/diplomacy/combat.ts (~400 lines of soldier agents,
// sieges, pillaging). Sovereign has NO siege/troop layers: when two hostile
// fleets meet at a system, resolve by power + random factor, produce ship losses,
// possible territory change, a Chronicle entry, and diplomatic fallout.
import { DIPLO } from '../../core/constants/index.ts';
import { atWar, addRelation, addGrudge } from './relations.ts';
import { chronicle } from '../chronicle.ts';
import type { World } from '../../types.ts';

export function combatSystem(world: World) {
  // Group fleets by system; where two warring factions share a node, resolve.
  // TODO: implement grouping + resolution. Sketch of the resolution rule:
  //   power = sum(fleet.power) * (1 +/- COMBAT_RANDOM*rng)
  //   loser loses COMBAT_LOSS_RATE of its stack; ties bleed both.
  //   if attacker clears the node's defenders -> flip system ownership (capture).
  //   chronicle(world,'combat',...) + addRelation/addGrudge for fallout.
  void world; void DIPLO; void atWar; void addRelation; void addGrudge; void chronicle;
}
