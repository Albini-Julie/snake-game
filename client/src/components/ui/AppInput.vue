<template>
  <div class="flex flex-col gap-1.5">
    <label
      v-if="label"
      class="font-game text-slate-400 uppercase tracking-widest"
      style="font-size: 0.55rem"
    >
      {{ label }}
    </label>
    <div
      class="bg-game-bg shadow-pixel-input transition-shadow duration-150"
      :class="focused ? 'shadow-pixel-input-focus' : 'shadow-pixel-input'"
    >
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :minlength="minlength"
        :maxlength="maxlength"
        :autocomplete="autocomplete"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="focused = true"
        @blur="focused = false"
        class="w-full px-3 py-2.5 bg-transparent text-slate-200 font-game outline-none placeholder-slate-700 caret-game-accent"
        style="font-size: 0.6rem"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  modelValue: { type: String, default: "" },
  label: { type: String, default: "" },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: "" },
  required: { type: Boolean, default: false },
  minlength: { type: Number, default: undefined },
  maxlength: { type: Number, default: undefined },
  autocomplete: { type: String, default: "off" },
});

defineEmits(["update:modelValue"]);

const focused = ref(false);
</script>
