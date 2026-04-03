<template>
  <div>
    <label v-if="label" class="block text-sm text-slate-400 mb-1">{{
      label
    }}</label>
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :minlength="minlength"
      :maxlength="maxlength"
      :autocomplete="autocomplete"
      @input="$emit('update:modelValue', $event.target.value)"
      class="w-full px-4 py-3 rounded-lg bg-game-bg border border-game-border text-white placeholder-slate-500 focus:outline-none focus:border-game-accent transition-colors"
    />
  </div>
</template>

<script setup>
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
</script>
