// Faction resource + Authority accessors. ADAPTED from
// caravan-and-kingdom/src/sim/economy.ts (which managed a single gold treasury).
// Here each faction holds a Stock; the player additionally spends Authority (section 3).
import { AUTHORITY } from '../core/constants/index.ts';
import type { World, Resource } from '../types.ts';

export function factionOf(world: World, fid: number) {
  return world.factions.find(f => f.id === fid);
}

export function stockOf(world: World, fid: number, res: Resource): number {
  return factionOf(world, fid)?.stock[res] ?? 0;
}

export function spend(world: World, fid: number, res: Resource, amount: number) {
  const f = factionOf(world, fid);
  if (f) f.stock[res] -= amount;
}

// --- Authority (GDD section 3): regenerates slowly, caps, gates every active decision ---
export function regenAuthority(world: World, fid: number, stability = 1) {
  const f = factionOf(world, fid);
  if (!f) return;
  f.authority = Math.min(AUTHORITY.CAP, f.authority + AUTHORITY.REGEN_PER_TICK * stability);
}

export function canAfford(world: World, fid: number, cost: number): boolean {
  return (factionOf(world, fid)?.authority ?? 0) >= cost;
}

export function spendAuthority(world: World, fid: number, cost: number): boolean {
  const f = factionOf(world, fid);
  if (!f || f.authority < cost) return false;
  f.authority -= cost;
  return true;
}
