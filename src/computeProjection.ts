import proj4, { Converter } from 'proj4';
import { Ref } from 'vue';
import isValidProjection from './isValidProjection';
import waitForAnimationFrame from './waitForAnimationFrame';
import loadImage from './loadImagePromise';
import { Coordinate } from './coord';

type Wgs84Coordinates = [number, number][];
type ProjectedCoordinates = [number | null, number | null][];

export async function computeProjectionForCoordinate(
  remoteUrl: string | null,
  projection: string,
  coordinate: Coordinate,
  reverse: boolean,
): Promise<Coordinate | null> {
  let result: number[] | null[];
  if (remoteUrl === null) {
    const transformer = proj4(projection);
    if (reverse) {
      result = transformer.inverse([coordinate.x, coordinate.y]);
    } else {
      result = transformer.forward([coordinate.x, coordinate.y]);
    }
  } else {
    const urlWithParams = new URL(remoteUrl);

    if (reverse) {
      urlWithParams.searchParams.append('projFrom', projection);
      urlWithParams.searchParams.append('projTo', '+proj=longlat');
    } else {
      urlWithParams.searchParams.append('projFrom', '+proj=longlat');
      urlWithParams.searchParams.append('projTo', projection);
    }
    urlWithParams.searchParams.append('x', coordinate.x.toString());
    urlWithParams.searchParams.append('y', coordinate.y.toString());

    result = await fetch(urlWithParams)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to lookup coordinate');
        }
        const responseJson = await response.json();
        return responseJson[0] as number[] | null[];
      });
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
  limit: number,
): Wgs84Coordinates {
  // To mitigate against floating-point precision errors, we multiply the values
  // by a scale factor and then un-multiply them.
  const scale = 1000000;
  const lonRange = maxLon * scale - minLon * scale;
  const latRange = maxLat * scale - minLat * scale;
  const lonCount = Math.floor(lonRange / step / scale) + 1;
  const latCount = Math.floor(latRange / step / scale) + 1;

  let pos = offset;
  let count = 0;

  const wgs84Coordinates: [number, number][] = [];

  while (pos < lonCount * latCount) {
    const lon = minLon + (pos % lonCount) * step;
    const lat = minLat + Math.floor(pos / lonCount) * step;
    wgs84Coordinates.push([lon, lat]);

    count += 1;
    if (count === limit) {
      return wgs84Coordinates;
    }

    pos += 1;
  }

  return wgs84Coordinates;
}

async function generateLocalBatch(
  transformer: Converter,
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number,
  step: number,
  offset: number,
  limit: number,
): Promise<ProjectedCoordinates> {
  await waitForAnimationFrame();

  return generateWgs84Coordinates(
    minLat,
    maxLat,
    minLon,
    maxLon,
    step,
    offset,
    limit,
  ).map(([lon, lat]) => {
    const point = transformer.forward([lon, lat]);
    if (
      !Number.isFinite(point[0])
      || Number.isNaN(point[0])
      || !Number.isFinite(point[1])
      || Number.isNaN(point[1])
    ) {
      return [null, null];
    }

    return point as [number | null, number | null];
  });
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
  limit: number,
): Promise<ProjectedCoordinates> {
  const urlWithParams = new URL(url);

  urlWithParams.searchParams.append('projTo', proj);
  urlWithParams.searchParams.append('minX', minLon.toString());
  urlWithParams.searchParams.append('maxX', maxLon.toString());
  urlWithParams.searchParams.append('minY', minLat.toString());
  urlWithParams.searchParams.append('maxY', maxLat.toString());
  urlWithParams.searchParams.append('step', step.toString());
  urlWithParams.searchParams.append('offset', offset.toString());
  urlWithParams.searchParams.append('limit', limit.toString());

  return (await fetch(urlWithParams)).json();
}

