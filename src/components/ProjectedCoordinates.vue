<template>
  <div
    class="border-2 border-white relative min-h-[8rem] max-h-96 cursor-crosshair bg-black overflow-hidden"
  >
    <div
      ref="container"
      class="p-2 w-full h-full"
    ></div>
    <div
      ref="marker"
      v-if="markerOffset !== null"
      class="absolute bg-red-500 pointer-events-none"
      style="width: 5px; height: 5px"
      :style="{
        left: `calc(${(markerOffset.x ?? 0) * 100}% - 2.5px)`,
        top: `calc(${(markerOffset.y ?? 0) * 100}% - 2.5px)`
      }"
    ></div>
  </div>
  <div class="text-center">
    <span
      v-if="props.markerCoordinate !== null"
      class="font-mono"
    >
      {{Math.round((props.markerCoordinate.x ?? 0) * 1000) / 1000}},
      {{Math.round((props.markerCoordinate.y ?? 0) * 1000) / 1000}}
    </span>
    <span v-else>
      &nbsp;
    </span>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {createProjectedCoordinatesCanvasAndTransformers} from "../projectedCoordinatesCanvas";
import {Coordinate} from "../coord";

const props = defineProps<{
  xValues: number[],
  yValues: number[],
  colorValues: Uint8ClampedArray[],
  markerCoordinate: Coordinate|null
}>()

const emit = defineEmits(['update:markerCoordinate'])

const container = ref<HTMLDivElement | null>(null)
const canvasToCoord = ref<((c: Coordinate) => Coordinate)|null>(null)
const coordToCanvas = ref<((c: Coordinate) => Coordinate)|null>(null)
const clientToCanvas = ref<((c: Coordinate) => Coordinate)|null>(null)
const canvasToClient = ref<((c: Coordinate) => Coordinate)|null>(null)
const clientToOffset = ref<((c: Coordinate) => Coordinate)|null>(null)
const markerOffset = ref<Coordinate|null>(null)

const markerCoordinateModel = computed({
  get() { return props.markerCoordinate },
  set(markerCoordinate) { emit('update:markerCoordinate', markerCoordinate) }
})

function getObjectFitContainSize (canvas: HTMLCanvasElement) {
  const ratio = canvas.width / canvas.height
  const bounds = canvas.getBoundingClientRect()
  let width = bounds.height*ratio
  let height = bounds.height
  if (width > bounds.width) {
    width = bounds.width
    height = bounds.width/ratio
  }
  return {width, height}
}

function updateMarkerTransformations() {
  const containerElement = container.value
  if (containerElement === null) {
    return
  }

  if (props.xValues.length === 0) {
    containerElement.textContent = ''
    return
  }

  // Type definitions need to be declared because for some reason `watch` does not care about array order.
  const {canvas, toCanvas, toCoords} = createProjectedCoordinatesCanvasAndTransformers(
      props.xValues,
      props.yValues,
      props.colorValues
  )

  canvas.style.objectFit = 'contain'
  canvas.classList.add('w-full')
  canvas.classList.add('h-full')

  containerElement.replaceChildren(canvas)

  canvasToCoord.value = toCoords
  coordToCanvas.value = toCanvas
  clientToCanvas.value = (coordinate: Coordinate): Coordinate => {
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    const canvasBounds = canvas.getBoundingClientRect()
    const objectFitBounds = getObjectFitContainSize(canvas)

    const leftMargin = (canvasBounds.width - objectFitBounds.width) / 2
    const topMargin = (canvasBounds.height - objectFitBounds.height) / 2

    return {
      x: ((coordinate.x - canvasBounds.left - leftMargin) / objectFitBounds.width) * canvasWidth,
      y: ((coordinate.y - canvasBounds.top - topMargin) / objectFitBounds.height) * canvasHeight
    }
  }
  canvasToClient.value = (coordinate: Coordinate): Coordinate => {
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    const canvasBounds = canvas.getBoundingClientRect()
    const objectFitBounds = getObjectFitContainSize(canvas)

    const leftMargin = (canvasBounds.width - objectFitBounds.width) / 2
    const topMargin = (canvasBounds.height - objectFitBounds.height) / 2

    return {
      x: ((coordinate.x / canvasWidth) * objectFitBounds.width) + canvasBounds.left + leftMargin,
      y: ((coordinate.y / canvasHeight) * objectFitBounds.height) + canvasBounds.top + topMargin
    }
  }
  clientToOffset.value = (coordinate: Coordinate): Coordinate => {
    const containerBounds = containerElement.getBoundingClientRect()
    return {
      x: (coordinate.x - containerBounds.left) / containerBounds.width,
      y: (coordinate.y - containerBounds.top) / containerBounds.height
    }
  }
}

function updateMarkerOffset() {
  const coordinate = props.markerCoordinate
  if (
      coordinate === null ||
      coordToCanvas.value === null ||
      canvasToClient.value === null ||
      clientToOffset.value === null
  ) {
    markerOffset.value = null
    return
  }
  markerOffset.value = clientToOffset.value(canvasToClient.value(coordToCanvas.value(coordinate)))
}

watch(
  () => [props.xValues, props.yValues, props.colorValues],
  () => {
    updateMarkerTransformations()
    markerCoordinateModel.value = null
  }
)

watch(
    () => [props.markerCoordinate],
    () => {
      updateMarkerOffset()
    }
)

onMounted(() => {
  const containerElement = container.value
  if (containerElement === null) {
    return
  }
  containerElement.addEventListener('click', (event) => {
    const canvasElements = containerElement.getElementsByTagName('canvas')

    if (canvasElements.length !== 1) {
      return
    }

    const canvasElement = canvasElements.item(0)
    if (canvasElement === null) {
      return
    }

    if (
        clientToOffset.value === null ||
        clientToCanvas.value === null ||
        canvasToCoord.value === null
    ) {
      return
    }

    markerCoordinateModel.value = canvasToCoord.value(clientToCanvas.value({x: event.clientX, y: event.clientY}))
  })

  // If the size of the container changes, we want to make sure the marker
  // inside of the container adjusts to the correct position.
  const resizeObserver = new ResizeObserver(() => {
    updateMarkerTransformations()
    updateMarkerOffset()
  })
  resizeObserver.observe(containerElement);
})
</script>
