// Node-graph math (GDD section 5). NEW to Sovereign - REPLACES caravan-and-kingdom's
// hex.ts (axial coords, range(), hex distance). Star systems are nodes, hyperlanes
// are edges. "distance" = graph hops via BFS, not hex geometry.
import type { World, StarSystem } from '../types.ts';

export const laneKey = (a: number, b: number) => Math.min(a, b) + '|' + Math.max(a, b);

export function neighbors(world: World, systemId: number): number[] {
  return world.systems.get(systemId)?.neighbors ?? [];
}

// BFS shortest hop-count between two systems. Returns Infinity if unreachable.
// REPLACES hex distance() and the A* pathfinding.ts (graph BFS is enough at ~20 nodes).
export function hops(world: World, from: number, to: number): number {
  if (from === to) return 0;
  const seen = new Set<number>([from]);
  let frontier = [from];
  let d = 0;
  while (frontier.length) {
    d++;
    const next: number[] = [];
    for (const id of frontier) {
      for (const nb of neighbors(world, id)) {
        if (nb === to) return d;
        if (!seen.has(nb)) { seen.add(nb); next.push(nb); }
      }
    }
    frontier = next;
  }
  return Infinity;
}

// Shortest path of system ids (inclusive of endpoints). Used for fleet routing
// and trade-lane resolution. REPLACES findPath() from pathfinding.ts.
export function path(world: World, from: number, to: number): number[] | null {
  if (from === to) return [from];
  const prev = new Map<number, number>();
  const seen = new Set<number>([from]);
  let frontier = [from];
  while (frontier.length) {
    const next: number[] = [];
    for (const id of frontier) {
      for (const nb of neighbors(world, id)) {
        if (seen.has(nb)) continue;
        seen.add(nb); prev.set(nb, id);
        if (nb === to) {
          const out = [to];
          let c = to;
          while (c !== from) { c = prev.get(c)!; out.push(c); }
          return out.reverse();
        }
        next.push(nb);
      }
    }
    frontier = next;
  }
  return null;
}

// Systems within `reach` hops (the tether, GDD section 5).
export function withinReach(world: World, systemId: number, reach: number): number[] {
  const out: number[] = [];
  const seen = new Set<number>([systemId]);
  let frontier = [systemId];
  for (let d = 0; d < reach && frontier.length; d++) {
    const next: number[] = [];
    for (const id of frontier) {
      for (const nb of neighbors(world, id)) {
        if (!seen.has(nb)) { seen.add(nb); out.push(nb); next.push(nb); }
      }
    }
    frontier = next;
  }
  return out;
}
