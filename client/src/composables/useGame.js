import { ref, onUnmounted } from 'vue'

// ── Constantes ────────────────────────────────────────────────────────────────
const CELL       = 20       // taille d'une cellule en px
const SPEEDS     = [150, 120, 90, 65, 45] // ms par tick selon niveau
const DIRECTIONS = {
  ArrowUp:    { x: 0,  y: -1 },
  ArrowDown:  { x: 0,  y:  1 },
  ArrowLeft:  { x: -1, y:  0 },
  ArrowRight: { x: 1,  y:  0 },
}

export function useGame(canvasRef, avatarColor = 240) {
  // ── État réactif ─────────────────────────────────────────────────────────────
  const score     = ref(0)
  const bestScore = ref(Number(localStorage.getItem('poulpentin_best') ?? 0))
  const state     = ref('idle')   // idle | playing | dead
  const level     = ref(1)        // 1-5

  // ── État interne (non réactif, perf) ─────────────────────────────────────────
  let snake    = []        // tableau de {x, y}
  let fruit    = null      // {x, y}
  let dir      = { x: 1, y: 0 }
  let nextDir  = { x: 1, y: 0 }
  let loop     = null
  let cols     = 0
  let rows     = 0
  let startTime = 0
  let ctx      = null

  // ── Dessin du poulpe ──────────────────────────────────────────────────────────
  // Transposition de cree_forme_poulpy() depuis Python/Turtle vers Canvas 2D
  function drawPoulpe(cx, cy, size, angle, color, isHead) {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)

    const r         = size * 0.38   // rayon du corps
    const tentLen   = size * 0.45   // longueur d'une tentacule
    const tentR     = size * 0.09   // rayon de courbure tentacule
    const nTent     = 4             // nb tentacules de chaque côté

    // Corps (demi-cercle vers le haut)
    ctx.beginPath()
    ctx.arc(0, 0, r, Math.PI, 0)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Rectangle sous le corps pour relier aux tentacules
    ctx.fillStyle = color
    ctx.fillRect(-r, 0, r * 2, tentR * 2)

    // Tentacules
    const totalWidth = nTent * tentR * 2
    const startX     = -totalWidth / 2 + tentR
    for (let i = 0; i < nTent; i++) {
      const tx = startX + i * tentR * 2
      ctx.beginPath()
      // Arc du haut (courbure vers l'extérieur)
      ctx.arc(tx, tentR * 2, tentR, Math.PI, 0)
      ctx.arc(tx, tentR * 2 + tentLen, tentR, 0, Math.PI)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'
      ctx.lineWidth = 0.8
      ctx.stroke()
    }

    // Yeux (seulement sur la tête)
    if (isHead) {
      const eyeOffset = r * 0.38
      const eyeR      = r * 0.18
      const pupilR    = eyeR * 0.55

      ;[-1, 1].forEach(side => {
        // Blanc de l'oeil
        ctx.beginPath()
        ctx.arc(side * eyeOffset, -r * 0.3, eyeR, 0, Math.PI * 2)
        ctx.fillStyle = 'white'
        ctx.fill()
        // Pupille
        ctx.beginPath()
        ctx.arc(side * eyeOffset + side * pupilR * 0.3, -r * 0.3, pupilR, 0, Math.PI * 2)
        ctx.fillStyle = '#1e1b4b'
        ctx.fill()
      })
    }

    ctx.restore()
  }

  // ── Dessin du fruit (étoile de mer) ──────────────────────────────────────────
  function drawFruit(fx, fy) {
  const cx = fx * CELL + CELL / 2
  const cy = fy * CELL + CELL / 2

  ctx.save()
  ctx.translate(cx, cy)

  // Queue (triangle)
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

  // Corps (ellipse)
  ctx.beginPath()
  ctx.ellipse(CELL * 0.05, 0, CELL * 0.32, CELL * 0.18, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#38bdf8'
  ctx.fill()
  ctx.strokeStyle = '#0284c7'
  ctx.lineWidth = 0.8
  ctx.stroke()

  // Ventre (ellipse plus claire)
  ctx.beginPath()
  ctx.ellipse(CELL * 0.05, CELL * 0.05, CELL * 0.2, CELL * 0.1, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#bae6fd'
  ctx.fill()

  // Nageoire dorsale
  ctx.beginPath()
  ctx.moveTo(-CELL * 0.05, -CELL * 0.18)
  ctx.lineTo( CELL * 0.05, -CELL * 0.32)
  ctx.lineTo( CELL * 0.2,  -CELL * 0.18)
  ctx.closePath()
  ctx.fillStyle = '#0ea5e9'
  ctx.fill()

  // Oeil
  ctx.beginPath()
  ctx.arc(CELL * 0.22, -CELL * 0.04, CELL * 0.07, 0, Math.PI * 2)
  ctx.fillStyle = 'white'
  ctx.fill()
  ctx.beginPath()
  ctx.arc(CELL * 0.24, -CELL * 0.04, CELL * 0.04, 0, Math.PI * 2)
  ctx.fillStyle = '#1e1b4b'
  ctx.fill()
  // Reflet
  ctx.beginPath()
  ctx.arc(CELL * 0.26, -CELL * 0.06, CELL * 0.015, 0, Math.PI * 2)
  ctx.fillStyle = 'white'
  ctx.fill()

  // Bouche
  ctx.beginPath()
  ctx.arc(CELL * 0.34, CELL * 0.04, CELL * 0.05, 0, Math.PI)
  ctx.strokeStyle = '#0284c7'
  ctx.lineWidth = 0.8
  ctx.stroke()

  // Écailles (2 arcs)
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

  // ── Rendu complet du canvas ───────────────────────────────────────────────────
  function draw() {
    const canvas = canvasRef.value
    if (!canvas) return
    const W = canvas.width
    const H = canvas.height

    // Fond
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, W, H)

    // Grille légère
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth   = 0.5
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke()
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke()
    }

    // Fruit
    if (fruit) drawFruit(fruit.x, fruit.y)

    // Corps du poulpentin
    if (snake.length === 0) return

    const hue = typeof avatarColor === 'object' ? avatarColor.value : avatarColor
    snake.forEach((seg, i) => {
      const isHead  = i === snake.length - 1
      const cx      = seg.x * CELL + CELL / 2
      const cy      = seg.y * CELL + CELL / 2
      const size    = CELL

      // Calcul de l'angle selon la direction du segment
      let angle = 0
      if (i < snake.length - 1) {
        const next = snake[i + 1]
        const dx   = next.x - seg.x
        const dy   = next.y - seg.y
        angle = Math.atan2(dy, dx) - Math.PI / 2
      } else {
        angle = Math.atan2(dir.y, dir.x) - Math.PI / 2
      }

      // Couleur dégradée du corps (tête plus vive)
      const lightness = isHead ? 65 : 40 + (i / snake.length) * 15
      const color = `hsl(${hue}, 80%, ${lightness}%)`
      drawPoulpe(cx, cy, size, angle, color, isHead)
    })
  }

  // ── Logique de jeu ────────────────────────────────────────────────────────────
  function placeFruit() {
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`))
    let fx, fy
    do {
      fx = Math.floor(Math.random() * cols)
      fy = Math.floor(Math.random() * rows)
    } while (occupied.has(`${fx},${fy}`))
    fruit = { x: fx, y: fy }
  }

  function tick() {
    dir = { ...nextDir }
    const head    = snake[snake.length - 1]
    const newHead = { x: head.x + dir.x, y: head.y + dir.y }

    // Collision mur
    if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
      return die()
    }
    // Collision corps
    if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      return die()
    }

    snake.push(newHead)

    // Mange le fruit
    if (fruit && newHead.x === fruit.x && newHead.y === fruit.y) {
      score.value++
      if (score.value > bestScore.value) {
        bestScore.value = score.value
        localStorage.setItem('poulpentin_best', bestScore.value)
      }
      // Monte de niveau tous les 5 fruits
      level.value = Math.min(5, 1 + Math.floor(score.value / 5))
      placeFruit()
      restartLoop()  // relance le loop avec la nouvelle vitesse
    } else {
      snake.shift()  // enlève la queue seulement si pas de fruit mangé
    }

    draw()
  }

  function die() {
    stopLoop()
    state.value = 'dead'
    // Animation de clignotement
    let blinks = 0
    const blink = setInterval(() => {
      snake.forEach((_, i) => {
        // Alterne opacité via globalAlpha sur le draw
      })
      draw()
      if (++blinks >= 6) {
        clearInterval(blink)
        drawDeathScreen()
      }
    }, 120)
  }

  function drawDeathScreen() {
    const canvas = canvasRef.value
    if (!canvas) return
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle   = '#ef4444'
    ctx.font        = 'bold 20px "Press Start 2P", monospace'
    ctx.textAlign   = 'center'
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 16)
    ctx.fillStyle = 'white'
    ctx.font      = '12px "Press Start 2P", monospace'
    ctx.fillText(`Score : ${score.value}`, canvas.width / 2, canvas.height / 2 + 16)
  }

  function stopLoop()    { if (loop) { clearInterval(loop); loop = null } }
  function restartLoop() { stopLoop(); loop = setInterval(tick, SPEEDS[level.value - 1]) }

  // ── API publique ──────────────────────────────────────────────────────────────
  function init(canvas) {
    ctx  = canvas.getContext('2d')
    cols = Math.floor(canvas.width  / CELL)
    rows = Math.floor(canvas.height / CELL)
  }

  function start() {
    score.value = 0
    level.value = 1
    dir         = { x: 1, y: 0 }
    nextDir     = { x: 1, y: 0 }
    // Serpent initial de 3 segments au centre
    const midX  = Math.floor(cols / 2)
    const midY  = Math.floor(rows / 2)
    snake       = [
      { x: midX - 2, y: midY },
      { x: midX - 1, y: midY },
      { x: midX,     y: midY },
    ]
    startTime   = Date.now()
    placeFruit()
    state.value = 'playing'
    restartLoop()
    draw()
  }

  function handleKey(e) {
    const newDir = DIRECTIONS[e.key]
    if (!newDir) return
    e.preventDefault()
    // Interdit le demi-tour
    if (newDir.x === -dir.x && newDir.y === -dir.y) return
    nextDir = newDir
  }

  function getDuration() {
    return Date.now() - startTime
  }

  onUnmounted(stopLoop)

  return {
    score, bestScore, state, level,
    init, start, handleKey, getDuration
  }
}