<template>
  <div>
    <label v-if="isRemote" for="projection">Proj:</label>
    <label v-else for="projection">Proj4:</label>
  </div>
  <div>
    <textarea
        id="projection"
        class="block w-full h-32 px-2 border-2 border-white font-mono bg-red-500 focus:ring focus:ring-blue-500"
        autocapitalize="off"
        autocomplete="off"
        v-model="projectionModel"
    ></textarea>
    <p :class="{invisible: valid}">
      <span v-if="validMessage === null">Invalid projection.</span>
      <span v-else>Error: {{ validMessage }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import {ref, watch, computed} from "vue";
import {isValidProjection} from "../isValidProjection";
import {debounce} from "../debounce";

const props = defineProps<{
  projection: string,
  remoteUrl: string|null,
}>()
const emit = defineEmits(['update:projection'])

const valid = ref(true)
const validMessage = ref(null as string|null)

const projectionModel = computed({
  get() {
    return props.projection
  },
  set(projection) {
    emit('update:projection', projection)
  }
})

const isRemote = computed(() => {
  return props.remoteUrl !== null
})

const debouncedValidation = debounce(async (projection: string, remoteUrl: string|null) => {
  const validationResult = await isValidProjection(projection, remoteUrl)
  valid.value = validationResult.valid
  validMessage.value = validationResult.message
}, 100)

watch(
  () => [props.projection, props.remoteUrl],
  async ([projection, remoteUrl]) => {
    if (projection === null || projection === '') {
      valid.value = true
      return
    }
    await debouncedValidation(projection, remoteUrl)
  }
)
</script>
