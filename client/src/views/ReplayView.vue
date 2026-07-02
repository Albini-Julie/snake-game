<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8"
  >
    <div class="text-center">
      <p class="font-game text-slate-600 mb-2 text-pixel-sm">— POULPENTIN —</p>
      <h1
        class="font-game text-game-accent text-pixel-xl text-shadow-accent-glow"
      >
        WORLD RECORD
      </h1>
    </div>

    <div v-if="loading" class="text-center py-10">
      <p class="font-game text-game-accent blink text-pixel-sm">
        LOADING REPLAY...
      </p>
    </div>

    <div v-else-if="!replayData" class="text-center py-10">
      <p class="font-game text-slate-500 text-pixel-sm mb-6">
        NO REPLAY AVAILABLE YET
      </p>
      <p class="font-game text-slate-600 text-pixel-sm mb-6">
        BEAT THE WORLD RECORD TO SAVE THE FIRST REPLAY !
      </p>
      <AppButton @click="router.push('/leaderboard')">LEADERBOARD</AppButton>
    </div>

    <template v-else>
      <div
        class="shadow-pixel-card bg-game-surface/60 px-6 py-3 flex items-center gap-6"
      >
        <div class="flex flex-col items-center">
          <p class="font-game text-slate-500 text-pixel-sm">PLAYER</p>
          <p class="font-game text-white text-pixel-md">
            {{ replayData.users?.username }}
          </p>
        </div>
        <div class="w-px bg-game-border h-8" />
        <div class="flex flex-col items-center">
          <p class="font-game text-slate-500 text-pixel-sm">SCORE</p>
          <p class="font-game text-game-accent text-pixel-md">
            {{ replayData.value }}
          </p>
        </div>
        <div class="w-px bg-game-border h-8" />
        <div class="flex flex-col items-center">
          <p class="font-game text-slate-500 text-pixel-sm">STATUS</p>
          <p
            class="font-game text-pixel-md"
            :class="isPlaying ? 'text-green-400 blink' : 'text-slate-500'"
          >
            {{ isPlaying ? "PLAYING" : isDone ? "DONE" : "READY" }}
          </p>
        </div>
      </div>

      <div
        class="relative border-2 border-game-accent overflow-hidden"
        :style="{ width: CANVAS_SIZE + 'px', height: CANVAS_SIZE + 'px' }"
      >
        <canvas
          ref="canvasRef"
          :width="CANVAS_SIZE"
          :height="CANVAS_SIZE"
          class="block"
        />

        <div
          v-if="!isPlaying"
          class="absolute inset-0 bg-game-bg/80 flex flex-col items-center justify-center gap-4"
        >
          <p v-if="isDone" class="font-game text-game-accent text-pixel-sm">
            FINAL SCORE : {{ replayData.value }}
          </p>
          <AppButton @click="startReplay">
            {{ isDone ? "REPLAY" : "WATCH RECORD" }}
          </AppButton>
          <AppButton variant="secondary" @click="router.push('/leaderboard')">
            LEADERBOARD
          </AppButton>
        </div>
      </div>

      <div v-if="isPlaying" class="font-game text-game-accent text-pixel-sm">
        SCORE : {{ replayScore }}
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { getWorldRecordReplay } from "@/api/scores";
import AppButton from "@/components/ui/AppButton.vue";

const CANVAS_SIZE = window.innerWidth < 640 ? 320 : 400;
const CELL = 20;
const COLS = Math.floor(CANVAS_SIZE / CELL);
const ROWS = Math.floor(CANVAS_SIZE / CELL);
const SPEEDS = [200, 165, 130, 95, 65];

const router = useRouter();
const canvasRef = ref(null);
const loading = ref(true);
const replayData = ref(null);
const isPlaying = ref(false);
const isDone = ref(false);
const replayScore = ref(0);

let ctx = null;
let inputTimers = [];

function createRng(seed) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawGrid() {
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, CANVAS_SIZE);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(CANVAS_SIZE, y * CELL);
    ctx.stroke();
  }
}

