<script lang="ts">
  import { onMount } from 'svelte';
  import { makeCamera, type Camera, screenToWorld } from './camera.ts';
  import type { World } from '../types.ts';

  export let world: World;
  export let selectedSystemId: number | null = null;

  let canvas: HTMLCanvasElement;
  let cam: Camera = makeCamera();

  let isDragging = false;
  let hasDragged = false;
  let lastX = 0;
  let lastY = 0;

  function onMouseDown(e: MouseEvent) {
    isDragging = true;
    hasDragged = false;
    lastX = e.clientX;
    lastY = e.clientY;
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;
    cam.x -= dx / cam.zoom;
    cam.y -= dy / cam.zoom;
    lastX = e.clientX;
    lastY = e.clientY;
  }

  function onMouseUp() {
    isDragging = false;
  }

  function onMouseLeave() {
    isDragging = false;
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    if (e.deltaY < 0) {
      cam.zoom = Math.min(4, cam.zoom * 1.2);
    } else {
      cam.zoom = Math.max(0.3, cam.zoom / 1.2);
    }
  }

  function onClick(e: MouseEvent) {
    if (hasDragged) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { x, y } = screenToWorld(cam, sx, sy, canvas.width, canvas.height);
    
    let bestDist = 20 * 20; // hit radius squared
    let bestSys: number | null = null;
    
    for (const sys of world.systems.values()) {
      const distSq = (sys.x - x) ** 2 + (sys.y - y) ** 2;
      if (distSq < bestDist) {
        bestDist = distSq;
        bestSys = sys.id;
      }
    }
    selectedSystemId = bestSys;
  }

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

        if (selectedSystemId === s.id) {
          ctx.beginPath(); ctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(raf);
  });
</script>

<canvas id="map" bind:this={canvas}
  on:mousedown={onMouseDown}
  on:mousemove={onMouseMove}
  on:mouseup={onMouseUp}
  on:mouseleave={onMouseLeave}
  on:wheel|nonpassive={onWheel}
  on:click={onClick}
></canvas>
