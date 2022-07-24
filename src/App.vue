<script setup lang="ts">
import './index.css'
import {ref, onMounted, watch} from 'vue'
import proj4 from 'proj4'
import {getProjectionExampleOptions, getProjectionExamples} from "./exampleProjections";
import {debounce} from "./debounce";
import {createValidCoordinatesCanvas} from "./validCoordinatesCanvas";
import {createProjectedCoordinatesCanvas} from "./projectedCoordinatesCanvas";
import ProjectionInput from "./components/ProjectionInput.vue";
import RangeInput from "./components/RangeInput.vue";
import {waitForAnimationFrame} from "./waitForAnimationFrame";

const projectionExamples = getProjectionExamples()
const projectionExampleOptions = getProjectionExampleOptions()
const selectedExample = ref(-1)
let projection = ref('')
let latRangeMin = ref(-90)
let latRangeMax = ref(90)
let lonRangeMin = ref(-180)
let lonRangeMax = ref(180)
let step = ref(1)
let processId = ref(0)
let progress = ref(0)
let totalProjectedSamples = ref(0)

function updateSelectedExampleValues() {
  let selectedExampleIndex = selectedExample.value
  if (selectedExampleIndex === -1) {
    return
  }
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
  const currentProcessId = Date.now()
  processId.value = currentProcessId
  const inputMapImg = document.querySelector('#inputMap') as HTMLImageElement;
  const projectedCoordinatesContainer = document.getElementById("projectedCoordinatesContainer") as HTMLDivElement|null;
  const validCoordinatesContainer = document.getElementById("validCoordinatesContainer") as HTMLDivElement|null;

  if (projectedCoordinatesContainer === null) {
    return
  }
  if (validCoordinatesContainer === null) {
    return
  }

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
      const inputMapImgX = Math.round((lon + 180)/360 * inputMapImg.naturalWidth)
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

  if (xValues.length == 0) {
    projectedCoordinatesContainer.textContent = ''
    validCoordinatesContainer.textContent = ''
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

const debouncedDisplayProjection = debounce(displayProjection, 100)

onMounted(async () => {
  updateSelectedExampleValues()
  debouncedDisplayProjection()
})

watch([selectedExample], async () => {
  updateSelectedExampleValues()
  debouncedDisplayProjection()
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
                class="block w-full pl-2 border-2 border-white bg-red-500 focus:ring focus:ring-blue-500 rounded-none"
                v-model="selectedExample"
            >
              <option value="-1">Select an example…</option>
              <optgroup
                  v-for="(projectionExampleGroup) in projectionExampleOptions"
                  :label="projectionExampleGroup.label"
              >
                <option
                    v-for="(projectionExampleId) in projectionExampleGroup.options"
                    :value="projectionExampleId"
                >{{projectionExamples[projectionExampleId].label}}</option>
              </optgroup>
            </select>
          </div>
          <div><label for="projection">Proj4:</label></div>
          <div>
            <ProjectionInput v-model:projection="projection" />
          </div>
          <RangeInput
              v-model:lat-range-min="latRangeMin"
              v-model:lat-range-max="latRangeMax"
              v-model:lon-range-min="lonRangeMin"
              v-model:lon-range-max="lonRangeMax"
              v-model:step="step"
          />
        </div>
      </div>
      <div class="grid grid-cols-1 gap-y-2 auto-rows-min">
        <div>
          <div class="w-full border-2 border-white h-6 bg-white">
            <div class="bg-blue-500 h-full text-white" :style="{ width: `${progress * 100}%` }">
              <div class="w-full h-full text-right px-2 whitespace-nowrap overflow-hidden" v-if="progress < 1">{{ Math.floor(progress * 100) }}%</div>
              <div class="w-full text-center" v-if="progress === 1">{{ totalProjectedSamples.toLocaleString() }} samples projected</div>
            </div>
          </div>
        </div>
        <div class="border-2 p-2 border-white w-full bg-black min-h-[8rem] max-h-96" id="validCoordinatesContainer"></div>
        <div class="text-center">&nbsp;</div>
        <div class="border-2 p-2 border-white w-full bg-black min-h-[8rem] max-h-96" id="projectedCoordinatesContainer"></div>
        <div class="text-center">&nbsp;</div>
      </div>
    </article>
    <footer class="sm:p-10 text-center">
      <a href="https://github.com/leifgehrmann/proj-vis">🐙 <span class="underline decoration-wavy">View project on GitHub.com</span></a>
    </footer>
  </div>
</template>
