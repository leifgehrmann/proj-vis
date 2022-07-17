<script setup lang="ts">
import './index.css'
import { ref, onMounted } from 'vue'
import proj4 from 'proj4'
import seaLandImage from './assets/sea-land.png'

let projection = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs '
function loadImage(imgElement: HTMLImageElement): Promise<void> {
  return new Promise((resolve, reject) => {
    imgElement.onload = () => {
      resolve()
    }
  })
}

onMounted(async () => {
  const inputMapImg = document.querySelector('#inputMap') as HTMLImageElement;

  console.log(inputMapImg.src)

  await loadImage(inputMapImg)

  const inputMapCanvas = document.createElement('canvas');
  const inputMapCtx = inputMapCanvas.getContext('2d');

  inputMapCanvas.width = inputMapImg.naturalWidth;
  inputMapCanvas.height = inputMapImg.naturalHeight;
  inputMapCtx.drawImage(inputMapImg, 0, 0);

  const canvas2 = document.getElementById("myCanvas2") as HTMLCanvasElement|null;
  if (canvas2 === null) {
    return
  }
  const ctx2 = canvas2.getContext("2d");
  if (ctx2 === null) {
    return
  }
  ctx2.fillStyle = "#000000";
  ctx2.fillRect(0, 0, 800, 800);

  const canvas = document.getElementById("myCanvas") as HTMLCanvasElement|null;
  if (canvas === null) {
    return
  }
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    return
  }

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, 1000, 1000);

  const transformer = proj4(projection);
  const xValues = []
  const yValues = []
  const validLons = []
  const validLats = []
  const inputMapColors = []

  const minLatRange = -90
  const maxLatRange = 90
  const minLonRange = -180
  const maxLonRange = 180
  const dxLatRange = 1
  const dxLonRange = 1


  for (let lat = minLatRange; lat < maxLatRange; lat += dxLatRange) {
    for (let lon = minLonRange; lon < maxLonRange; lon += dxLonRange) {
      const value = transformer.forward([lon,lat])
      if (!Number.isFinite(value[0]) || Number.isNaN(value[0]) || !Number.isFinite(value[1]) || Number.isNaN(value[1])) {
        continue
      }
      xValues.push(value[0])
      yValues.push(value[1])
      validLons.push(lon)
      validLats.push(lat)
      const inputMapImgX = Math.round((lon + 180)/360 * inputMapImg.naturalWidth)
      const inputMapImgY = Math.round((-lat + 90)/180 * inputMapImg.naturalHeight)
      inputMapColors.push(inputMapCtx.getImageData(
          inputMapImgX, inputMapImgY, 1, 1
      ).data)
    }
  }

  if (xValues.length == 0) {
    console.log('No values projected')
    return
  }

  const minX = xValues.reduce((a, b) => Math.min(a, b))
  const maxX = xValues.reduce((a, b) => Math.max(a, b))
  const dX = maxX - minX
  const minY = yValues.reduce((a, b) => Math.min(a, b))
  const maxY = yValues.reduce((a, b) => Math.max(a, b))
  const dY = maxY - minY

  const ratio = dX / dY
  let rWidth = 1000
  let rHeight = 1000 / ratio
  if (ratio < 1) {
    rWidth = 1000 * ratio
    rHeight = 1000
  }

  const minLon = validLons.reduce((a, b) => Math.min(a, b))
  const maxLon = validLons.reduce((a, b) => Math.max(a, b))
  const dLon = maxLon - minLon
  const minLat = validLats.reduce((a, b) => Math.min(a, b))
  const maxLat = validLats.reduce((a, b) => Math.max(a, b))
  const dLat = maxLat - minLat

  for (let i = 0; i < xValues.length; i++) {
    const roundedX = Math.round((xValues[i] - minX) / (dX) * rWidth)
    const roundedY = Math.round((rHeight-(yValues[i] - minY) / (dY) * rHeight))
    const color = inputMapColors[i]
    ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    ctx.fillRect(roundedX, roundedY, 2, 2);
  }

  for (let i = 0; i < validLons.length; i++) {
    const x = ((validLons[i] - minLon) / (dLon) * (maxLonRange - minLonRange) / dxLonRange) * 2
    const y = ((-validLats[i] - minLat) / (dLat) * (maxLatRange - minLatRange) / dxLatRange) * 2
    const color = inputMapColors[i]
    ctx2.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    ctx2.fillRect(x, y, 2, 2);
  }
})

</script>

<template>
  <div class="container mx-auto text-white">
    <header class="p-5">
      <h1 class="text-center font-black italic text-3xl">proj-vis</h1>
    </header>
    <article class="px-2 flex flex-col">
      <div class="grid grid-cols-2 auto-cols-max gap-y-2" style="grid-template-columns: 30% 70%;">
        <div><label for="projection">Proj4:</label></div>
        <div>
          <textarea
            id="projection"
            class="block w-full h-32 px-2 border-2 border-white font-mono bg-red-500 focus:ring focus:ring-blue-500"
            autocapitalize="off"
            autocomplete="off"
            :value="projection"
          ></textarea>
          <p :class="{invisible: false}">Invalid projection.</p>
        </div>
        <div><label for="bbox">Boundary Box:</label></div>
        <div>
          <input id="bbox" class="w-full sm:w-64 px-2 border-2 border-white font-mono bg-red-500 focus:ring focus:ring-blue-500" type="text" value="-90, -180, 90, 180">
        </div>
        <div><label for="detail">Detail:</label></div>
        <div>
          <input id="detail" class="w-full sm:w-64 px-2 border-2 border-white font-mono bg-red-500 focus:ring focus:ring-blue-500" type="text" value="1">
          <p :class="{invisible: false}">Too many samples: 6,480,000 (3,600 × 1,800). <br>Maximum is 1,000,000 samples. </p>
        </div>
      </div>
      <div class="my-2 border-2 border-white bg-black">
        <img
          id="inputMap"
          alt="The world map"
          class="w-full aspect-[2/1]"
          :src="seaLandImage"
        >
      </div>
      <div class="my-2 border-2 border-white w-full aspect-[2/1] bg-black">
        <canvas id="myCanvas2" class="w-full" width="800" height="800"></canvas>
      </div>
      <div class="my-2 border-2 border-white aspect-[1/1] bg-black">
        <canvas id="myCanvas" class="w-full" width="1000" height="1000"></canvas>
      </div>
    </article>
    <footer class="sm:p-10 text-center">
      <a href="https://github.com/leifgehrmann/proj-vis">🐙 <span class="underline decoration-wavy">View project on GitHub.com</span></a>
    </footer>
  </div>
</template>
