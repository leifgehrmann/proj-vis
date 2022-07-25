<script setup lang="ts">
import './index.css'
import {ref, onMounted, watch} from 'vue'
import {getProjectionExamples} from "./exampleProjections";
import {debounce} from "./debounce";
import ProjectionInput from "./components/ProjectionInput.vue";
import RangeInput from "./components/RangeInput.vue";
import ProgressBar from "./components/ProgressBar.vue";
import ProjectedCoordinates from "./components/ProjectedCoordinates.vue";
import ValidCoordinates from "./components/ValidCoordinates.vue";
import ExampleSelector from "./components/ExampleSelector.vue";
import {computeProjection} from "./computeProjection";

const projectionExamples = getProjectionExamples()
const selectedExample = ref('ortho')
let projection = ref('')
let latRangeMin = ref(-90)
let latRangeMax = ref(90)
let lonRangeMin = ref(-180)
let lonRangeMax = ref(180)
let step = ref(1)
let processId = ref(0)
let progress = ref(0)
let totalProjectedSamples = ref(0)
let markerProjectedCoordinate = ref(undefined)
let validLonValues = ref([])
let validLatValues = ref([])
let projectedXValues = ref([])
let projectedYValues = ref([])
let colorValues = ref([])

function updateSelectedExampleValues() {
  let selectedExampleIndex = selectedExample.value
  if (selectedExampleIndex === '-1') {
    return
  }
  projection.value = projectionExamples[selectedExampleIndex].proj4
  latRangeMin.value = projectionExamples[selectedExampleIndex].latRangeMin
  latRangeMax.value = projectionExamples[selectedExampleIndex].latRangeMax
  lonRangeMin.value = projectionExamples[selectedExampleIndex].lonRangeMin
  lonRangeMax.value = projectionExamples[selectedExampleIndex].lonRangeMax
  step.value = projectionExamples[selectedExampleIndex].step
}

async function displayProjection() {
  await computeProjection(
    projection,
    latRangeMin,
    latRangeMax,
    lonRangeMin,
    lonRangeMax,
    step,
    processId,
    totalProjectedSamples,
    progress,
    validLonValues,
    validLatValues,
    projectedXValues,
    projectedYValues,
    colorValues
  )
}

const debouncedDisplayProjection = debounce(displayProjection, 100)

onMounted(async () => {
  updateSelectedExampleValues()
  await debouncedDisplayProjection()
})

watch([selectedExample], async () => {
  updateSelectedExampleValues()
  await debouncedDisplayProjection()
})

watch([projection, latRangeMin, latRangeMax, lonRangeMin, lonRangeMax, step], async () => {
  await debouncedDisplayProjection()
})

</script>

<template>
  <div class="container mx-auto text-white">
    <header class="p-5">
      <h1 class="text-center font-black italic text-3xl">proj-vis</h1>
    </header>
    <article
      class="px-2 grid grid-cols-1 gap-y-2 lg:grid-cols-2 lg:gap-x-2 lg:gap-y-0"
    >
      <div>
        <div
          class="grid grid-cols-2 auto-cols-max gap-y-2 gap-x-2"
          style="grid-template-columns: calc(30% - 0.5rem) 70%;"
        >
          <ExampleSelector
            v-model:selected-example="selectedExample"
          />
          <ProjectionInput v-model:projection="projection" />
          <RangeInput
              v-model:lat-range-min="latRangeMin"
              v-model:lat-range-max="latRangeMax"
              v-model:lon-range-min="lonRangeMin"
              v-model:lon-range-max="lonRangeMax"
              v-model:step="step"
          />
        </div>
      </div>
      <div
        class="grid grid-cols-1 gap-y-2 auto-rows-min"
        :class="{invisible: progress === 0}"
      >
        <ProgressBar
          :progress="progress"
          :total-projected-samples="totalProjectedSamples"
        />
        <ValidCoordinates
          :step="step"
          :lon-values="validLonValues"
          :lat-values="validLatValues"
          :color-values="colorValues"
        />
        <ProjectedCoordinates
          :x-values="projectedXValues"
          :y-values="projectedYValues"
          :color-values="colorValues"
          :marker-coordinate="markerProjectedCoordinate"
        />
      </div>
    </article>
    <footer class="sm:p-10 text-center">
      <a href="https://github.com/leifgehrmann/proj-vis">
        🐙 <span class="underline decoration-wavy">View project on GitHub.com</span>
      </a>
    </footer>
  </div>
</template>
