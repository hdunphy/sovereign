<script lang="ts">
  import type { World } from '../types.ts';
  export let world: World;
  export let selectedSystemId: number;
  export let tick: number;

  $: sys = (tick, world.systems.get(selectedSystemId));
  $: col = sys?.ownerColonyId != null ? world.colonies.find(c => c.id === sys.ownerColonyId) : null;
  $: fac = col ? world.factions[col.factionId] : null;
</script>

{#if sys}
<div style="position: absolute; top: 12px; right: 12px; width: 280px; background: rgba(10,16,26,0.9); padding: 16px; border-radius: 8px; border: 1px solid #1a2536; font: 13px ui-sans-serif; color: #cdd6e0; display: flex; flex-direction: column; gap: 12px;">
  
  <div>
    <div style="font-size: 16px; font-weight: bold; color: #fff;">{sys.name}</div>
    <div style="color: #8fa3bd;">Richness: {(sys.richness * 100).toFixed(0)}%</div>
  </div>

  {#if col && fac}
    <div style="padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px; border-left: 3px solid {fac.color};">
      <div style="font-weight: bold; color: {fac.color};">{fac.name}</div>
      <div style="display: flex; justify-content: space-between; margin-top: 4px;">
        <span>Tier: {col.tier}</span>
        <span>Happy: {(col.happiness * 100).toFixed(0)}%</span>
      </div>
      {#if col.buildings.length > 0}
        <div style="margin-top: 6px; font-size: 11px; color: #8fa3bd;">
          Buildings: {col.buildings.join(', ')}
        </div>
      {/if}
    </div>

    <div>
      <div style="font-weight: 600; margin-bottom: 4px; border-bottom: 1px solid #2a3a55; padding-bottom: 4px; color: #fff;">Colony Stocks</div>
      <div style="display: flex; justify-content: space-between;">
        <span>Population</span>
        <span style="font-variant-numeric: tabular-nums;">{col.stock.population.toFixed(1)}</span>
      </div>
    </div>
  {:else}
    <div style="color: #8fa3bd; font-style: italic;">Unclaimed System</div>
  {/if}

  <div>
    <div style="font-weight: 600; margin-bottom: 4px; border-bottom: 1px solid #2a3a55; padding-bottom: 4px; color: #fff;">Market Stockpiles</div>
    {#each ['alloys', 'energy'] as res}
      <div style="display: flex; justify-content: space-between;">
        <span style="text-transform: capitalize;">{res}</span>
        <span style="font-variant-numeric: tabular-nums;">{sys.stockpiles[res].toFixed(1)} <span style="color: #8fa3bd; font-size: 11px;">(p: {sys.prices[res].toFixed(2)})</span></span>
      </div>
    {/each}
  </div>

</div>
{/if}
