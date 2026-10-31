type Point = Readonly<{ x: number; y: number }>;
type Bounds = Readonly<{ x: number; y: number; width: number; height: number }>;

/** Select only on-screen, unobstructed targets. Precision drag bypasses this. */
export const nearestAimTarget = (origin: Point, targets: readonly Point[], bounds: Bounds,
  visible: (target: Point) => boolean, maxRange = 720): Point | null => {
  let best: Point | null = null;
  let distance = maxRange * maxRange;
  for (const target of targets) {
    if (!Number.isFinite(target.x) || !Number.isFinite(target.y) || target.x < bounds.x || target.y < bounds.y || target.x > bounds.x + bounds.width || target.y > bounds.y + bounds.height) continue;
    const d = (target.x - origin.x) ** 2 + (target.y - origin.y) ** 2;
    if (d > 0 && d < distance && visible(target)) { best = target; distance = d; }
  }
  return best;
};

export const segmentIntersectsRect = (from: Point, to: Point, rect: Bounds): boolean => {
  let start = 0, end = 1;
  // Axis slabs, without allocating nested arrays for every collision/visibility query.
  for (let axis=0;axis<2;axis++) {
    const origin=axis===0?from.x:from.y,delta=axis===0?to.x-from.x:to.y-from.y;
    const low=axis===0?rect.x:rect.y,high=low+(axis===0?rect.width:rect.height);
    if (Math.abs(delta) < 1e-9) { if (origin < low || origin > high) return false; }
    else {
      const a = (low - origin) / delta, b = (high - origin) / delta;
      start = Math.max(start, Math.min(a, b)); end = Math.min(end, Math.max(a, b));
      if (start > end) return false;
    }
  }
  return true;
};
