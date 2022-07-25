<template>
  <div><label for="latRangeMin">Latitude Range:</label></div>
  <div class="grid grid-cols-2 gap-x-2 place-content-start">
    <input
        id="latRangeMin"
        class="pl-2 border-2 border-white text-right font-mono bg-red-500 focus:ring focus:ring-blue-500"
        type="number"
        v-model="latRangeMinModel"
    >
    <input
        id="latRangeMax"
        class="pl-2 border-2 border-white text-right font-mono bg-red-500 focus:ring focus:ring-blue-500"
        type="number"
        v-model="latRangeMaxModel"
    >
  </div>
  <div><label for="lonRangeMin">Longitude Range:</label></div>
  <div class="grid grid-cols-2 gap-x-2 place-content-start">
    <input
        id="lonRangeMin"
        class="pl-2 border-2 border-white text-right font-mono bg-red-500 focus:ring focus:ring-blue-500"
        type="number"
        v-model="lonRangeMinModel"
    >
    <input
        id="lonRangeMax"
        class="pl-2 border-2 border-white text-right font-mono bg-red-500 focus:ring focus:ring-blue-500"
        type="number"
        v-model="lonRangeMaxModel"
    >
  </div>
  <div><label for="step">Step:</label></div>
  <div>
    <input
        id="step"
        class="w-1/3 sm:w-24 pl-2 border-2 border-white font-mono bg-red-500 focus:ring focus:ring-blue-500"
        type="number"
        v-model="stepModel"
    >
    <p class="my-2" :class="{invisible: false}">{{(horizontalSamples ?? 0).toLocaleString()}} × {{(verticalSamples ?? 0).toLocaleString()}} = {{(totalSamples ?? 0).toLocaleString()}} samples</p>
  </div>
  <div
      ref="worldMap"
      class="col-span-2 border-2 border-white bg-black relative select-none cursor-crosshair"
  >
    <img
        id="inputMap"
        alt="The world map"
        class="w-full aspect-[2/1] select-none pointer-events-none"
        :src="seaLandImage"
    >
    <svg class="absolute top-0 left-0 w-full select-none pointer-events-none cursor-crosshair" viewBox="0 0 360 180">
      <g fill-rule="evenodd" fill="rgba(0, 0, 0, 0.4)" >
        <path :d="`
        M0 0 H360 V180 H0z
        M${(lonRangeMin ?? 0) + 180} ${90 - (latRangeMax ?? 0)}
        V${90 - (latRangeMin ?? 0)}
        H${(lonRangeMax ?? 0) + 180}
        V${90 - (latRangeMax ?? 0)}
        H${(lonRangeMin ?? 0) + 180}
        z`"/>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import seaLandImage from '../assets/sea-land.png'
import {computed, onMounted, ref} from "vue";

const props = defineProps({
  latRangeMin: Number,
  latRangeMax: Number,
  lonRangeMin: Number,
  lonRangeMax: Number,
  step: Number,
})

let mouseIsDown = false
const worldMap = ref<HTMLDivElement | null>(null)

const emit = defineEmits([
    'update:latRangeMin',
    'update:latRangeMax',
    'update:lonRangeMin',
    'update:lonRangeMax',
    'update:step',
])

const latRangeMinModel = computed({
  get() { return props.latRangeMin },
  set(latRangeMin) { emit('update:latRangeMin', latRangeMin) }
})
const latRangeMaxModel = computed({
  get() { return props.latRangeMax },
  set(latRangeMax) { emit('update:latRangeMax', latRangeMax) }
})
const lonRangeMinModel = computed({
  get() { return props.lonRangeMin },
  set(lonRangeMin) { emit('update:lonRangeMin', lonRangeMin) }
})
const lonRangeMaxModel = computed({
  get() { return props.lonRangeMax },
  set(lonRangeMax) { emit('update:lonRangeMax', lonRangeMax) }
})
const stepModel = computed({
  get() { return props.step },
  set(step) { emit('update:step', step) }
})

const horizontalSamples = computed(() => {
  if (
      lonRangeMinModel.value === undefined ||
      lonRangeMaxModel.value === undefined ||
      stepModel.value === undefined
  ) {
    return undefined
  }
  return Math.floor((lonRangeMaxModel.value - lonRangeMinModel.value) / stepModel.value)
})

const verticalSamples = computed(() => {
  if (
      latRangeMinModel.value === undefined ||
      latRangeMaxModel.value === undefined ||
      stepModel.value === undefined
  ) {
    return undefined
  }
  return Math.floor((latRangeMaxModel.value - latRangeMinModel.value) / stepModel.value)
})

const totalSamples = computed(() => {
  if (
      horizontalSamples.value === undefined ||
      verticalSamples.value === undefined
  ) {
    return undefined
  }
  return horizontalSamples.value * verticalSamples.value
})

function convertMousePositionToLatLon(map: HTMLDivElement, event: MouseEvent): {lat: number, lon: number} {
  const mapBounds = map.getBoundingClientRect()
  const lat = Math.round((90 - (event.clientY - mapBounds.top) / mapBounds.height * 180) * 10) / 10
  const lon = Math.round(((event.clientX - mapBounds.left) / mapBounds.width * 360 - 180) * 10) / 10
  return {lat, lon}
}

onMounted(() => {
  const worldMapElement = worldMap.value
  let mouseDownPosition = {lat: 0, lon: 0}
  if (worldMapElement === null) {
    return
  }
  worldMapElement.addEventListener('mousedown', (event) => {
    mouseIsDown = true
    mouseDownPosition = convertMousePositionToLatLon(worldMapElement, event)
    latRangeMinModel.value = mouseDownPosition.lat
    latRangeMaxModel.value = mouseDownPosition.lat
    lonRangeMinModel.value = mouseDownPosition.lon
    lonRangeMaxModel.value = mouseDownPosition.lon
  })
  worldMapElement.addEventListener('mousemove', (event) => {
    if (!mouseIsDown) {
      return
    }
    const mouseMovePosition = convertMousePositionToLatLon(worldMapElement, event)
    latRangeMinModel.value = Math.min(mouseDownPosition.lat, mouseMovePosition.lat)
    latRangeMaxModel.value = Math.max(mouseDownPosition.lat, mouseMovePosition.lat)
    lonRangeMinModel.value = Math.min(mouseDownPosition.lon, mouseMovePosition.lon)
    lonRangeMaxModel.value = Math.max(mouseDownPosition.lon, mouseMovePosition.lon)
  })
  worldMapElement.addEventListener('mouseout', (event) => {
    mouseIsDown = false
  })
  worldMapElement.addEventListener('mouseup', (event) => {
    if (!mouseIsDown) {
      return
    }
    mouseIsDown = false
    const mouseUpPosition = convertMousePositionToLatLon(worldMapElement, event)

    // If the values are the same on release, just reset the entire range.
    if (
        mouseDownPosition.lat === mouseUpPosition.lat &&
        mouseDownPosition.lon === mouseUpPosition.lon
    ) {
      latRangeMinModel.value = -90
      latRangeMaxModel.value = 90
      lonRangeMinModel.value = -180
      lonRangeMaxModel.value = 180
      return
    }

    // Otherwise, set the range.
    latRangeMinModel.value = Math.min(mouseDownPosition.lat, mouseUpPosition.lat)
    latRangeMaxModel.value = Math.max(mouseDownPosition.lat, mouseUpPosition.lat)
    lonRangeMinModel.value = Math.min(mouseDownPosition.lon, mouseUpPosition.lon)
    lonRangeMaxModel.value = Math.max(mouseDownPosition.lon, mouseUpPosition.lon)
  })
})
</script>
