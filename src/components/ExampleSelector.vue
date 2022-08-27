<template>
  <div><label for="example">Example:</label></div>
  <div>
    <select
      id="example"
      aria-labelledby="#example"
      class="block w-full pl-2 border-2 border-white bg-red-500 focus:ring focus:ring-blue-500 rounded-none"
      v-model="selectedExampleModel"
    >
      <option value="-1">Select an example…</option>
      <optgroup
        v-for="(projectionExampleGroup, groupId) in projectionExampleOptions"
        :key="groupId"
        :label="projectionExampleGroup.label"
      >
        <option
          v-for="(projectionExampleId) in projectionExampleGroup.options"
          :key="projectionExampleId"
          :value="projectionExampleId"
        >{{projectionExamples[projectionExampleId].label}}</option>
      </optgroup>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getProjectionExampleOptions, getProjectionExamples } from '../exampleProjections';

const props = defineProps({
  selectedExample: { type: String, required: true },
});
const emit = defineEmits(['update:selectedExample']);

const selectedExampleModel = computed({
  get() {
    return props.selectedExample;
  },
  set(selectedExample) {
    emit('update:selectedExample', selectedExample);
  },
});

const projectionExamples = getProjectionExamples();
const projectionExampleOptions = getProjectionExampleOptions();
</script>
