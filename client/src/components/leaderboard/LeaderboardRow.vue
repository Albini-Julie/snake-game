<template>
  <div
    :class="[
      'flex items-center gap-4 px-4 py-3 border-b border-game-border/40 transition-all',
      highlighted
        ? 'bg-game-accent/10 border-l-2 border-l-game-accent'
        : 'hover:bg-game-surface/50',
      rank === 1 ? 'blink-row' : '',
    ]"
  >
    <!-- Rang -->
    <span
      class="font-game w-8 text-center shrink-0 text-pixel-sm"
      :class="rankColor"
    >
      {{ rank === 1 ? "►" : "" }}{{ String(rank).padStart(2, "0") }}
    </span>

    <!-- Avatar -->
    <img
      v-if="avatarPath"
      :src="avatarPath"
      :alt="username"
      class="w-7 h-7 object-contain shrink-0"
      @error="(e) => (e.target.style.display = 'none')"
    />
    <div v-else class="w-7 h-7 shrink-0 bg-game-border" />

    <!-- Pseudo -->
    <span
      class="flex-1 font-game truncate text-pixel-sm"
      :class="highlighted ? 'text-game-accent' : 'text-slate-300'"
    >
      {{ username ?? "AAA" }}
    </span>

    <!-- Score -->
    <p
      class="font-game text-lg w-12 text-right"
      :class="highlighted ? 'text-game-accent' : rankScoreColor"
    >
      {{ score }}
    </p>

    <!-- Durée -->
    <span
      class="font-game text-slate-600 w-12 text-right shrink-0 text-pixel-sm"
    >
      {{ formatDuration(duration) }}
    </span>
  </div>
</template>

<script setup>
const props = defineProps({
  rank: { type: Number, required: true },
  username: { type: String, default: "AAA" },
  avatarPath: { type: String, default: null },
  score: { type: Number, required: true },
  duration: { type: Number, default: 0 },
  highlighted: { type: Boolean, default: false },
});

const rankColor =
  {
    1: "text-yellow-400",
    2: "text-slate-300",
    3: "text-amber-600",
  }[props.rank] ?? "text-slate-500";

const rankScoreColor =
  {
    1: "text-yellow-400",
    2: "text-slate-300",
    3: "text-amber-600",
  }[props.rank] ?? "text-white";

function formatDuration(seconds) {
  if (!seconds) return "--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m${s.toString().padStart(2, "0")}` : `${s}s`;
}
</script>

<style scoped>
.blink-row {
  animation: row-blink 1.5s steps(1) infinite;
}

@keyframes row-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
