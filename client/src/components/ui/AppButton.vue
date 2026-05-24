<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'relative overflow-visible font-game text-xs uppercase tracking-wider cursor-pointer border-none transition-all duration-75',
      'px-6 py-3',
      variant === 'primary'
        ? 'bg-game-accent text-white shadow-pixel-primary hover:shadow-pixel-primary active:translate-y-1 active:shadow-none'
        : 'bg-game-surface text-slate-400 hover:text-white shadow-pixel-secondary active:translate-y-1 active:shadow-none',
      disabled ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-0.5',
    ]"
    @click="handleClick"
    ref="btnRef"
  >
    <span class="relative z-10 inline-flex items-center gap-2">
      <slot />
    </span>

    <!-- Particules carrées pixel art -->
    <span
      v-for="p in particles"
      :key="p.id"
      class="absolute pointer-events-none z-20"
      :style="{
        left: p.x + 'px',
        top: p.y + 'px',
        width: p.size + 'px',
        height: p.size + 'px',
        background: p.color,
        '--tx': p.tx + 'px',
        '--ty': p.ty + 'px',
        '--dur': p.dur + 'ms',
        animation: `pixel-burst var(--dur) steps(8) forwards`,
      }"
    />
  </button>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  variant: {
    type: String,
    default: "primary",
    validator: (v) => ["primary", "secondary"].includes(v),
  },
  type: { type: String, default: "button" },
  disabled: { type: Boolean, default: false },
});

const btnRef = ref(null);
const particles = ref([]);
let particleId = 0;

const COLORS_PRIMARY = ["#a5b4fc", "#818cf8", "#ffffff", "#c7d2fe", "#4338ca"];
const COLORS_SECONDARY = ["#94a3b8", "#ffffff", "#cbd5e1", "#475569"];

function handleClick(e) {
  if (props.disabled) return;

  const rect = btnRef.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const colors =
    props.variant === "primary" ? COLORS_PRIMARY : COLORS_SECONDARY;

  const newParticles = Array.from({ length: 12 }, () => ({
    id: particleId++,
    x: x - 3,
    y: y - 3,
    size: Math.random() > 0.5 ? 6 : 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    tx: (Math.random() - 0.5) * 90,
    ty: (Math.random() - 0.5) * 90 - 20,
    dur: Math.random() * 200 + 400,
  }));

  particles.value.push(...newParticles);
  setTimeout(() => {
    particles.value = particles.value.filter(
      (p) => !newParticles.find((np) => np.id === p.id),
    );
  }, 700);
}
</script>

<style scoped>
@keyframes pixel-burst {
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  60% {
    opacity: 0.8;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) scale(0);
    opacity: 0;
  }
}
</style>
