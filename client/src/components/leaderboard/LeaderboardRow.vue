<template>
  <div
    class="bg-game-surface border rounded-xl flex items-center gap-4 py-3 px-5"
    :class="highlighted ? 'border-game-accent/40' : 'border-game-border'"
  >
    <span
      class="font-game text-sm w-6"
      :class="highlighted ? 'text-game-accent' : 'text-slate-500'"
    >
      {{ rank }}
    </span>
    <img
      v-if="avatarPath"
      :src="avatarPath"
      :alt="username"
      class="w-8 h-8 object-contain"
      @error="(e) => (e.target.style.display = 'none')"
    />
    <span class="flex-1 text-white text-sm truncate">{{
      username ?? "Anonyme"
    }}</span>
    <span
      class="font-game text-sm"
      :class="highlighted ? 'text-game-accent' : 'text-white'"
    >
      {{ score }}
    </span>
    <span class="text-slate-500 text-xs w-16 text-right">{{
      formatDuration(duration)
    }}</span>
  </div>
</template>

<script setup>
defineProps({
  rank: { type: Number, required: true },
  username: { type: String, default: "Anonyme" },
  avatarPath: { type: String, default: null },
  score: { type: Number, required: true },
  duration: { type: Number, default: 0 },
  highlighted: { type: Boolean, default: false },
});

function formatDuration(seconds) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m${s.toString().padStart(2, "0")}s` : `${s}s`;
}
</script>
