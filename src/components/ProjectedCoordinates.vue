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
  <div class="text-center">&nbsp;</div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {createProjectedCoordinatesCanvasAndTransformers} from "../projectedCoordinatesCanvas";
import {Coordinate} from "../coord";
import {getBbox} from "../bbox";

const props = defineProps<{
  xValues: number[],
  yValues: number[],
  colorValues: Uint8ClampedArray[],
  markerCoordinate: Coordinate|undefined
}>()

const emit = defineEmits(['update:markerCoordinate'])

const container = ref<HTMLDivElement | null>(null)

const bbox = computed(() => {
  return getBbox(props.xValues, props.yValues)
})

const markerCoordinateModel = computed({
  get() { return props.markerCoordinate },
  set(markerCoordinate) { emit('update:markerCoordinate', markerCoordinate) }
})

function convertMousePositionToCanvasPosition(
    container: HTMLDivElement,
    canvas: HTMLCanvasElement,
    event: MouseEvent
): Coordinate {
  const containerBounds = container.getBoundingClientRect()
  return {
    x: (event.clientX - containerBounds.left) / containerBounds.width,
    y: (event.clientY - containerBounds.top) / containerBounds.height
  }
}

function convertMousePositionToCoordinatePosition(
    container: HTMLDivElement,
    canvas: HTMLCanvasElement,
    event: MouseEvent
): Coordinate {
  const padding = 1
  const topLeftCoordinate = {
    x: bbox.value.
    y:
  }
  const canvasBounds = canvas.getBoundingClientRect()
  return {
    x: (event.clientX - canvasBounds.left) / canvasBounds.width,
    y: (event.clientY - canvasBounds.top) / canvasBounds.height
  }
}

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
  const {canvas} = createProjectedCoordinatesCanvasAndTransformers(
      xValues as number[],
      yValues as number[],
      colorValues as Uint8ClampedArray[]
  )

  canvas.style.objectFit = 'contain'
  canvas.classList.add('w-full')
  canvas.classList.add('h-full')

  containerElement.replaceChildren(canvas)
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
    markerCoordinateModel.value = convertMousePositionToCanvasPosition(
        containerElement,
        canvasElement,
        event
    )
  })
})
</script>
