<script lang="ts">
  import { onMount } from 'svelte';
  import { makeCamera, type Camera } from './camera.ts';
  import type { World } from '../types.ts';

  export let world: World;

  let canvas: HTMLCanvasElement;
  let cam: Camera = makeCamera();

  onMount(() => {
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    const draw = () => {
      canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);

      // Lanes
      ctx.strokeStyle = 'rgba(120,150,200,0.25)';
      ctx.lineWidth = 1;
      for (const lane of world.lanes) {
        const a = world.systems.get(lane.a)!;
        const b = world.systems.get(lane.b)!;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      // Systems
      for (const s of world.systems.values()) {
        const owner = s.ownerColonyId != null
          ? world.colonies.find(c => c.id === s.ownerColonyId) : null;
        const color = owner ? world.factions[owner.factionId].color : '#3a4660';
        ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
      }
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(raf);
  });
</script>

<canvas id="map" bind:this={canvas}></canvas>
