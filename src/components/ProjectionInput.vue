<template>
  <div>
    <label for="projection">Proj4:</label>
  </div>
  <div>
    <textarea
        id="projection"
        class="block w-full h-32 px-2 border-2 border-white font-mono bg-red-500 focus:ring focus:ring-blue-500"
        autocapitalize="off"
        autocomplete="off"
        v-model="projectionModel"
    ></textarea>
    <p :class="{invisible: valid}">Invalid projection.</p>
  </div>
</template>

<script setup lang="ts">
import {ref, watch, computed} from "vue";
import {isValidProjection} from "../isValidProjection";

const props = defineProps({
  projection: String,
})
const emit = defineEmits(['update:projection'])

const valid = ref(true)

const projectionModel = computed({
  get() {
    return props.projection
  },
  set(projection) {
    emit('update:projection', projection)
  }
})

watch(() => props.projection, (projection: string|undefined) => {
  if (projection === undefined) {
    return
  }
  if (projection === '') {
    valid.value = true
    return
  }
  valid.value = isValidProjection(projection)
})
</script>
