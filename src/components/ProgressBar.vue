<template>
  <div
    class="w-full border-2 border-white h-6 bg-white"
  >
    <div
      class="bg-blue-500 h-full text-white"
      :style="{ width: `${progress * 100}%` }"
    >
      <div
        class="w-full h-full text-right px-2 whitespace-nowrap overflow-hidden"
        v-if="progress < 1"
      >
        {{ Math.floor(progress * 100) }}%
      </div>
      <div
        class="w-full text-center"
        v-if="progress === 1"
      >
        {{ totalProjectedSamples.toLocaleString() }} samples projected
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  progress: number,
  totalProjectedSamples: number,
}>()
</script>
