<script lang="ts">
  import type { World } from '../types.ts';
  export let world: World;
  export let sim: { speed: number };
  export let tick: number; // Force reactivity

  $: me = world.playerFactionId != null ? world.factions[world.playerFactionId] : null;
  const speeds = [0, 1, 4];
</script>

<div style="position: absolute; top: 12px; left: 12px; display: flex; align-items: center; gap: 12px; background: rgba(10,16,26,0.8); padding: 8px 12px; border-radius: 8px; font: 13px ui-sans-serif;">
  <strong>Tick {tick}</strong>
  {#if me}
    <span style="color: #e8d36b">Authority {me.authority.toFixed(0)}/100</span>
  {/if}
  <span>
    {#each speeds as s}
      <button 
        style="background: #1a2536; color: #cdd6e0; border: 1px solid #2a3a55; border-radius: 4px; padding: 4px 10px; margin-left: 6px; cursor: pointer;"
        on:click={() => sim.speed = s}
      >
        {s === 0 ? '⏸' : `${s}x`}
      </button>
    {/each}
  </span>
</div>
