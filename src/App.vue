<script setup lang="ts">
import './index.css'
import { ref, onMounted } from 'vue'
import proj4 from 'proj4'
const projection = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs '

onMounted(() => {
  const canvas2 = document.getElementById("myCanvas2");
  const ctx2 = canvas2.getContext("2d");
  ctx2.fillStyle = "#000000";
  ctx2.fillRect(0, 0, 400, 400);

  const canvas = document.getElementById("myCanvas");
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, 400, 400);

  const transformer = proj4(projection);
  const xValues = []
  const yValues = []
  const validLons = []
  const validLats = []

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
    }
  }
  const minX = xValues.reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY)
  const maxX = xValues.reduce((a, b) => Math.max(a, b), Number.NEGATIVE_INFINITY)
  const dX = maxX - minX
  const minY = yValues.reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY)
  const maxY = yValues.reduce((a, b) => Math.max(a, b), Number.NEGATIVE_INFINITY)
  const dY = maxY - minY

  const ratio = dX / dY
  let rWidth = 400
  let rHeight = 400 / ratio
  if (ratio < 1) {
    rWidth = 400 * ratio
    rHeight = 400
  }

  const minLon = validLons.reduce((a, b) => Math.min(a, b))
  const maxLon = validLons.reduce((a, b) => Math.max(a, b))
  const dLon = maxLon - minLon
  const minLat = validLats.reduce((a, b) => Math.min(a, b))
  const maxLat = validLats.reduce((a, b) => Math.max(a, b))
  const dLat = maxLat - minLat


  for (let i = 0; i < xValues.length; i++) {
    const roundedX = Math.round((xValues[i] - minX) / (dX) * rWidth)
    const roundedY = Math.round(rHeight-(yValues[i] - minY) / (dY) * rHeight)
    ctx.fillStyle = `rgb(${((validLats[i] + 90) / 180 * 255)}, ${((validLons[i] + 180) / 360 * 255)},0)`;
    ctx.fillRect(roundedX, roundedY, 1, 1);
  }

  for (let i = 0; i < validLons.length; i++) {
    const x = (validLons[i] - minLon) / (dLon) * (maxLonRange - minLonRange) / dxLonRange
    const y = (validLats[i] - minLat) / (dLat) * (maxLatRange - minLatRange) / dxLatRange
    ctx2.fillStyle = `rgb(${((validLats[i] + 90) / 180 * 255)}, ${((validLons[i] + 180) / 360 * 255)},0)`;
    ctx2.fillRect(x, y, 1, 1);
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
          <p :class="{invisible: true}">Valid projection</p>
        </div>
        <div><label for="bbox">Boundary Box:</label></div>
        <div>
          <input id="bbox" class="w-full sm:w-64 px-2 border-2 border-white font-mono bg-red-500 focus:ring focus:ring-blue-500" type="text" value="-90, -180, 90, 180">
        </div>
        <div><label for="detail">Detail:</label></div>
        <div>
          <input id="detail" class="w-full sm:w-64 px-2 border-2 border-white font-mono bg-red-500 focus:ring focus:ring-blue-500" type="text" value="1">
          <p :class="{invisible: false}">Too many samples: 6,480,000 (3,600 × 1,800). <br>Maximum is 1 million samples. </p>
        </div>
      </div>
      <div class="my-2 border-2 border-white aspect-[2/1] bg-black">
      </div>
      <div class="my-2 border-2 border-white w-full aspect-[2/1] bg-black">
        <canvas id="myCanvas2" class="w-full" width="400px" height="200px"></canvas>
      </div>
      <div class="my-2 border-2 border-white aspect-[1/1] bg-black">
        <canvas id="myCanvas" class="w-full" width="400px" height="400px"></canvas>
      </div>
    </article>
    <footer class="sm:p-10 text-center">
      <a href="https://github.com/leifgehrmann/proj-vis">🐙 <span class="underline decoration-wavy">View project on GitHub.com</span></a>
    </footer>
  </div>
</template>
