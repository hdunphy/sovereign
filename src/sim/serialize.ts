// Save/load. PORTED from caravan-and-kingdom/src/sim/serialize.ts. The pattern
// (extract rngState, turn the systems Map into entries, drop derived indices &
// the rng instance) carries over directly; only the field names change.
import { makeRng } from '../core/rng.ts';
import { indexColonies } from './gameLoop.ts';
import type { World } from '../types.ts';

export function saveWorld(world: World): string {
  const data: any = {
    ...world,
    rngState: world.rng.getState(),
    systems: Array.from(world.systems.entries()),
  };
  delete data.rng;
  delete data.colonyById;
  delete data.coloniesByFaction;
  return JSON.stringify(data);
}

export function loadWorld(json: string): World {
  const data = JSON.parse(json);
  const rng = makeRng(data.seed);
  if (data.rngState !== undefined) rng.setState(data.rngState);
  const world: World = { ...data, rng, systems: new Map(data.systems) };
  indexColonies(world);
  return world;
}
