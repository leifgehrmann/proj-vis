import {getBbox} from "./bbox";

export function createValidCoordinatesCanvas(
  fullRangeStep: number,
  validLons: number[],
  validLats: number[],
  colorMap: Uint8ClampedArray[]
): HTMLCanvasElement {
  const bbox = getBbox(validLons, validLats)
  const validLonsDelta = bbox.maxX - bbox.minX
  const validLatsDelta = bbox.maxY - bbox.minY
  const canvas = document.createElement('canvas');
  canvas.width = validLonsDelta / fullRangeStep
  canvas.height = validLatsDelta / fullRangeStep

  const ctx = canvas.getContext('2d');
  if (ctx == null) {
    throw new Error('Failed to get 2d context')
  }

  for (let i = 0; i < validLats.length; i++) {
    const lon = validLons[i]
    const lat = validLats[i]
    const x = Math.round((lon - bbox.minX) / fullRangeStep)
    const y = Math.round(((bbox.maxY - bbox.minY) - (lat - bbox.minY)) / fullRangeStep)
    const color = colorMap[i]
    ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    ctx.fillRect(x, y, 1, 1);
  }

  return canvas
}
