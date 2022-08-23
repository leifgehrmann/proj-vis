import proj4, {Converter} from "proj4";
import {isValidProjection} from "./isValidProjection";
import {waitForAnimationFrame} from "./waitForAnimationFrame";
import {loadImage} from "./loadImagePromise";
import {Ref} from "vue";
import {Coordinate} from "./coord";

type Wgs84Coordinates = [number, number][]
type ProjectedCoordinates = [number|null, number|null][]

// Ideally we wouldn't be using Refs in functions, but this is just a convenient
// way to get stuff to be reactive without too much effort. Not recommended for
// prod!
export async function computeProjection(
  remoteUrl: Ref<string|null>,
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
): Promise<void> {
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
  if (remoteUrl.value === null) {
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

  if(!(await isValidProjection(projection.value, remoteUrl.value)).valid) {
    console.error('Projection is invalid')
    return
  }

  const currentProcessId = Date.now()
  processId.value = currentProcessId
  // To mitigate against floating-point precision errors, we multiply the values
  // by a scale factor and then un-multiply them.
  let scale = 1000000
  let samplesTotalWidth = Math.floor((maxLatRange * scale - minLatRange * scale) / dxLatRange / scale) + 1
  let samplesTotalHeight = Math.floor((maxLonRange * scale - minLonRange * scale) / dxLonRange / scale) + 1

  let samplesTotal = samplesTotalWidth * samplesTotalHeight
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
    if (remoteUrl.value === null) {
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
        remoteUrl.value,
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

export async function computeProjectionForCoordinate(
  remoteUrl: string|null,
  projection: string,
  coordinate: Coordinate,
  reverse: boolean
): Promise<Coordinate|null> {
  let result: number[]|null[]
  if (remoteUrl === null) {
    const transformer = proj4(projection);
    if (reverse) {
      result = transformer.inverse([coordinate.x, coordinate.y])
    } else {
      result = transformer.forward([coordinate.x, coordinate.y])
    }
  } else {
    const urlWithParams = new URL(remoteUrl)

    if (reverse) {
      urlWithParams.searchParams.append('projFrom', projection)
      urlWithParams.searchParams.append('projTo', '+proj=longlat')
    } else {
      urlWithParams.searchParams.append('projFrom', '+proj=longlat')
      urlWithParams.searchParams.append('projTo', projection)
    }
    urlWithParams.searchParams.append('x', coordinate.x.toString())
    urlWithParams.searchParams.append('y', coordinate.y.toString())

    result = await fetch(urlWithParams)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to lookup coordinate');
        }
        const result = await response.json();
        return result[0] as number[]|null[];
      })
  }

  if (result[0] === null || result[1] === null) {
    return null;
  }

  return { x: result[0], y: result[1] };
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
  // To mitigate against floating-point precision errors, we multiply the values
  // by a scale factor and then un-multiply them.
  let scale = 1000000
  const lonRange = maxLon * scale - minLon * scale
  const latRange = maxLat * scale - minLat * scale
  const lonCount = Math.floor(lonRange / step / scale) + 1
  const latCount = Math.floor(latRange / step / scale) + 1

  let pos = offset
  let count = 0

  let wgs84Coordinates: [number, number][] = []

  while (pos < lonCount * latCount) {
    let lon = minLon + (pos % lonCount) * step
    let lat = minLat + Math.floor(pos / lonCount) * step
    wgs84Coordinates.push([lon, lat])

    count += 1
    if (count === limit) {
      return wgs84Coordinates
    }

    pos += 1
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
  const urlWithParams = new URL(url)

  urlWithParams.searchParams.append('projTo', proj)
  urlWithParams.searchParams.append('minX', minLon.toString())
  urlWithParams.searchParams.append('maxX', maxLon.toString())
  urlWithParams.searchParams.append('minY', minLat.toString())
  urlWithParams.searchParams.append('maxY', maxLat.toString())
  urlWithParams.searchParams.append('step', step.toString())
  urlWithParams.searchParams.append('offset', offset.toString())
  urlWithParams.searchParams.append('limit', limit.toString())

  return await (await fetch(urlWithParams)).json()
}
