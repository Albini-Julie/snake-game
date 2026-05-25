import { ref, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

const CELL = 20
const COLS = 20
const ROWS = 20

// Couleurs fixes : joueur 0 = bleu, joueur 1 = rouge
const PLAYER_COLORS = [
  { body: 'hsl(210, 80%, 55%)', head: 'hsl(210, 80%, 70%)' },
  { body: 'hsl(0, 80%, 55%)',   head: 'hsl(0, 80%, 70%)' },
]

export function useMultiplayer(canvasRef) {
  const state        = ref('idle')      // idle | waiting | countdown | playing | finished | abandoned
  const roomId       = ref('')
  const countdown    = ref(3)
  const players      = ref([])          // [{ id, username, score, alive, playerIndex }]
  const myIndex      = ref(null)        // 0 ou 1
  const winner       = ref(null)
  const errorMsg     = ref('')
  const fruit        = ref(null)
  const snakes       = ref([[], []])

  let socket = null
  let ctx    = null

  // Canvas 
    function init(canvas) {
        if (!canvas) return
        ctx = canvas.getContext('2d')
    }

  function draw(gameState) {
    if (!ctx || !canvasRef.value) return
    if (!ctx) return
    const W = COLS * CELL
    const H = ROWS * CELL

    // Fond
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, W, H)

    // Grille
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth   = 0.5
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke()
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke()
    }

    // Fruit
    if (gameState.fruit) drawFruit(gameState.fruit)

    // Snakes
    gameState.players.forEach((player, i) => {
      if (!player.snake || player.snake.length === 0) return
      const colors = PLAYER_COLORS[i]
      player.snake.forEach((seg, j) => {
        const isHead = j === player.snake.length - 1
        ctx.fillStyle = isHead ? colors.head : colors.body
        if (!player.alive) ctx.globalAlpha = 0.3
        ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2)
        ctx.globalAlpha = 1
        if (isHead) {
          // Yeux
          ctx.fillStyle = 'white'
          ctx.fillRect(seg.x * CELL + 4, seg.y * CELL + 4, 4, 4)
          ctx.fillRect(seg.x * CELL + 12, seg.y * CELL + 4, 4, 4)
          ctx.fillStyle = '#1e1b4b'
          ctx.fillRect(seg.x * CELL + 5, seg.y * CELL + 5, 2, 2)
          ctx.fillRect(seg.x * CELL + 13, seg.y * CELL + 5, 2, 2)
        }
      })
    })
  }

  function drawFruit(f) {
    const cx = f.x * CELL + CELL / 2
    const cy = f.y * CELL + CELL / 2

    ctx.save()
    ctx.translate(cx, cy)

    // Queue
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

    // Corps
    ctx.beginPath()
    ctx.ellipse(CELL * 0.05, 0, CELL * 0.32, CELL * 0.18, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#38bdf8'
    ctx.fill()
    ctx.strokeStyle = '#0284c7'
    ctx.lineWidth = 0.8
    ctx.stroke()

    // Ventre
    ctx.beginPath()
    ctx.ellipse(CELL * 0.05, CELL * 0.05, CELL * 0.2, CELL * 0.1, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#bae6fd'
    ctx.fill()

    // Nageoire
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

    // Écailles
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

  function drawCountdown(n) {
    if (!ctx) return
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)
    ctx.fillStyle   = '#6366f1'
    ctx.font        = 'bold 60px "Press Start 2P", monospace'
    ctx.textAlign   = 'center'
    ctx.fillText(n, COLS * CELL / 2, ROWS * CELL / 2 + 20)
  }

  // Connexion Socket
  function connect() {
    socket = io('http://localhost:3000')

    socket.on('matchmaking:waiting', () => {
      state.value = 'waiting'
    })

    socket.on('matchmaking:found', ({ roomId: rid, players: ps }) => {
      roomId.value = rid
      players.value = ps
      myIndex.value = ps.find(p => p.id === socket.id)?.playerIndex ?? 0
      state.value   = 'countdown'
    })

    socket.on('game:start', () => {
      state.value    = 'playing'
      countdown.value = 0
    })

    socket.on('game:state', (gameState) => {
      snakes.value = gameState.players.map(p => p.snake)
      fruit.value  = gameState.fruit
      // Met à jour les scores
      gameState.players.forEach((p, i) => {
        if (players.value[i]) players.value[i].score = p.score
      })
      draw(gameState)
    })

    socket.on('game:over', ({ winner: winnerId, players: finalPlayers }) => {
      state.value   = 'finished'
      winner.value  = finalPlayers.find(p => p.id === winnerId) ?? null
      players.value = finalPlayers
    })

    socket.on('game:abandoned', ({ by }) => {
      state.value  = 'abandoned'
      errorMsg.value = `${by} a quitté la partie`
    })

    socket.on('room:created', ({ roomId: rid }) => {
      roomId.value = rid
      state.value  = 'waiting'
    })

    socket.on('room:error', ({ message }) => {
      errorMsg.value = message
    })

    // Countdown avant le début
    socket.on('matchmaking:found', () => {
      let c = 3
      countdown.value = c
      const interval = setInterval(() => {
        c--
        countdown.value = c
        drawCountdown(c)
        if (c <= 0) clearInterval(interval)
      }, 1000)
    })
  }

  // Actions publiques
  function joinMatchmaking(username) {
    if (!socket) connect()
    state.value    = 'idle'
    errorMsg.value = ''
    socket.emit('matchmaking:join', { username })
  }

  function createRoom(username) {
    if (!socket) connect()
    errorMsg.value = ''
    socket.emit('room:create', { username })
  }

  function joinRoom(username, code) {
    if (!socket) connect()
    errorMsg.value = ''
    socket.emit('room:join', { username, roomId: code })
  }

  function sendDirection(direction) {
    if (socket && state.value === 'playing') {
      socket.emit('player:direction', { direction })
    }
  }

  function handleKey(e) {
    const map = {
      ArrowUp:    'UP',
      ArrowDown:  'DOWN',
      ArrowLeft:  'LEFT',
      ArrowRight: 'RIGHT',
    }
    const dir = map[e.key]
    if (!dir) return
    e.preventDefault()
    sendDirection(dir)
  }

  function disconnect() {
    if (socket) { socket.disconnect(); socket = null }
    state.value    = 'idle'
    errorMsg.value = ''
    roomId.value   = ''
    players.value  = []
    myIndex.value  = null
    winner.value   = null
  }

  onUnmounted(disconnect)

  return {
    state, roomId, countdown, players, myIndex, winner, errorMsg,
    init, handleKey, joinMatchmaking, createRoom, joinRoom, disconnect,
    PLAYER_COLORS,
  }
}