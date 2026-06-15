// Galaxy generation (GDD section 5). NEW - REPLACES caravan-and-kingdom/src/sim/worldgen.ts
// (which built a noise-based hex island). Here we scatter ~15-25 star systems and
// connect them into a sparse, navigable graph, then seat each faction's first
// colony. Must stay DETERMINISTIC for a given seed (same guarantee as C&K).
import { makeRng } from '../core/rng.ts';
import { laneKey } from '../core/graph.ts';
import { FACTIONS, DEFAULT_POLICY, AUTHORITY, ECON } from '../core/constants/index.ts';
import type { World, StarSystem, Lane, Colony } from '../types.ts';

const SYSTEM_NAMES = ['Vega', 'Rigel', 'Altair', 'Lyra', 'Cygnus', 'Draco', 'Orion',
  'Hydra', 'Pavo', 'Corvus', 'Mensa', 'Norma', 'Crux', 'Tucana', 'Carina', 'Dorado',
  'Fornax', 'Sculptor', 'Vela', 'Pyxis', 'Antlia', 'Caelum', 'Reticulum', 'Octans', 'Phoenix'];

export function generateWorld(seed = 42, systemCount = 20, factionCount = 4): World {
  const rng = makeRng(seed);
  const world: World = {
    seed, tick: 0, rng,
    systems: new Map(), lanes: [],
    colonies: [], fleets: [],
    factions: FACTIONS.slice(0, factionCount).map(f => ({
      ...f,
      stock: { energy: 300, alloys: 300, population: 50 },
      authority: AUTHORITY.CAP,
      stability: ECON.HAPPINESS_NEUTRAL,
      policy: { ...DEFAULT_POLICY },
    })),
    diplo: { relations: {}, tradeCounts: {}, wars: [], truces: {}, embargoes: [], pacts: [], grudges: {} },
    chronicle: [], events: [],
    playerFactionId: 0,
    nextId: 1,
  };

  // 1. Scatter systems with simple jitter on a disc.
  // TODO: improve layout (force-directed relax) for the "Commander's Table" look.
  for (let i = 0; i < systemCount; i++) {
    const angle = rng.next() * Math.PI * 2;
    const radius = 120 + rng.next() * 360;
    const sys: StarSystem = {
      id: i,
      name: SYSTEM_NAMES[i % SYSTEM_NAMES.length] + ' ' + (Math.floor(i / SYSTEM_NAMES.length) + 1),
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      ownerColonyId: null,
      neighbors: [],
      richness: 0.3 + rng.next() * 0.7,
      // Market-ready data model (GDD section 4): every system carries stockpiles + a flat
      // price hook from tick zero, so the post-MVP market slots in without a rewrite.
      stockpiles: { energy: 0, alloys: 0, population: 0 },
      prices: { energy: 1, alloys: 1, population: 1 },
    };
    world.systems.set(i, sys);
  }

  // 2. Connect into a sparse graph: nearest-neighbor lanes.
  // TODO: guarantee full connectivity (MST) then add a few extra lanes for loops.
  connectNearest(world, 3);

  // 3. Seat one starting colony per faction on spread-out systems.
  const ids = [...world.systems.keys()];
  for (let fi = 0; fi < world.factions.length; fi++) {
    const sysId = ids[Math.floor((fi / world.factions.length) * ids.length)];
    foundColony(world, fi, sysId, 'CORE');
  }

  return world;
}

function connectNearest(world: World, k: number) {
  const seen = new Set<string>();
  const sys = [...world.systems.values()];
  for (const a of sys) {
    const dists = sys.filter(b => b.id !== a.id)
      .map(b => ({ b, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 }))
      .sort((m, n) => m.d - n.d).slice(0, k);
    for (const { b } of dists) {
      const lk = laneKey(a.id, b.id);
      if (seen.has(lk)) continue;
      seen.add(lk);
      const lane: Lane = { a: a.id, b: b.id };
      world.lanes.push(lane);
      if (!a.neighbors.includes(b.id)) a.neighbors.push(b.id);
      if (!b.neighbors.includes(a.id)) b.neighbors.push(a.id);
    }
  }
}

export function foundColony(world: World, factionId: number, systemId: number, tier: Colony['tier'] = 'OUTPOST'): Colony {
  const col: Colony = {
    id: world.nextId++,
    factionId, systemId,
    name: world.systems.get(systemId)!.name,
    tier,
    stock: { energy: 100, alloys: 100, population: 20 },
    buildings: [],
    reach: 2,
    happiness: ECON.HAPPINESS_NEUTRAL,
  };
  world.colonies.push(col);
  world.systems.get(systemId)!.ownerColonyId = col.id;
  return col;
}
