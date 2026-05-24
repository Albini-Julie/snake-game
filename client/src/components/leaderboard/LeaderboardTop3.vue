<template>
  <div class="grid grid-cols-3 divide-x divide-game-border/40">
    <div
      v-for="(entry, i) in entries"
      :key="entry.id"
      :class="[
        'flex flex-col items-center gap-2 py-5 px-3 border-b border-game-border/40',
        i === 0
          ? 'bg-yellow-400/5'
          : i === 1
            ? 'bg-slate-400/5'
            : 'bg-amber-700/5',
      ]"
    >
      <!-- Médaille -->
      <span class="text-pixel-xl">{{ MEDALS[i] }}</span>

      <!-- Avatar -->
      <div class="relative">
        <img
          v-if="entry.users?.avatars?.path"
          :src="entry.users.avatars.path"
          :alt="entry.users?.username"
          class="w-10 h-10 object-contain"
          @error="(e) => (e.target.style.display = 'none')"
        />
        <div v-else class="w-10 h-10 bg-game-border" />
        <span v-if="i === 0" class="absolute -top-3 left-1/2 -translate-x-1/2"
          >👑</span
        >
      </div>

      <!-- Pseudo -->
      <p
        class="font-game text-center truncate w-full px-1 text-pixel-sm"
        :class="i === 0 ? 'text-yellow-400' : 'text-slate-300'"
      >
        {{ entry.users?.username ?? "AAA" }}
      </p>

      <!-- Score -->
      <p
        class="font-game text-2xl"
        :class="
          i === 0
            ? 'text-yellow-400'
            : i === 1
              ? 'text-slate-300'
              : 'text-amber-600'
        "
      >
        {{ entry.value }}
      </p>

      <!-- Durée -->
      <p class="font-game text-slate-600 text-pixel-sm">
        {{ formatDuration(entry.duration) }}
      </p>
    </div>
  </div>
</template>

<script setup>
const MEDALS = ["🥇", "🥈", "🥉"];

defineProps({
  entries: { type: Array, required: true },
});

function formatDuration(seconds) {
  if (!seconds) return "--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m${s.toString().padStart(2, "0")}` : `${s}s`;
}
</script>
