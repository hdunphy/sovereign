import App from './ui/App.svelte';
import { generateWorld } from './sim/worldgen.ts';
import { step } from './sim/gameLoop.ts';
import type { World } from './types.ts';

const params = new URLSearchParams(location.search);
const seed = parseInt(params.get('seed') ?? '42', 10);

export const world: World = generateWorld(seed, 20, 4);

// Speed control shared with the UI. 0 = paused, 1 = 1x, etc.
export const sim = { speed: 1 as number };

let acc = 0;
let last = performance.now();
const TICK_MS = 100; // base sim cadence at 1x
function frame(now: number) {
  const dt = now - last; last = now;
  acc += dt * sim.speed;
  while (acc >= TICK_MS) { step(world); acc -= TICK_MS; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

import { mount } from 'svelte';

const app = mount(App, {
  target: document.getElementById('root')!,
  props: { world, sim }
});

export default app;
