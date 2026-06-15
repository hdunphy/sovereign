// Market hook (GDD section 4). The MVP deliberately reads prices as FLAT, but the data
// model is built market-ready NOW so the post-MVP supply/demand market is a
// slot-in upgrade rather than a rewrite. Production accrues into
// StarSystem.stockpiles; this module is the single chokepoint the rest of the
// sim uses to ask "what is X worth at system S?".
import type { World, Resource } from '../types.ts';

// MVP: flat price straight off the system's price field (initialized to 1.0).
// LIVE-MARKET TODO (GDD section 4): derive price from local stockpile scarcity
//   (low stock -> high price), then SMOOTH/LAG the change to prevent oscillation,
//   updating in a FIXED system iteration order to preserve determinism.
export function priceOf(world: World, systemId: number, res: Resource): number {
  return world.systems.get(systemId)?.prices[res] ?? 1;
}

// Deposit produced/traded goods into a system's market store.
export function deposit(world: World, systemId: number, res: Resource, amount: number) {
  const sys = world.systems.get(systemId);
  if (sys) sys.stockpiles[res] += amount;
}

// Withdraw (returns the amount actually taken, never below zero).
export function withdraw(world: World, systemId: number, res: Resource, amount: number): number {
  const sys = world.systems.get(systemId);
  if (!sys) return 0;
  const take = Math.min(sys.stockpiles[res], amount);
  sys.stockpiles[res] -= take;
  return take;
}
