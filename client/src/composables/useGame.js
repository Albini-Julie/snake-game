import { ref, onUnmounted } from 'vue'
import { getDemoMove } from '@/api/ai'

const CELL   = 20
const SPEEDS = [200, 165, 130, 95, 65]
const DIRECTIONS = {
  ArrowUp:    { x: 0,  y: -1 },
  ArrowDown:  { x: 0,  y:  1 },
  ArrowLeft:  { x: -1, y:  0 },
  ArrowRight: { x: 1,  y:  0 },
}

const DIR_MAP = {
  UP:    { x: 0,  y: -1 },
  DOWN:  { x: 0,  y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x: 1,  y:  0 },
}

const DIR_NAME = {
  '0,-1': 'UP',
  '0,1':  'DOWN',
  '-1,0': 'LEFT',
  '1,0':  'RIGHT',
}

function createRng(seed) {
  let s = seed
  return function () {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const ACHIEVEMENT_CONDITIONS = [
  { slug: 'first_catch',  check: (s, l, t) => s >= 1   },
  { slug: 'fish_hunter',  check: (s, l, t) => s >= 5   },
  { slug: 'squid_level',  check: (s, l, t) => s >= 10  },
  { slug: 'octopus_king', check: (s, l, t) => s >= 20  },
  { slug: 'on_fire',      check: (s, l, t) => l >= 3   },
  { slug: 'speed_demon',  check: (s, l, t) => l >= 5   },
  { slug: 'survivor',     check: (s, l, t) => t >= 30  },
  { slug: 'veteran',      check: (s, l, t) => t >= 60  },
  { slug: 'legend',       check: (s, l, t) => t >= 120 },
]

export function useGame(canvasRef, avatarColor = 240) {
  const score             = ref(0)
  const bestScore         = ref(Number(localStorage.getItem('poulpentin_best') ?? 0))
  const state             = ref('idle')
  const level              = ref(1)
  const isDemo            = ref(false)
  const justUnlocked      = ref([])
  const worldRecordBeaten = ref(false)

  let snake      = []
  let fruit      = null
  let dir        = { x: 1, y: 0 }
  let nextDir    = { x: 1, y: 0 }
  let loop       = null
  let cols       = 0
  let rows       = 0
  let startTime  = 0
  let ctx        = null
  let stepCount  = 0
  let pendingDir = null

  let rng         = null
  let gameSeed    = 0
  let inputLog    = []
  let tickCounter = 0  // compte les ticks depuis le début de la partie

  let notifiedSlugs       = new Set()
  let currentWorldRecord  = 0
  let worldRecordNotified = false

  function checkLiveAchievements() {
    const elapsedSec = Math.round((Date.now() - startTime) / 1000)
    const newUnlocks = []

    for (const { slug, check } of ACHIEVEMENT_CONDITIONS) {
      if (!notifiedSlugs.has(slug) && check(score.value, level.value, elapsedSec)) {
        notifiedSlugs.add(slug)
        newUnlocks.push(slug)
      }
    }

    if (newUnlocks.length > 0) {
      justUnlocked.value = newUnlocks
      setTimeout(() => { justUnlocked.value = [] }, 100)
    }
  }

  function preloadUnlocked(slugs) {
    slugs.forEach(slug => notifiedSlugs.add(slug))
  }

  function setWorldRecord(record) {
    currentWorldRecord = record
  }

  // NOUVEAU : permet d'initialiser bestScore depuis la valeur serveur (compte utilisateur),
  // sans jamais écraser une valeur locale plus haute par erreur.
  function setBestScore(value) {
    const v = Number(value) || 0
    if (v > bestScore.value) {
      bestScore.value = v
      localStorage.setItem('poulpentin_best', bestScore.value)
    }
  }

  /**
   * Retourne la seed et les inputs de la partie pour sauvegarde
   * @returns {{ seed: number, inputs: Array<{ dir: string, tick: number }> }}
   */
  function getReplayData() {
    return { seed: gameSeed, inputs: inputLog }
  }

  function drawPoulpe(cx, cy, size, angle, color, isHead) {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)

    const r       = size * 0.38
    const tentLen = size * 0.45
    const tentR   = size * 0.09
    const nTent   = 4

    ctx.beginPath()
    ctx.arc(0, 0, r, Math.PI, 0)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = color
    ctx.fillRect(-r, 0, r * 2, tentR * 2)

    const totalWidth = nTent * tentR * 2
    const startX     = -totalWidth / 2 + tentR
    for (let i = 0; i < nTent; i++) {
      const tx = startX + i * tentR * 2
      ctx.beginPath()
      ctx.arc(tx, tentR * 2, tentR, Math.PI, 0)
      ctx.arc(tx, tentR * 2 + tentLen, tentR, 0, Math.PI)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'
      ctx.lineWidth = 0.8
      ctx.stroke()
    }

    if (isHead) {
      const eyeOffset = r * 0.38
      const eyeR      = r * 0.18
      const pupilR    = eyeR * 0.55
      ;[-1, 1].forEach(side => {
        ctx.beginPath()
        ctx.arc(side * eyeOffset, -r * 0.3, eyeR, 0, Math.PI * 2)
        ctx.fillStyle = 'white'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(side * eyeOffset + side * pupilR * 0.3, -r * 0.3, pupilR, 0, Math.PI * 2)
        ctx.fillStyle = '#1e1b4b'
        ctx.fill()
      })
    }

    ctx.restore()
  }

  function drawFruit(fx, fy) {
    const cx = fx * CELL + CELL / 2
    const cy = fy * CELL + CELL / 2

    ctx.save()
    ctx.translate(cx, cy)

    ctx.beginPath()
    ctx.moveTo(-CELL * 0.28, 0)
    ctx.lineTo(-CELL * 0.48, -CELL * 0.22)
    ctx.lineTo(-CELL * 0.48,  CELL * 0.22)
    ctx.closePath()
    ctx.fillStyle = '#38bdf8'
    ctx.fill()
    ctx.strokeStyle = '#0284c7'
    ctx.lineWidth = 0.8
    ctx.stroke()

    ctx.beginPath()
    ctx.ellipse(CELL * 0.05, 0, CELL * 0.32, CELL * 0.18, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#38bdf8'
    ctx.fill()
    ctx.strokeStyle = '#0284c7'
    ctx.lineWidth = 0.8
    ctx.stroke()

    ctx.beginPath()
    ctx.ellipse(CELL * 0.05, CELL * 0.05, CELL * 0.2, CELL * 0.1, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#bae6fd'
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(-CELL * 0.05, -CELL * 0.18)
    ctx.lineTo( CELL * 0.05, -CELL * 0.32)
    ctx.lineTo( CELL * 0.2,  -CELL * 0.18)
    ctx.closePath()
    ctx.fillStyle = '#0ea5e9'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(CELL * 0.22, -CELL * 0.04, CELL * 0.07, 0, Math.PI * 2)
    ctx.fillStyle = 'white'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(CELL * 0.24, -CELL * 0.04, CELL * 0.04, 0, Math.PI * 2)
    ctx.fillStyle = '#1e1b4b'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(CELL * 0.26, -CELL * 0.06, CELL * 0.015, 0, Math.PI * 2)
    ctx.fillStyle = 'white'
    ctx.fill()

    ctx.beginPath()
    ctx.arc(CELL * 0.34, CELL * 0.04, CELL * 0.05, 0, Math.PI)
    ctx.strokeStyle = '#0284c7'
    ctx.lineWidth = 0.8
    ctx.stroke()

    ctx.strokeStyle = '#0ea5e9'
    ctx.lineWidth = 0.6
    ctx.beginPath()
    ctx.arc(CELL * 0.05, 0, CELL * 0.12, -Math.PI * 0.6, Math.PI * 0.6)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(-CELL * 0.08, 0, CELL * 0.12, -Math.PI * 0.6, Math.PI * 0.6)
    ctx.stroke()

    ctx.restore()
    }

  function draw() {
    const canvas = canvasRef.value
    if (!canvas) return
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth   = 0.5
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke()
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke()
    }

    if (fruit) drawFruit(fruit.x, fruit.y)
    if (snake.length === 0) return

    if (isDemo.value) {
      ctx.fillStyle = '#6366f1'
      ctx.fillRect(8, 8, 32, 18)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('IA', 14, 21)
    }

    const hue = typeof avatarColor === 'object' ? avatarColor.value : avatarColor
    snake.forEach((seg, i) => {
      const isHead = i === snake.length - 1
      const cx     = seg.x * CELL + CELL / 2
      const cy     = seg.y * CELL + CELL / 2

      let angle = 0
      if (i < snake.length - 1) {
        const next = snake[i + 1]
        angle = Math.atan2(next.y - seg.y, next.x - seg.x) - Math.PI / 2
      } else {
        angle = Math.atan2(dir.y, dir.x) - Math.PI / 2
      }

      const lightness = isHead ? 65 : 40 + (i / snake.length) * 15
      const color = hue === null
        ? `hsl(0, 0%, ${isHead ? 95 : 75 + (i / snake.length) * 10}%)`
        : `hsl(${hue}, 80%, ${lightness}%)`

      drawPoulpe(cx, cy, CELL, angle, color, isHead)
    })
  }

  async function askAI() {
    const currentDirName = DIR_NAME[`${dir.x},${dir.y}`] ?? 'RIGHT'
    try {
      const { data } = await getDemoMove({
        head:      snake[snake.length - 1],
        fruit,
        snake:     snake.slice(-15),
        cols,
        rows,
        direction: currentDirName
      })
      const newDir = DIR_MAP[data.direction]
      if (newDir) pendingDir = newDir
    } catch {
      // En cas d'erreur, on garde la direction actuelle
    }
  }

  function placeFruit() {
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`))
    let fx, fy
    do {
      fx = Math.floor(rng() * cols)
      fy = Math.floor(rng() * rows)
    } while (occupied.has(`${fx},${fy}`))
    fruit = { x: fx, y: fy }
  }

  function tick() {
    tickCounter++ // incrémente le compteur de ticks

    if (isDemo.value) {
      if (pendingDir) {
        if (!(pendingDir.x === -dir.x && pendingDir.y === -dir.y)) {
          nextDir = pendingDir
        }
        pendingDir = null
      }
      stepCount++
      if (stepCount >= 5) {
        stepCount = 0
        askAI()
      }
    }

    dir = { ...nextDir }
    const head    = snake[snake.length - 1]
    const newHead = { x: head.x + dir.x, y: head.y + dir.y }

    if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
      return die()
    }
    if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      return die()
    }

    snake.push(newHead)

    if (fruit && newHead.x === fruit.x && newHead.y === fruit.y) {
      score.value++
      if (score.value > bestScore.value) {
        bestScore.value = score.value
        localStorage.setItem('poulpentin_best', bestScore.value)
      }
      level.value = Math.min(5, 1 + Math.floor(score.value / 5))
      placeFruit()
      restartLoop()

      if (!isDemo.value) {
        checkLiveAchievements()
        if (!worldRecordNotified && score.value > currentWorldRecord) {
          worldRecordNotified     = true
          currentWorldRecord      = score.value
          worldRecordBeaten.value = true
          setTimeout(() => { worldRecordBeaten.value = false }, 100)
        }
      }
    } else {
      snake.shift()
    }

    draw()
  }

  let deathParticles = []

  function createDeathParticles() {
    deathParticles = snake.map(seg => ({
      x:     seg.x * CELL + CELL / 2,
      y:     seg.y * CELL + CELL / 2,
      vx:    (Math.random() - 0.5) * 6,
      vy:    (Math.random() - 0.5) * 6,
      alpha: 1,
      size:  CELL * 0.4,
      color: `hsl(${typeof avatarColor === 'object' ? avatarColor.value : avatarColor}, 80%, 60%)`
    }))
  }

  function animateDeath() {
    const canvas = canvasRef.value
    if (!canvas) return

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = `rgba(239, 68, 68, ${Math.max(0, deathParticles[0]?.alpha - 0.3) * 0.3})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    let allGone = true

    deathParticles.forEach(p => {
      if (p.alpha <= 0) return
      allGone = false

      p.x     += p.vx
      p.y     += p.vy
      p.vy    += 0.2
      p.alpha -= 0.03
      p.size  *= 0.97

      ctx.save()
      ctx.globalAlpha = Math.max(0, p.alpha)
      ctx.translate(p.x, p.y)
      ctx.beginPath()
      ctx.arc(0, 0, p.size, Math.PI, 0)
      ctx.fillStyle = p.color
      ctx.fill()
      for (let i = 0; i < 4; i++) {
        const tx = -p.size + i * (p.size * 0.6) + p.size * 0.3
        ctx.beginPath()
        ctx.ellipse(tx, p.size * 0.5, p.size * 0.15, p.size * 0.4, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    })

    if (allGone) {
      state.value = 'dead'
      return
    }

    requestAnimationFrame(animateDeath)
  }

  function die() {
    stopLoop()
    state.value = 'dying'
    if (!isDemo.value) checkLiveAchievements()
    createDeathParticles()
    requestAnimationFrame(animateDeath)
  }

  function stopLoop()    { if (loop) { clearInterval(loop); loop = null } }
  function restartLoop() { stopLoop(); loop = setInterval(tick, SPEEDS[level.value - 1]) }

  function init(canvas) {
    ctx  = canvas.getContext('2d')
    cols = Math.floor(canvas.width  / CELL)
    rows = Math.floor(canvas.height / CELL)
  }

  function start(demo = false) {
    score.value             = 0
    level.value             = 1
    isDemo.value            = demo
    dir                     = { x: 1, y: 0 }
    nextDir                 = { x: 1, y: 0 }
    pendingDir              = null
    stepCount               = 0
    justUnlocked.value      = []
    worldRecordBeaten.value = false
    worldRecordNotified     = false
    tickCounter             = 0

    gameSeed = Math.floor(Math.random() * 2147483647)
    rng      = createRng(gameSeed)
    inputLog = []

    const midX = Math.floor(cols / 2)
    const midY = Math.floor(rows / 2)
    snake = [
      { x: midX - 2, y: midY },
      { x: midX - 1, y: midY },
      { x: midX,     y: midY },
    ]
    startTime = Date.now()
    placeFruit()

    if (demo) askAI()

    state.value = 'playing'
    restartLoop()
    draw()
  }

  function handleKey(e) {
    if (isDemo.value) return
    const newDir = DIRECTIONS[e.key]
    if (!newDir) return
    e.preventDefault()
    if (newDir.x === -dir.x && newDir.y === -dir.y) return
    nextDir = newDir

    // Enregistre l'input avec le numéro de tick courant (déterministe)
    const dirName = DIR_NAME[`${newDir.x},${newDir.y}`]
    if (dirName) {
      inputLog.push({ dir: dirName, tick: tickCounter })
    }
  }

  function getDuration() {
    return Date.now() - startTime
  }

  onUnmounted(stopLoop)

  return {
    score, bestScore, state, level, isDemo, justUnlocked, worldRecordBeaten,
    init, start, handleKey, getDuration, preloadUnlocked, getReplayData,
    setWorldRecord, setBestScore
  }
}