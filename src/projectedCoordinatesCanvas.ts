import {getBbox} from "./bbox";

export function createProjectedCoordinatesCanvas(
  xValues: number[],
  yValues: number[],
  colorMap: Uint8ClampedArray[]
): HTMLCanvasElement {
  const bbox = getBbox(xValues, yValues)
  const dX = bbox.maxX - bbox.minX
  const dY = bbox.maxY - bbox.minY

  const ratio = dX / dY
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

  for (let i = 0; i < xValues.length; i++) {
    const x = (xValues[i] - bbox.minX) / (dX) * rWidth
    const y = (rHeight-(yValues[i] - bbox.minY) / (dY) * rHeight)
    const color = colorMap[i]
    ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    ctx.fillRect(x-1, y-1, 2, 2);
  }

  return canvas
}
