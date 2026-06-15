// The Chronicle (GDD section 9) - a first-class legibility layer, not decoration.
// ADAPTED from caravan-and-kingdom's log()/pushAlert() (in settlement.ts).
// Every governor decision, diplomatic shift, and combat outcome logs one line
// here. This is also where the emergent story accumulates.
import type { World, ChronicleEntry } from '../types.ts';

export function chronicle(world: World, kind: ChronicleEntry['kind'], msg: string, factionId?: number) {
  world.chronicle.push({ tick: world.tick, kind, msg, factionId });
  // Keep the feed bounded; UI shows the tail.
  if (world.chronicle.length > 2000) world.chronicle.splice(0, world.chronicle.length - 2000);
}