function drawPoulpe(cx, cy, size, angle, color, isHead) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  const r = size * 0.38;
  const tentLen = size * 0.45;
  const tentR = size * 0.09;
  const nTent = 4;

  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI, 0);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.fillRect(-r, 0, r * 2, tentR * 2);

  const totalWidth = nTent * tentR * 2;
  const startX = -totalWidth / 2 + tentR;
  for (let i = 0; i < nTent; i++) {
    const tx = startX + i * tentR * 2;
    ctx.beginPath();
    ctx.arc(tx, tentR * 2, tentR, Math.PI, 0);
    ctx.arc(tx, tentR * 2 + tentLen, tentR, 0, Math.PI);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  if (isHead) {
    const eyeOffset = r * 0.38;
    const eyeR = r * 0.18;
    const pupilR = eyeR * 0.55;
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.arc(side * eyeOffset, -r * 0.3, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(
        side * eyeOffset + side * pupilR * 0.3,
        -r * 0.3,
        pupilR,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = "#1e1b4b";
      ctx.fill();
    });
  }

  ctx.restore();
}

function drawFruit(f) {
  const cx = f.x * CELL + CELL / 2;
  const cy = f.y * CELL + CELL / 2;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath();
  ctx.moveTo(-CELL * 0.28, 0);
  ctx.lineTo(-CELL * 0.48, -CELL * 0.22);
  ctx.lineTo(-CELL * 0.48, CELL * 0.22);
  ctx.closePath();
  ctx.fillStyle = "#38bdf8";
  ctx.fill();
  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(CELL * 0.05, 0, CELL * 0.32, CELL * 0.18, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#38bdf8";
  ctx.fill();
  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(
    CELL * 0.05,
    CELL * 0.05,
    CELL * 0.2,
    CELL * 0.1,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fillStyle = "#bae6fd";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-CELL * 0.05, -CELL * 0.18);
  ctx.lineTo(CELL * 0.05, -CELL * 0.32);
  ctx.lineTo(CELL * 0.2, -CELL * 0.18);
  ctx.closePath();
  ctx.fillStyle = "#0ea5e9";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(CELL * 0.22, -CELL * 0.04, CELL * 0.07, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(CELL * 0.24, -CELL * 0.04, CELL * 0.04, 0, Math.PI * 2);
  ctx.fillStyle = "#1e1b4b";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(CELL * 0.26, -CELL * 0.06, CELL * 0.015, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(CELL * 0.34, CELL * 0.04, CELL * 0.05, 0, Math.PI);
  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.strokeStyle = "#0ea5e9";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.arc(CELL * 0.05, 0, CELL * 0.12, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-CELL * 0.08, 0, CELL * 0.12, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.stroke();

  ctx.restore();
}

function drawSnake(snake, dir) {
  snake.forEach((seg, i) => {
    const isHead = i === snake.length - 1;
    const cx = seg.x * CELL + CELL / 2;
    const cy = seg.y * CELL + CELL / 2;
    const lightness = isHead ? 65 : 40 + (i / snake.length) * 15;

    let angle = 0;
    if (i < snake.length - 1) {
      const next = snake[i + 1];
      angle = Math.atan2(next.y - seg.y, next.x - seg.x) - Math.PI / 2;
    } else {
      angle = Math.atan2(dir.y, dir.x) - Math.PI / 2;
    }

    drawPoulpe(cx, cy, CELL, angle, `hsl(270, 80%, ${lightness}%)`, isHead);
  });
}

function placeFruit(snake, rng) {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
  let fx, fy;
  do {
    fx = Math.floor(rng() * COLS);
    fy = Math.floor(rng() * ROWS);
  } while (occupied.has(`${fx},${fy}`));
  return { x: fx, y: fy };
}

const DIR_VECS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

function stopReplay() {
  inputTimers.forEach((t) => clearInterval(t));
  inputTimers = [];
}

function createDeathParticles(snake) {
  return snake.map((seg) => ({
    x: seg.x * CELL + CELL / 2,
    y: seg.y * CELL + CELL / 2,
    vx: (Math.random() - 0.5) * 6,
    vy: (Math.random() - 0.5) * 6,
    alpha: 1,
    size: CELL * 0.4,
    color: "hsl(270, 80%, 60%)",
  }));
}

function dieReplay(snake, fruit, dir) {
  const particles = createDeathParticles(snake);

  function animateDeath() {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = `rgba(239, 68, 68, ${Math.max(0, particles[0]?.alpha - 0.3) * 0.3})`;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    let allGone = true;
    particles.forEach((p) => {
      if (p.alpha <= 0) return;
      allGone = false;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.alpha -= 0.03;
      p.size *= 0.97;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      ctx.arc(0, 0, p.size, Math.PI, 0);
      ctx.fillStyle = p.color;
      ctx.fill();
      for (let i = 0; i < 4; i++) {
        const tx = -p.size + i * (p.size * 0.6) + p.size * 0.3;
        ctx.beginPath();
        ctx.ellipse(
          tx,
          p.size * 0.5,
          p.size * 0.15,
          p.size * 0.4,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.restore();
    });

    if (allGone) {
      isPlaying.value = false;
      isDone.value = true;
      drawGrid();
      return;
    }
    requestAnimationFrame(animateDeath);
  }

  requestAnimationFrame(animateDeath);
}

function startReplay() {
  if (!replayData.value) return;
  stopReplay();

  isPlaying.value = true;
  isDone.value = false;
  replayScore.value = 0;

  const rng = createRng(replayData.value.seed);
  const midX = Math.floor(COLS / 2);
  const midY = Math.floor(ROWS / 2);

  let snake = [
    { x: midX - 2, y: midY },
    { x: midX - 1, y: midY },
    { x: midX, y: midY },
  ];
  let dir = { ...DIR_VECS.RIGHT };
  let nextDir = { ...DIR_VECS.RIGHT };
  let fruit = placeFruit(snake, rng);
  let level = 1;
  let loop = null;
  let tickCounter = 0;

  const inputs = replayData.value.inputs ?? [];

  function tick() {
    tickCounter++;

    // Met à jour dir en premier
    dir = { ...nextDir };

    // Applique les inputs du tick courant (par numéro de tick, déterministe)
    inputs
      .filter((input) => input.tick === tickCounter)
      .forEach(({ dir: dirName }) => {
        const newDir = DIR_VECS[dirName];
        if (newDir && !(newDir.x === -dir.x && newDir.y === -dir.y)) {
          nextDir = { ...newDir };
        }
      });

    const head = snake[snake.length - 1];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };

    if (
      newHead.x < 0 ||
      newHead.x >= COLS ||
      newHead.y < 0 ||
      newHead.y >= ROWS ||
      snake.some((s) => s.x === newHead.x && s.y === newHead.y)
    ) {
      clearInterval(loop);
      dieReplay(snake, fruit, dir);
      return;
    }

    snake.push(newHead);

    if (newHead.x === fruit.x && newHead.y === fruit.y) {
      replayScore.value++;
      level = Math.min(5, 1 + Math.floor(replayScore.value / 5));
      fruit = placeFruit(snake, rng);
      clearInterval(loop);
      loop = setInterval(tick, SPEEDS[level - 1]);
      inputTimers.push(loop);
    } else {
      snake.shift();
    }

    drawGrid();
    drawFruit(fruit);
    drawSnake(snake, dir);
  }

  loop = setInterval(tick, SPEEDS[0]);
  inputTimers.push(loop);
}

onMounted(async () => {
  try {
    const { data } = await getWorldRecordReplay();
    replayData.value = data;
  } catch {
    replayData.value = null;
  } finally {
    loading.value = false;
  }

  await nextTick();
  ctx = canvasRef.value?.getContext("2d");
  if (ctx) drawGrid();
});

onUnmounted(stopReplay);
</script>

<style scoped>
.blink {
  animation: blink 1s steps(1) infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
