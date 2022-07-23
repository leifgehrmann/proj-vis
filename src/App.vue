<script setup lang="ts">
import './index.css'
import {ref, onMounted, watch} from 'vue'
import proj4 from 'proj4'
import seaLandImage from './assets/sea-land.png'
import {getProjectionExamples} from "./exampleProjections";
import {debounce} from "./debounce";
import {createValidCoordinatesCanvas} from "./validCoordinatesCanvas";
import {createProjectedCoordinatesCanvas} from "./projectedCoordinatesCanvas";
import ProjectionInput from "./components/ProjectionInput.vue";

const projectionExamples = getProjectionExamples()
const selectedExample = ref(0)
let projection = ref('')
let latRangeMin = ref(0)
let latRangeMax = ref(0)
let lonRangeMin = ref(0)
let lonRangeMax = ref(0)
let step = ref(0)

function updateSelectedExampleValues() {
  const selectedExampleIndex = selectedExample.value
  console.log(selectedExampleIndex)
  projection.value = projectionExamples[selectedExampleIndex].proj4
  latRangeMin.value = projectionExamples[selectedExampleIndex].latRangeMin
  latRangeMax.value = projectionExamples[selectedExampleIndex].latRangeMax
  lonRangeMin.value = projectionExamples[selectedExampleIndex].lonRangeMin
  lonRangeMax.value = projectionExamples[selectedExampleIndex].lonRangeMax
  step.value = projectionExamples[selectedExampleIndex].step
}

function loadImage(imgElement: HTMLImageElement): Promise<void> {
  return new Promise((resolve) => {
    imgElement.onload = () => {
      resolve()
    }
    if (imgElement.complete) {
      resolve()
    }
  })
}

async function displayProjection() {
  const inputMapImg = document.querySelector('#inputMap') as HTMLImageElement;

  console.log(inputMapImg.src)

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

  const projectedCoordinatesContainer = document.getElementById("myCanvas") as HTMLDivElement|null;
  if (projectedCoordinatesContainer === null) {
    return
  }

  const projectedCoordinatesCanvas = createProjectedCoordinatesCanvas(
      xValues,
      yValues,
      inputMapColors
  )

  projectedCoordinatesCanvas.style.objectFit = 'contain'
  projectedCoordinatesCanvas.classList.add('w-full')
  projectedCoordinatesCanvas.classList.add('h-full')
  projectedCoordinatesContainer.replaceChildren(projectedCoordinatesCanvas)

  const validCoordinatesContainer = document.getElementById("myCanvas2") as HTMLDivElement|null;
  if (validCoordinatesContainer === null) {
    return
  }
  const validCoordinatesCanvas = createValidCoordinatesCanvas(
      step.value,
      validLons,
      validLats,
      inputMapColors
  )

  validCoordinatesCanvas.style.imageRendering = 'pixelated'
  validCoordinatesCanvas.style.objectFit = 'contain'
  validCoordinatesCanvas.classList.add('w-full')
  validCoordinatesCanvas.classList.add('h-full')
  validCoordinatesContainer.replaceChildren(validCoordinatesCanvas)
}

const debouncedDisplayProjection = debounce(displayProjection, 500)

onMounted(async () => {
  updateSelectedExampleValues()
  await displayProjection()
})

watch([selectedExample], async () => {
  updateSelectedExampleValues()
  await displayProjection()
})

watch([projection, latRangeMin, latRangeMax, lonRangeMin, lonRangeMax, step], () => {
  debouncedDisplayProjection()
})

</script>

<template>
  <div class="container mx-auto text-white">
    <header class="p-5">
      <h1 class="text-center font-black italic text-3xl">proj-vis</h1>
    </header>
    <article class="px-2 grid grid-cols-1 gap-y-2 xl:grid-cols-2 xl:gap-x-2 xl:gap-y-0">
      <div>
        <div class="grid grid-cols-2 auto-cols-max gap-y-2 gap-x-2" style="grid-template-columns: calc(30% - 0.5rem) 70%;">
          <div><label for="example">Example:</label></div>
          <div>
            <select
                id="example"
                class="block w-full pl-2 border-2 border-white font-mono bg-red-500 focus:ring focus:ring-blue-500 rounded-none"
                v-model="selectedExample"
            >
              <option
                  v-for="(projectionExample, index) in projectionExamples"
                  :label="projectionExample.label"
                  :value="index"
              />
            </select>
          </div>
          <div><label for="projection">Proj4:</label></div>
          <div>
            <ProjectionInput v-model:projection="projection" />
          </div>
          <div><label for="latRangeMin">Latitude Range:</label></div>
          <div class="grid grid-cols-2 gap-x-2 place-content-start">
            <input
                id="latRangeMin"
                class="pl-2 border-2 border-white text-right font-mono bg-red-500 focus:ring focus:ring-blue-500"
                type="number"
                v-model="latRangeMin"
            >
            <input
                id="latRangeMax"
                class="pl-2 border-2 border-white text-right font-mono bg-red-500 focus:ring focus:ring-blue-500"
                type="number"
                v-model="latRangeMax"
            >
          </div>
          <div><label for="lonRangeMin">Longitude Range:</label></div>
          <div class="grid grid-cols-2 gap-x-2 place-content-start">
            <input
                id="lonRangeMin"
                class="pl-2 border-2 border-white text-right font-mono bg-red-500 focus:ring focus:ring-blue-500"
                type="number"
                v-model="lonRangeMin"
            >
            <input
                id="lonRangeMax"
                class="pl-2 border-2 border-white text-right font-mono bg-red-500 focus:ring focus:ring-blue-500"
                type="number"
                v-model="lonRangeMax"
            >
          </div>
          <div><label for="step">Step:</label></div>
          <div>
            <input
                id="step"
                class="w-1/3 sm:w-24 pl-2 border-2 border-white font-mono bg-red-500 focus:ring focus:ring-blue-500"
                type="number"
                v-model="step"
            >
            <p class="my-2" :class="{invisible: false}">360 × 180 = 64,800 samples</p>
<!--            <p :class="{invisible: true}">Too many samples: 6,480,000 (3,600 × 1,800). <br>Maximum is 1,000,000 samples. </p>-->
          </div>
          <div class="col-span-2 border-2 border-white bg-black">
            <img
                id="inputMap"
                alt="The world map"
                class="w-full aspect-[2/1]"
                :src="seaLandImage"
            >
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-y-2">
        <div class="border-2 p-2 border-white w-full bg-black min-h-[8rem] max-h-96" id="myCanvas2">
        </div>
        <div class="border-2 p-2 border-white w-full bg-black min-h-[8rem] max-h-96" id="myCanvas">
        </div>
      </div>
    </article>
    <footer class="sm:p-10 text-center">
      <a href="https://github.com/leifgehrmann/proj-vis">🐙 <span class="underline decoration-wavy">View project on GitHub.com</span></a>
    </footer>
  </div>
</template>
