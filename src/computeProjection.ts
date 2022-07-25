import proj4 from "proj4";
import {isValidProjection} from "./isValidProjection";
import {waitForAnimationFrame} from "./waitForAnimationFrame";
import {loadImage} from "./loadImagePromise";
import {Ref} from "vue";

// Ideally we wouldn't be using Refs in functions, but this is just a convenient
// way to get stuff to be reactive without too much effort. Not recommended for
// prod!
export async function computeProjection(
  projection: Ref<string>,
  latRangeMin: Ref<number>,
  latRangeMax: Ref<number>,
  lonRangeMin: Ref<number>,
  lonRangeMax: Ref<number>,
  step: Ref<number>,
  processId: Ref<number>,
  totalProjectedSamples: Ref<number>,
  progress: Ref<number>,
  validLonValues: Ref<number[]>,
  validLatValues: Ref<number[]>,
  projectedXValues: Ref<number[]>,
  projectedYValues: Ref<number[]>,
  colorValues: Ref<Uint8ClampedArray[]>,
) {
  // This is a hacky way of getting the contents of the image in `RangeInput.vue`.
  // I know, it's not pretty, but proj-vis isn't meant to be an example good code,
  // just a quick hacky tool.
  const inputMapImg = document.querySelector('#inputMap') as HTMLImageElement;

  await loadImage(inputMapImg)

  const inputMapCanvas = document.createElement('canvas');
  const inputMapCtx = inputMapCanvas.getContext('2d');
  if (inputMapCtx === null) {
    return
  }

  inputMapCanvas.width = inputMapImg.naturalWidth;
  inputMapCanvas.height = inputMapImg.naturalHeight;
  inputMapCtx.drawImage(inputMapImg, 0, 0);

  const transformer = proj4(projection.value);
  const xValues = []
  const yValues = []
  const validLons = []
  const validLats = []
  const inputMapColors = []

  const minLatRange = latRangeMin.value
  const maxLatRange = latRangeMax.value
  const minLonRange = lonRangeMin.value
  const maxLonRange = lonRangeMax.value
  const dxLatRange = step.value
  const dxLonRange = step.value

  if (step.value <= 0.001) {
    console.error('Step value cannot be so low')
    return
  }

  if(!isValidProjection(projection.value)) {
    console.error('Projection is invalid')
    return
  }

  const currentProcessId = Date.now()
  processId.value = currentProcessId
  let samplesTotal = Math.floor((maxLatRange - minLatRange) / dxLatRange) * Math.floor((maxLonRange - minLonRange) / dxLonRange)
  let samplesCollected = 0;
  totalProjectedSamples.value = 0

  for (let lat = minLatRange; lat < maxLatRange; lat += dxLatRange) {
    if (processId.value !== currentProcessId) {
      return
    }
    for (let lon = minLonRange; lon < maxLonRange; lon += dxLonRange) {
      samplesCollected += 1;
      if (samplesCollected % 1000 == 0) {
        if (processId.value !== currentProcessId) {
          // If the processId has changed, stop running this process.
          return
        }
        progress.value = samplesCollected / samplesTotal
        await waitForAnimationFrame()
      }
      const value = transformer.forward([lon,lat])
      if (!Number.isFinite(value[0]) || Number.isNaN(value[0]) || !Number.isFinite(value[1]) || Number.isNaN(value[1])) {
        continue
      }
      xValues.push(value[0])
      yValues.push(value[1])
      validLons.push(lon)
      validLats.push(lat)
      const inputMapImgX = Math.round((lon + 180 + 360)/360 * inputMapImg.naturalWidth) % inputMapImg.naturalWidth
      const inputMapImgY = Math.round((-lat + 90)/180 * inputMapImg.naturalHeight)
      inputMapColors.push(inputMapCtx.getImageData(
        inputMapImgX, inputMapImgY, 1, 1
      ).data)
    }
  }
  totalProjectedSamples.value = validLons.length
  progress.value = 1

  if (processId.value !== currentProcessId) {
    return
  }

  validLonValues.value = validLons
  validLatValues.value = validLats
  projectedXValues.value = xValues
  projectedYValues.value = yValues
  colorValues.value = inputMapColors
}
