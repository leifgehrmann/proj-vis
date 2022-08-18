<template>
  <div
    class="border-2 border-white relative min-h-[8rem] max-h-96 cursor-crosshair bg-black"
  >
    <div
      ref="container"
      id="projectedCoordinatesContainer"
      class="p-2 w-full h-full"
    ></div>
    <div
      ref="marker"
      v-if="markerCoordinateModel !== undefined"
      class="absolute bg-red-500 pointer-events-none"
      style="width: 5px; height: 5px"
      :style="{
        left: `calc(${(markerCoordinateModel.x ?? 0) * 100}% - 2.5px)`,
        top: `calc(${(markerCoordinateModel.y ?? 0) * 100}% - 2.5px)`
      }"
    ></div>
  </div>
  <div class="text-center">{{debug}}</div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {createProjectedCoordinatesCanvasAndTransformers} from "../projectedCoordinatesCanvas";
import {Coordinate} from "../coord";

const props = defineProps<{
  xValues: number[],
  yValues: number[],
  colorValues: Uint8ClampedArray[],
  markerCoordinate: Coordinate|undefined
}>()

const emit = defineEmits(['update:markerCoordinate'])

const container = ref<HTMLDivElement | null>(null)
const canvasToCoord = ref<((c: Coordinate) => Coordinate)|null>(null)
const coordToCanvas = ref<((c: Coordinate) => Coordinate)|null>(null)
const clientToCanvas = ref<((c: Coordinate) => Coordinate)|null>(null)
const canvasToClient = ref<((c: Coordinate) => Coordinate)|null>(null)
const clientToOffset = ref<((c: Coordinate) => Coordinate)|null>(null)
const debug = ref<string>('')

const markerCoordinateModel = computed({
  get() { return props.markerCoordinate },
  set(markerCoordinate) { emit('update:markerCoordinate', markerCoordinate) }
})

watch(() => [props.xValues, props.yValues, props.colorValues], async ([xValues, yValues, colorValues]) => {
  const containerElement = container.value
  if (containerElement === null) {
    return
  }

  if (xValues.length === 0) {
    containerElement.textContent = ''
    return
  }

  // Type definitions need to be declared because for some reason `watch` does not care about array order.
  const {canvas, toCanvas, toCoords} = createProjectedCoordinatesCanvasAndTransformers(
      xValues as number[],
      yValues as number[],
      colorValues as Uint8ClampedArray[]
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
    const containerBounds = canvas.getBoundingClientRect()
    return {
      x: ((coordinate.x - containerBounds.left) / containerBounds.width) * canvasWidth,
      y: ((coordinate.y - containerBounds.top) / containerBounds.height) * canvasHeight
    }
  }
  canvasToClient.value = (coordinate: Coordinate): Coordinate => {
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    const containerBounds = canvas.getBoundingClientRect()
    return {
      x: ((coordinate.x / canvasWidth) * containerBounds.width) + containerBounds.left,
      y: ((coordinate.y / canvasHeight) * containerBounds.height) + containerBounds.top
    }
  }
  clientToOffset.value = (coordinate: Coordinate): Coordinate => {
    const containerBounds = containerElement.getBoundingClientRect()
    return {
      x: (coordinate.x - containerBounds.left) / containerBounds.width,
      y: (coordinate.y - containerBounds.top) / containerBounds.height
    }
  }
})

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
    markerCoordinateModel.value = clientToOffset.value(
        {x: event.clientX, y: event.clientY}
    )
    debug.value = JSON.stringify(canvasToCoord.value(clientToCanvas.value({x: event.clientX, y: event.clientY})))
  })
})
</script>
