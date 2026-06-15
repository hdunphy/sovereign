// Headless determinism + health harness. ADAPTED from
// caravan-and-kingdom/test/headless.ts. Runs the pure loop with no rendering,
// then verifies that two same-seed runs produce identical state - the core
// guarantee that makes the sim testable, pausable, and speed-adjustable for free.
import { generateWorld } from '../src/sim/worldgen.ts';
import { step } from '../src/sim/gameLoop.ts';
import { saveWorld } from '../src/sim/serialize.ts';

const ticks = parseInt(process.argv[2] ?? '3000', 10);
const seed = parseInt(process.argv[3] ?? '42', 10);

function run() {
  const w = generateWorld(seed, 20, 4);
  for (let i = 0; i < ticks; i++) step(w);
  return w;
}

const a = run();
const b = run();
const sa = saveWorld(a), sb = saveWorld(b);

console.log(`Ran ${ticks} ticks (seed ${seed}).`);
for (const f of a.factions) {
  const cols = a.colonies.filter(c => c.factionId === f.id).length;
  console.log(`  ${f.name}: ${cols} colonies, authority ${f.authority.toFixed(0)}, stability ${(f.stability ?? 0).toFixed(2)}, ${f.eliminated ? 'FALLEN' : 'alive'}`);
}
console.log(`Chronicle entries: ${a.chronicle.length}`);
console.log(sa === sb ? 'DETERMINISM OK' : 'DETERMINISM FAILED');
if (sa !== sb) process.exit(1);
