export type Bbox = { minX: number, minY: number, maxX: number, maxY: number };

export function getBbox(
  x: number[],
  y: number[],
): Bbox {
  return {
    minX: x.reduce((a, b) => Math.min(a, b)),
    minY: y.reduce((a, b) => Math.min(a, b)),
    maxX: x.reduce((a, b) => Math.max(a, b)),
    maxY: y.reduce((a, b) => Math.max(a, b)),
  };
}
