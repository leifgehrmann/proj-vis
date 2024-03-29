<script setup lang="ts">
import './index.css';
import {
  ref, onMounted, watch,
} from 'vue';
import { getProjectionExamples } from './exampleProjections';
import debounce from './debounce';
import ProjectionInput from './components/ProjectionInput.vue';
import RangeInput from './components/RangeInput.vue';
import ProgressBar from './components/ProgressBar.vue';
import ProjectedCoordinates from './components/ProjectedCoordinates.vue';
import ValidCoordinates from './components/ValidCoordinates.vue';
import ExampleSelector from './components/ExampleSelector.vue';
import { computeProjection, computeProjectionForCoordinate } from './computeProjection';
import getProjVisServerUrl from './definedVars';
import { Coordinate } from './coord';

const remoteUrl = ref(getProjVisServerUrl());
const projectionExamples = getProjectionExamples();
const selectedExample = ref('ortho');
const projection = ref('');
const latRangeMin = ref(-90);
const latRangeMax = ref(90);
const lonRangeMin = ref(-180);
const lonRangeMax = ref(180);
const step = ref(1);
const processId = ref(0);
const progress = ref(0);
const totalProjectedSamples = ref(0);
const markerProjectedCoordinate = ref(null as Coordinate | null);
const markerValidCoordinate = ref(null as Coordinate | null);
const validStep = ref(1);
const validLonValues = ref([] as number[]);
const validLatValues = ref([] as number[]);
const projectedXValues = ref([] as number[]);
const projectedYValues = ref([] as number[]);
const colorValues = ref([] as Uint8ClampedArray[]);

function updateSelectedExampleValues() {
  const selectedExampleIndex = selectedExample.value;
  if (selectedExampleIndex === '-1') {
    return;
  }
  projection.value = projectionExamples[selectedExampleIndex].proj4;
  latRangeMin.value = projectionExamples[selectedExampleIndex].latRangeMin;
  latRangeMax.value = projectionExamples[selectedExampleIndex].latRangeMax;
  lonRangeMin.value = projectionExamples[selectedExampleIndex].lonRangeMin;
  lonRangeMax.value = projectionExamples[selectedExampleIndex].lonRangeMax;
  step.value = projectionExamples[selectedExampleIndex].step;
}

async function displayProjection() {
  await computeProjection(
    remoteUrl.value,
    projection.value,
    latRangeMin.value,
    latRangeMax.value,
    lonRangeMin.value,
    lonRangeMax.value,
    step.value,
    processId,
    (newProcessId) => {
      processId.value = newProcessId;
    },
    (
      newTotalProjectedSamples,
      newProgress,
    ) => {
      totalProjectedSamples.value = newTotalProjectedSamples;
      progress.value = newProgress;
    },
    (
      newValidStep,
      newValidLonValues,
      newValidLatValues,
      newProjectedXValues,
      newProjectedYValues,
      newColorValues,
    ) => {
      validStep.value = newValidStep;
      validLonValues.value = newValidLonValues;
      validLatValues.value = newValidLatValues;
      projectedXValues.value = newProjectedXValues;
      projectedYValues.value = newProjectedYValues;
      colorValues.value = newColorValues;
    },
  );
}

const debouncedDisplayProjection = debounce(displayProjection, 100);

onMounted(async () => {
  updateSelectedExampleValues();
  await debouncedDisplayProjection();
});

watch([selectedExample], async () => {
  updateSelectedExampleValues();
  await debouncedDisplayProjection();
});

watch([projection, latRangeMin, latRangeMax, lonRangeMin, lonRangeMax, step], async () => {
  await debouncedDisplayProjection();
});

async function updateValidCoordinate(newValidCoordinate: Coordinate | null) {
  markerValidCoordinate.value = newValidCoordinate;
  if (markerValidCoordinate.value === null) {
    return;
  }
  markerProjectedCoordinate.value = await computeProjectionForCoordinate(
    remoteUrl.value,
    projection.value,
    markerValidCoordinate.value,
    false,
  );
}

async function updateProjectedCoordinate(newProjectedCoordinate: Coordinate | null) {
  markerProjectedCoordinate.value = newProjectedCoordinate;
  if (markerProjectedCoordinate.value === null) {
    return;
  }
  markerValidCoordinate.value = await computeProjectionForCoordinate(
    remoteUrl.value,
    projection.value,
    markerProjectedCoordinate.value,
    true,
  );
}

</script>

<template>
  <div class="container mx-auto text-white">
    <header class="px-2 py-5 lg:py-10">
      <h1 class="text-center font-black italic text-3xl lg:text-7xl py-8 lg:py-16">proj-vis</h1>
      <p class="mx-auto text-center py-4 lg:py-8 md:max-w-xl">
        A simple web-app to visualize map projections.
      </p>
      <p class="mx-auto text-sm md:max-w-2xl py-8">
        Using the form below, enter a "<a href="https://proj.org/usage/quickstart.html">proj-string</a>" and select a
        range of coordinates to sample.
        The individual coordinates will then be visualized on a canvas, along
        with a map of which points were successfully projected.
        <span v-if="remoteUrl === null">
          <span class="font-bold">Note:</span> For now the only projections that work are the ones supported by <a href="https://trac.osgeo.org/proj4js/wiki/UserGuide#Supportedprojectionclasses">Proj4js</a>.
          To access the full list of projections, <a href="https://github.com/leifgehrmann/proj-vis#full-version">see these instructions</a>.
        </span>
        <span v-else>
          See the <a href="https://proj.org/operations/projections/index.html">full list of projections</a> to create and configure your own projections.
        </span>
      </p>
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
          <ProjectionInput
            v-model:projection="projection"
            :remote-url="remoteUrl"
          />
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
        :class="{ invisible: progress === 0 }"
      >
        <ProgressBar
          :progress="progress"
          :total-projected-samples="totalProjectedSamples"
        />
        <ProjectedCoordinates
          :x-values="projectedXValues"
          :y-values="projectedYValues"
          :color-values="colorValues"
          :marker-coordinate="markerProjectedCoordinate"
          @update:marker-coordinate="updateProjectedCoordinate"
        />
        <p class="text-center">Samples successfully projected:</p>
        <ValidCoordinates
          :step="validStep"
          :lon-values="validLonValues"
          :lat-values="validLatValues"
          :color-values="colorValues"
          :marker-coordinate="markerValidCoordinate"
          @update:marker-coordinate="updateValidCoordinate"
        />
      </div>
    </article>
    <footer class="py-32 text-center">
      <a href="https://github.com/leifgehrmann/proj-vis">
        <span>View project on GitHub.com</span>
      </a>
    </footer>
  </div>
</template>

<style scoped>
a {
  @apply underline decoration-white decoration-2 underline-offset-2 whitespace-nowrap hover:opacity-80;
}
</style>
