// The King's Levers (GDD section 4) - the player's active surface, all gated by Authority
// (GDD section 3). NEW to Sovereign. Sliders move within a free deadband, then cost
// Authority per notch; edicts and diplomacy actions each have a fixed cost.
import { AUTHORITY } from '../core/constants/index.ts';
import { spendAuthority } from './economy.ts';
import { addModifier } from './systems/events.ts';
import { declareWar } from './diplomacy/war.ts';
import { addRelation, pairKey } from './diplomacy/relations.ts';
import { chronicle } from './chronicle.ts';
import type { World, Policy } from '../types.ts';

// Slider change: free within deadband, else AUTHORITY.COST.SLIDER_PER_NOTCH/notch.
export function setSlider(world: World, fid: number, key: keyof Policy, value: number) {
  const f = world.factions.find(x => x.id === fid);
  if (!f?.policy) return false;
  const notches = Math.abs(value - (f.policy[key] as number)) / 0.1;
  const billable = Math.max(0, notches - AUTHORITY.SLIDER_DEADBAND);
  const cost = Math.round(billable * AUTHORITY.COST.SLIDER_PER_NOTCH);
  if (cost > 0 && !spendAuthority(world, fid, cost)) return false;
  f.policy[key] = value;
  return true;
}

// Edicts (GDD section 4): spend Authority for a short, punchy modifier.
export function issueEdict(world: World, fid: number, edict: 'mobilization' | 'largesse' | 'crackdown') {
  if (!spendAuthority(world, fid, AUTHORITY.COST.EDICT_MIN)) return false;
  // TODO: distinct effects/costs per edict; crackdown breeds resentment later.
  addModifier(world, fid, { id: edict, type: 'edict', value: 1.5, expiresAt: world.tick + 500 });
  chronicle(world, 'governor', `Edict issued: ${edict}.`, fid);
  return true;
}

// Diplomacy actions are thin wrappers that charge Authority then call the sim.
export function playerDeclareWar(world: World, target: number) {
  return declareWar(world, world.playerFactionId!, target, true);
}
export function playerEmbargo(world: World, target: number) {
  const me = world.playerFactionId!;
  if (!spendAuthority(world, me, AUTHORITY.COST.EMBARGO)) return false;
  const pk = pairKey(me, target);
  if (!world.diplo.embargoes.includes(pk)) world.diplo.embargoes.push(pk);
  addRelation(world, me, target, -20);
  chronicle(world, 'diplomacy', `Embargo declared on ${world.factions[target].name}.`);
  return true;
}
