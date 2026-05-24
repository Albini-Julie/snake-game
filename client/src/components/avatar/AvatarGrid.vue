<template>
  <div class="grid grid-cols-3 sm:grid-cols-4 gap-4">
    <button
      v-for="avatar in avatars"
      :key="avatar.id"
      @click="$emit('select', avatar.id)"
      :class="[
        'bg-game-surface p-4 flex flex-col items-center gap-3 transition-all duration-100',
        selected === avatar.id
          ? 'shadow-pixel-primary outline outline-2 outline-game-accent'
          : 'shadow-pixel-secondary hover:outline hover:outline-1 hover:outline-game-accent',
      ]"
    >
      <img
        :src="avatar.path"
        :alt="avatar.name"
        class="w-16 h-16 object-contain"
      />
      <span
        class="font-game text-slate-300 text-center leading-tight text-pixel-sm"
      >
        {{ avatar.name }}
      </span>
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
