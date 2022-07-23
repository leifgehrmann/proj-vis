<template>
  <textarea
      id="projection"
      class="block w-full h-32 px-2 border-2 border-white font-mono bg-red-500 focus:ring focus:ring-blue-500"
      autocapitalize="off"
      autocomplete="off"
      v-model="projectionModel"
  ></textarea>
  <p :class="{invisible: valid}">Invalid projection.</p>
</template>

<script setup lang="ts">

import {ref, watch, computed} from "vue";
import proj4 from "proj4";

const props = defineProps({
  projection: String,
})
const emit = defineEmits(['update:projection'])

const valid = ref(false)

const projectionModel = computed({
  get() {
    return props.projection
  },
  set(projection) {
    emit('update:projection', projection)
  }
})

watch(() => props.projection, (projection: string|undefined) => {
  if (projection == undefined) {
    return
  }
  try {
    const transformer = proj4(projection)
    transformer.forward([0, 0])
    valid.value = true
  } catch (e) {
    valid.value = false
  }
})

</script>

<style scoped>

</style>
