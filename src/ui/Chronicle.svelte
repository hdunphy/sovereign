<script lang="ts">
  import type { World } from '../types.ts';
  export let world: World;
  export let tick: number; // Force reactivity

  $: tail = world.chronicle.slice(-12).reverse();
</script>

<!-- Add a hidden div that references tick to ensure Svelte triggers $ reactive block updates on tick change -->
<div style="display: none;">{tick}</div>

<div style="position: absolute; right: 12px; bottom: 12px; width: 360px; max-height: 40vh; overflow: hidden; background: rgba(10,16,26,0.85); border-radius: 8px; padding: 12px; font: 12px ui-monospace;">
  <div style="opacity: 0.6; margin-bottom: 6px;">THE CHRONICLE</div>
  {#each tail as e}
    <div style="margin-bottom: 4px; line-height: 1.3;">
      <span style="opacity: 0.4;">{e.tick} </span>{e.msg}
    </div>
  {/each}
</div>
