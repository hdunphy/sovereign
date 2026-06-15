// Pan/zoom camera over a 2D map. PORTED from caravan-and-kingdom/src/ui/camera.ts.
// Map-agnostic (operates in pixel space), so it works unchanged on the node graph.
export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export function makeCamera(): Camera {
  return { x: 0, y: 0, zoom: 1 };
}

export function screenToWorld(cam: Camera, sx: number, sy: number, w: number, h: number) {
  return {
    x: (sx - w / 2) / cam.zoom + cam.x,
    y: (sy - h / 2) / cam.zoom + cam.y,
  };
}
