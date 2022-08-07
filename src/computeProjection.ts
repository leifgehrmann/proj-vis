import proj4, {Converter} from "proj4";
import {isValidProjection} from "./isValidProjection";
import {waitForAnimationFrame} from "./waitForAnimationFrame";
import {loadImage} from "./loadImagePromise";
import {Ref} from "vue";

type Wgs84Coordinates = [number, number][]
type ProjectedCoordinates = [number|null, number|null][]

// Ideally we wouldn't be using Refs in functions, but this is just a convenient
// way to get stuff to be reactive without too much effort. Not recommended for
// prod!
export async function computeProjection(
  projVisServerUrl: Ref<string|null>,
  projection: Ref<string>,
  latRangeMin: Ref<number>,
  latRangeMax: Ref<number>,
  lonRangeMin: Ref<number>,
  lonRangeMax: Ref<number>,
  step: Ref<number>,
  processId: Ref<number>,
  totalProjectedSamples: Ref<number>,
  progress: Ref<number>,
  validStep: Ref<number>,
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

  let transformer
  if (projVisServerUrl.value === null) {
    transformer = proj4(projection.value);
  } else {
    transformer = proj4('+proj=longlat');
  }
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

  if(!isValidProjection(projection.value) && projVisServerUrl.value === null) {
    console.error('Projection is invalid')
    return
  }

  const currentProcessId = Date.now()
  processId.value = currentProcessId
  let samplesTotal = Math.floor((maxLatRange - minLatRange) / dxLatRange) * Math.floor((maxLonRange - minLonRange) / dxLonRange)
  let samplesCollected = 0;
  totalProjectedSamples.value = 0

  let offset = 0
  let limit = 1000
  while(samplesCollected < samplesTotal) {
    if (processId.value !== currentProcessId) {
      // If the processId has changed, stop running this process.
      return
    }

    const wgs84Coordinates = generateWgs84Coordinates(
      minLatRange,
      maxLatRange,
      minLonRange,
      maxLonRange,
      dxLatRange,
      offset,
      limit
    )

    let projectedCoordinates
    if (projVisServerUrl.value === null) {
      projectedCoordinates = await generateLocalBatch(
        transformer,
        minLatRange,
        maxLatRange,
        minLonRange,
        maxLonRange,
        dxLatRange,
        offset,
        limit
      )
    } else {
      projectedCoordinates = await generateRemoteBatch(
        projVisServerUrl.value,
        projection.value,
        minLatRange,
        maxLatRange,
        minLonRange,
        maxLonRange,
        dxLatRange,
        offset,
        limit
      )
    }

    offset += limit
    samplesCollected += limit;
    progress.value = samplesCollected / samplesTotal

    for (let index = 0; index < projectedCoordinates.length; index++) {
      const [lon, lat] = wgs84Coordinates[index]
      const [x, y] = projectedCoordinates[index]

      if (x === null || y === null) {
        continue
      }

      xValues.push(x)
      yValues.push(y)
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

  validStep.value = step.value
  validLonValues.value = validLons
  validLatValues.value = validLats
  projectedXValues.value = xValues
  projectedYValues.value = yValues
  colorValues.value = inputMapColors
}

function generateWgs84Coordinates(
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number,
  step: number,
  offset: number,
  limit: number
): Wgs84Coordinates {
  const lonRange = maxLon - minLon
  const lonCount = Math.floor(lonRange / step)

  let lon = minLon + offset % lonCount * step
  let lat = minLat + Math.floor(offset / lonCount) * step

  let count = 0

  let wgs84Coordinates: [number, number][] = []

  while (lat < maxLat) {
    while (lon < maxLon) {
      wgs84Coordinates.push([lon, lat])

      count += 1
      if (count >= limit) {
        return wgs84Coordinates
      }

      lon += step
    }
    lon = minLon
    lat += step
  }

  return wgs84Coordinates
}

async function generateLocalBatch(
  transformer: Converter,
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number,
  step: number,
  offset: number,
  limit: number
): Promise<ProjectedCoordinates> {
  await waitForAnimationFrame()

  return generateWgs84Coordinates(
    minLat,
    maxLat,
    minLon,
    maxLon,
    step,
    offset,
    limit
  ).map(([lon, lat]) => {
    const point = transformer.forward([lon, lat])
    if (
      !Number.isFinite(point[0]) ||
      Number.isNaN(point[0]) ||
      !Number.isFinite(point[1]) ||
      Number.isNaN(point[1])
    ) {
      return [null, null]
    } else {
      return point as [number|null, number|null]
    }
  })
}

async function generateRemoteBatch(
  url: string,
  proj: string,
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number,
  step: number,
  offset: number,
  limit: number
): Promise<ProjectedCoordinates> {
  await waitForAnimationFrame()

  const urlWithParams = new URL(url)

  urlWithParams.searchParams.append('proj', proj)
  urlWithParams.searchParams.append('minLat', minLat.toString())
  urlWithParams.searchParams.append('maxLat', maxLat.toString())
  urlWithParams.searchParams.append('minLon', minLon.toString())
  urlWithParams.searchParams.append('maxLon', maxLon.toString())
  urlWithParams.searchParams.append('step', step.toString())
  urlWithParams.searchParams.append('offset', offset.toString())
  urlWithParams.searchParams.append('limit', limit.toString())

  return await (await fetch(urlWithParams)).json()
}