// Ideally we wouldn't be using Refs in functions, but this is just a convenient
// way to get stuff to be reactive without too much effort. Not recommended for
// prod!
export async function computeProjection(
  remoteUrl: string | null,
  projection: string,
  latRangeMin: number,
  latRangeMax: number,
  lonRangeMin: number,
  lonRangeMax: number,
  step: number,
  processId: Ref<number>,
  processIdCallback: (processId: number) => void,
  progressCallback: (
    totalProjectedSamples: number,
    progress: number
  ) => void,
  finishedCallback: (
    validStep: number,
    validLonValues: number[],
    validLatValues: number[],
    projectedXValues: number[],
    projectedYValues: number[],
    colorValues: Uint8ClampedArray[],
  ) => void,
): Promise<void> {
  // This is a hacky way of getting the contents of the image in `RangeInput.vue`.
  // I know, it's not pretty, but proj-vis isn't meant to be an example good code,
  // just a quick hacky tool.
  const inputMapImg = document.querySelector('#inputMap') as HTMLImageElement;

  await loadImage(inputMapImg);

  const inputMapCanvas = document.createElement('canvas');
  const inputMapCtx = inputMapCanvas.getContext('2d');
  if (inputMapCtx === null) {
    return;
  }

  inputMapCanvas.width = inputMapImg.naturalWidth;
  inputMapCanvas.height = inputMapImg.naturalHeight;
  inputMapCtx.drawImage(inputMapImg, 0, 0);

  let transformer;
  if (remoteUrl === null) {
    transformer = proj4(projection);
  } else {
    transformer = proj4('+proj=longlat');
  }
  const xValues = [];
  const yValues = [];
  const validLons = [];
  const validLats = [];
  const inputMapColors = [];

  const minLatRange = latRangeMin;
  const maxLatRange = latRangeMax;
  const minLonRange = lonRangeMin;
  const maxLonRange = lonRangeMax;
  const dxLatRange = step;
  const dxLonRange = step;

  if (step <= 0.001) {
    // Step value cannot be so low.
    return;
  }

  if (!(await isValidProjection(projection, remoteUrl)).valid) {
    // Projection is invalid.
    return;
  }

  const currentProcessId = Date.now();
  processIdCallback(currentProcessId);
  // To mitigate against floating-point precision errors, we multiply the values
  // by a scale factor and then un-multiply them.
  const scale = 1000000;
  const samplesTotalWidth = Math.floor(
    (maxLatRange * scale - minLatRange * scale) / dxLatRange / scale,
  ) + 1;
  const samplesTotalHeight = Math.floor(
    (maxLonRange * scale - minLonRange * scale) / dxLonRange / scale,
  ) + 1;

  const samplesTotal = samplesTotalWidth * samplesTotalHeight;
  let samplesCollected = 0;
  progressCallback(0, 0);

  let offset = 0;
  const limit = 1000;
  while (samplesCollected < samplesTotal) {
    if (processId.value !== currentProcessId) {
      // If the processId has changed, stop running this process.
      return;
    }

    const wgs84Coordinates = generateWgs84Coordinates(
      minLatRange,
      maxLatRange,
      minLonRange,
      maxLonRange,
      dxLatRange,
      offset,
      limit,
    );

    let projectedCoordinates;
    if (remoteUrl === null) {
      // Disable the rule because in this case we do not want to take
      // advantage of parallelization. A more complicated design would
      // be required if we wanted to.
      // eslint-disable-next-line no-await-in-loop
      projectedCoordinates = await generateLocalBatch(
        transformer,
        minLatRange,
        maxLatRange,
        minLonRange,
        maxLonRange,
        dxLatRange,
        offset,
        limit,
      );
    } else {
      // Disable the rule because in this case we do not want to take
      // advantage of parallelization. A more complicated design would
      // be required if we wanted to.
      // eslint-disable-next-line no-await-in-loop
      projectedCoordinates = await generateRemoteBatch(
        remoteUrl,
        projection,
        minLatRange,
        maxLatRange,
        minLonRange,
        maxLonRange,
        dxLatRange,
        offset,
        limit,
      );
    }

    offset += limit;
    samplesCollected += limit;
    progressCallback(validLons.length, samplesCollected / samplesTotal);

    for (let index = 0; index < projectedCoordinates.length; index += 1) {
      const [lon, lat] = wgs84Coordinates[index];
      const [x, y] = projectedCoordinates[index];

      if (x === null || y === null) {
        // Readability is not an issue in this case.
        // eslint-disable-next-line no-continue
        continue;
      }

      xValues.push(x);
      yValues.push(y);
      validLons.push(lon);
      validLats.push(lat);

      const inputMapImgX = Math.round(
        ((lon + 180 + 360) / 360) * inputMapImg.naturalWidth,
      ) % inputMapImg.naturalWidth;
      const inputMapImgY = Math.round(
        ((-lat + 90) / 180) * inputMapImg.naturalHeight,
      );
      inputMapColors.push(inputMapCtx.getImageData(inputMapImgX, inputMapImgY, 1, 1).data);
    }
  }

  progressCallback(validLons.length, 1);

  if (processId.value !== currentProcessId) {
    return;
  }

  finishedCallback(
    step,
    validLons,
    validLats,
    xValues,
    yValues,
    inputMapColors,
  );
}
