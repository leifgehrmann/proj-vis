import {getBbox} from "./bbox";
import {Coordinate} from "./coord";

export function createValidCoordinatesCanvas(
  fullRangeStep: number,
  validLons: number[],
  validLats: number[],
  colorMap: Uint8ClampedArray[]
): ({
  canvas: HTMLCanvasElement,
  toCanvas: (coord: Coordinate) => Coordinate
  toCoords: (coord: Coordinate) => Coordinate
}) {
  const bbox = getBbox(validLons, validLats)
  const validLonsDelta = bbox.maxX - bbox.minX
  const validLatsDelta = bbox.maxY - bbox.minY
  const canvas = document.createElement('canvas');
  canvas.width = validLonsDelta / fullRangeStep + 1
  canvas.height = validLatsDelta / fullRangeStep + 1

  const ctx = canvas.getContext('2d');
  if (ctx == null) {
    throw new Error('Failed to get 2d context')
  }

  const toCanvas = (coords: Coordinate): Coordinate => {
    return {
      x: (coords.x - bbox.minX) / fullRangeStep,
      y: ((bbox.maxY - bbox.minY) - (coords.y - bbox.minY)) / fullRangeStep
    }
  }

  const toCoords = (coords: Coordinate): Coordinate => {
    return {
      x: coords.x * fullRangeStep + bbox.minX,
      y: -(coords.y * fullRangeStep) + (bbox.maxY - bbox.minY) + bbox.minY
    }
  }

  for (let i = 0; i < validLats.length; i++) {
    const lon = validLons[i]
    const lat = validLats[i]
    const coord = toCanvas({x: lon, y: lat})
    const color = colorMap[i]
    ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    ctx.fillRect(coord.x, coord.y, 1, 1);
  }

  return {
    canvas,
    toCanvas,
    toCoords
  }
}
