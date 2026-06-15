// Relations + memory (GDD section 8). PORTED from
// caravan-and-kingdom/src/sim/diplomacy/relations.ts - this is the heart of the
// "AI remembers" story layer and ports almost verbatim. Only the world field
// names differ (world.diplo shape is identical in spirit).
import { DIPLO } from '../../core/constants/index.ts';
import type { World } from '../../types.ts';

export const pairKey = (a: number, b: number) => Math.min(a, b) + '|' + Math.max(a, b);

export function getRelation(world: World, a: number, b: number) {
  if (a === b) return 100;
  return world.diplo.relations[pairKey(a, b)] ?? 0;
}

export function addRelation(world: World, a: number, b: number, delta: number) {
  const k = pairKey(a, b);
  const v = (world.diplo.relations[k] ?? 0) + delta;
  world.diplo.relations[k] = Math.max(-100, Math.min(100, v));
}

export function findWar(world: World, a: number, b: number) {
  return world.diplo.wars.find(w => (w.a === a && w.b === b) || (w.a === b && w.b === a)) ?? null;
}
export function atWar(world: World, a: number, b: number) { return !!findWar(world, a, b); }
export function atWarAny(world: World, a: number) { return world.diplo.wars.some(w => w.a === a || w.b === a); }

export function stateOf(world: World, a: number, b: number) {
  if (a === b) return 'SELF';
  if (atWar(world, a, b)) return 'WAR';
  if ((world.diplo.truces[pairKey(a, b)] ?? 0) > world.tick) return 'TRUCE';
  const r = getRelation(world, a, b);
  if (r >= DIPLO.FRIENDLY) return 'FRIENDLY';
  if (r <= DIPLO.HOSTILE) return 'HOSTILE';
  return 'NEUTRAL';
}

export function hasEmbargo(world: World, a: number, b: number) {
  return (world.diplo.embargoes ?? []).includes(pairKey(a, b));
}

export function hasPact(world: World, a: number, b: number) {
  const pk = pairKey(a, b);
  return (world.diplo.pacts ?? []).some(p => pairKey(p.a, p.b) === pk);
}

export function getAllies(world: World, fid: number) {
  const allies: number[] = [];
  for (const p of world.diplo.pacts ?? []) {
    if (p.a === fid) allies.push(p.b);
    else if (p.b === fid) allies.push(p.a);
  }
  return allies;
}

export function canTrade(world: World, a: number, b: number) {
  if (a === b) return true;
  if (hasEmbargo(world, a, b)) return false;
  const st = stateOf(world, a, b);
  return st === 'NEUTRAL' || st === 'FRIENDLY' || st === 'TRUCE';
}

// Record a remembered offense (the "Megacorp never forgave the embargo of '47").
export function addGrudge(world: World, victim: number, offender: number, note: string) {
  if (!world.diplo.grudges) world.diplo.grudges = {};
  const k = pairKey(victim, offender);
  (world.diplo.grudges[k] ??= []).push(note);
}
