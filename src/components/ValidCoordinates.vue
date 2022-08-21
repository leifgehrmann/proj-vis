<template>
  <div
    ref="container"
    class="border-2 p-2 border-white w-full bg-black min-h-[8rem] max-h-96 cursor-crosshair"
  ></div>
  <div class="text-center">&nbsp;</div>
</template>

<script setup lang="ts">
import {ref, watch} from "vue";
import {createValidCoordinatesCanvas} from "../validCoordinatesCanvas";

const props = defineProps<{
  step: number,
  lonValues: number[],
  latValues: number[],
  colorValues: Uint8ClampedArray[]
}>()

const container = ref<HTMLDivElement | null>(null)

watch(
  () => [props.step, props.lonValues, props.latValues, props.colorValues],
  async ([step, lonValues, latValues, colorValues]) => {
    const containerElement = container.value
    if (containerElement === null) {
      return
    }

    if ((lonValues as number[]).length === 0) {
      containerElement.textContent = ''
      return
    }

    // Type definitions need to be declared because for some reason `watch` does not care about array order.
    const canvas = createValidCoordinatesCanvas(
        step as number,
        lonValues as number[],
        latValues as number[],
        colorValues as Uint8ClampedArray[]
    )

    canvas.style.imageRendering = 'pixelated'
    canvas.style.objectFit = 'contain'
    canvas.classList.add('w-full')
    canvas.classList.add('h-full')

    containerElement.replaceChildren(canvas)
  })
</script>
