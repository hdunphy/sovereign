<script lang="ts">
  import { onMount } from 'svelte';
  import type { World } from '../types.ts';
  import MapCanvas from './MapCanvas.svelte';
  import ControlBar from './ControlBar.svelte';
  import Chronicle from './Chronicle.svelte';

  export let world: World;
  export let sim: { speed: number };

  let tick = world.tick;
  onMount(() => {
    const id = setInterval(() => { tick = world.tick; }, 200);
    return () => clearInterval(id);
  });
</script>

<MapCanvas {world} />
<ControlBar {world} {sim} {tick} />
<Chronicle {world} {tick} />
