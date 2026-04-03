<template>
  <div class="grid grid-cols-3 gap-3 mb-6">
    <div
      v-for="(entry, i) in entries"
      :key="entry.id"
      :class="[
        'bg-game-surface border rounded-xl p-6 flex flex-col items-center gap-3 text-center',
        i === 0
          ? 'border-yellow-400/60'
          : i === 1
            ? 'border-slate-400/60'
            : 'border-amber-600/60',
      ]"
    >
      <span class="text-2xl">{{ MEDALS[i] }}</span>
      <img
        v-if="entry.users?.avatars?.path"
        :src="entry.users.avatars.path"
        :alt="entry.users?.username"
        class="w-12 h-12 object-contain"
        @error="(e) => (e.target.style.display = 'none')"
      />
      <div>
        <p class="font-semibold text-white text-sm truncate max-w-[100px]">
          {{ entry.users?.username ?? "Anonyme" }}
        </p>
        <p
          class="font-game text-lg mt-1"
          :class="i === 0 ? 'text-yellow-400' : 'text-white'"
        >
          {{ entry.value }}
        </p>
        <p class="text-slate-500 text-xs mt-1">
          {{ formatDuration(entry.duration) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const MEDALS = ["🥇", "🥈", "🥉"];

defineProps({
  entries: { type: Array, required: true },
});

function formatDuration(seconds) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m${s.toString().padStart(2, "0")}s` : `${s}s`;
}
</script>
