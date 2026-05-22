<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'btn-pixel',
      variant === 'primary' ? 'btn-pixel-primary' : 'btn-pixel-secondary',
      disabled ? 'btn-pixel-disabled' : '',
    ]"
    @click="handleClick"
    ref="btnRef"
  >
    <span class="btn-pixel-content">
      <slot />
    </span>

    <!-- Particules carrées pixel art -->
    <span
      v-for="p in particles"
      :key="p.id"
      class="pixel-particle"
      :style="{
        left: p.x + 'px',
        top: p.y + 'px',
        width: p.size + 'px',
        height: p.size + 'px',
        background: p.color,
        '--tx': p.tx + 'px',
        '--ty': p.ty + 'px',
        '--dur': p.dur + 'ms',
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
    size: Math.random() > 0.5 ? 6 : 4, // tailles fixes style pixel
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
/* ── Base pixel ── */
.btn-pixel {
  position: relative;
  overflow: visible;
  padding: 0.6rem 1.4rem;
  font-family: "Press Start 2P", monospace;
  font-size: 0.6rem;
  font-weight: 400;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  border: none;
  image-rendering: pixelated;

  /* Effet 3D pixel art via box-shadow décalé */
  transition:
    transform 0.08s ease,
    box-shadow 0.08s ease;
}

/* Hover : remonte + ombre grandit */
.btn-pixel:not(.btn-pixel-disabled):hover {
  transform: translateY(-2px);
}

/* Clic : s'enfonce + ombre disparaît */
.btn-pixel:not(.btn-pixel-disabled):active {
  transform: translateY(3px);
}

.btn-pixel-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── PRIMARY ── */
.btn-pixel-primary {
  background: #4f46e5;
  color: white;
  /* Ombre 3D pixel : droite + bas en indigo foncé, puis noir */
  box-shadow:
    3px 0px 0px #3730a3,
    0px 3px 0px #3730a3,
    3px 3px 0px #3730a3,
    6px 0px 0px #1e1b4b,
    0px 6px 0px #1e1b4b,
    6px 6px 0px #1e1b4b;
}

.btn-pixel-primary:not(.btn-pixel-disabled):hover {
  box-shadow:
    3px 0px 0px #3730a3,
    0px 3px 0px #3730a3,
    3px 3px 0px #3730a3,
    7px 0px 0px #1e1b4b,
    0px 7px 0px #1e1b4b,
    7px 7px 0px #1e1b4b;
}

.btn-pixel-primary:not(.btn-pixel-disabled):active {
  box-shadow:
    1px 0px 0px #3730a3,
    0px 1px 0px #3730a3,
    1px 1px 0px #3730a3;
}

/* ── SECONDARY ── */
.btn-pixel-secondary {
  background: #1e293b;
  color: #94a3b8;
  box-shadow:
    3px 0px 0px #0f172a,
    0px 3px 0px #0f172a,
    3px 3px 0px #0f172a,
    6px 0px 0px #000000,
    0px 6px 0px #000000,
    6px 6px 0px #000000;
}

.btn-pixel-secondary:not(.btn-pixel-disabled):hover {
  color: white;
  box-shadow:
    3px 0px 0px #0f172a,
    0px 3px 0px #0f172a,
    3px 3px 0px #0f172a,
    7px 0px 0px #000000,
    0px 7px 0px #000000,
    7px 7px 0px #000000;
}

.btn-pixel-secondary:not(.btn-pixel-disabled):active {
  color: white;
  box-shadow:
    1px 0px 0px #0f172a,
    0px 1px 0px #0f172a,
    1px 1px 0px #0f172a;
}

/* ── Contenu ── */
.btn-pixel-content {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* ── Particules carrées pixel art ── */
.pixel-particle {
  position: absolute;
  border-radius: 0; /* carré net */
  pointer-events: none;
  z-index: 20;
  animation: pixel-burst var(--dur, 500ms) steps(8) forwards;
}

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
