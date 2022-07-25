import {getBbox} from "./bbox";
import {Coordinate} from "./coord";

export function createProjectedCoordinatesCanvasAndTransformers(
  xValues: number[],
  yValues: number[],
  colorMap: Uint8ClampedArray[]
): ({
  canvas: HTMLCanvasElement,
  toCanvas: (coord: Coordinate) => Coordinate
  toCoords: (coord: Coordinate) => Coordinate
}) {
  const bbox = getBbox(xValues, yValues)
  const dX = bbox.maxX - bbox.minX
  const dY = bbox.maxY - bbox.minY

  const ratio = dX / dY
  const padding = 1
  let rWidth = 1000
  let rHeight = 1000 / ratio
  if (ratio < 1) {
    rWidth = 1000 * ratio
    rHeight = 1000
  }

  const canvas = document.createElement('canvas');
  canvas.width = rWidth
  canvas.height = rHeight

  const ctx = canvas.getContext('2d');
  if (ctx == null) {
    throw new Error('Failed to get 2d context')
  }

  const toCanvas = (coords: Coordinate): Coordinate => {
    return {
      x: (coords.x - bbox.minX) / (dX) * (rWidth - padding * 2) + padding,
      y: (rHeight - padding * 2) - (coords.y - bbox.minY) / (dY) * (rHeight - padding * 2) + padding
    }
  }

  const toCoords = (coords: Coordinate): Coordinate => {
    return {
      x: (coords.x - padding) / (rWidth - padding * 2) * dX + bbox.minX,
      y: -(coords.y - padding - (rHeight - padding * 2)) / (rHeight - padding * 2) * dY + bbox.minY
    }
  }

  for (let i = 0; i < xValues.length; i++) {
    const {x, y} = toCanvas({x: xValues[i], y: yValues[i]})
    const color = colorMap[i]
    ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    ctx.fillRect(x-1, y-1, 2, 2);
  }

  return {
    canvas,
    toCanvas,
    toCoords
  }
}
