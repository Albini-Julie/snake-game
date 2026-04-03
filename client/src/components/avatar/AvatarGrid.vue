<template>
  <div class="grid grid-cols-3 sm:grid-cols-4 gap-4">
    <button
      v-for="avatar in avatars"
      :key="avatar.id"
      @click="$emit('select', avatar.id)"
      :class="
        selected === avatar.id
          ? 'border-game-accent ring-2 ring-game-accent ring-offset-2 ring-offset-game-bg'
          : 'border-game-border hover:border-game-accent'
      "
      class="bg-game-surface border rounded-xl p-4 flex flex-col items-center gap-3 transition-all duration-200"
    >
      <img
        :src="avatar.path"
        :alt="avatar.name"
        class="w-16 h-16 object-contain"
      />
      <span class="text-xs text-slate-300 text-center leading-tight">{{
        avatar.name
      }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  avatars: { type: Array, required: true },
  selected: { type: String, default: null },
});

defineEmits(["select"]);
</script>
