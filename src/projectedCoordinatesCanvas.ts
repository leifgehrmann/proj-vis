import { getBbox } from './bbox';
import { Coordinate } from './coord';

export default function createProjectedCoordinatesCanvasAndTransformers(
  xValues: number[],
  yValues: number[],
  colorMap: Uint8ClampedArray[],
): ({
    canvas: HTMLCanvasElement,
    toCanvas: (coord: Coordinate) => Coordinate
    toCoords: (coord: Coordinate) => Coordinate
  }) {
  const bbox = getBbox(xValues, yValues);
  const dX = bbox.maxX - bbox.minX;
  const dY = bbox.maxY - bbox.minY;

  const ratio = dX / dY;
  const padding = 1;
  let width = 1000;
  let height = 1000 / ratio;
  if (ratio < 1) {
    width = 1000 * ratio;
    height = 1000;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (ctx == null) {
    throw new Error('Failed to get 2d context');
  }

  const toCanvas = (coords: Coordinate): Coordinate => ({
    x: ((coords.x - bbox.minX) / (dX)) * (width - padding * 2) + padding,
    y: (height - padding * 2) - ((coords.y - bbox.minY) / (dY)) * (height - padding * 2) + padding,
  });

  const toCoords = (coords: Coordinate): Coordinate => ({
    x: ((coords.x - padding) / (width - padding * 2)) * dX + bbox.minX,
    y: (-(coords.y - padding - (height - padding * 2)) / (height - padding * 2)) * dY + bbox.minY,
  });

  for (let i = 0; i < xValues.length; i += 1) {
    const { x, y } = toCanvas({ x: xValues[i], y: yValues[i] });
    const color = colorMap[i];
    ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }

  return {
    canvas,
    toCanvas,
    toCoords,
  };
}
