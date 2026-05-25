import { checkMultiplayerAchievements } from './routes/achievements.js'

// Constantes
const CELL  = 20
const COLS  = 20
const ROWS  = 20
const SPEED = 150

const DIRS = {
  UP:    { x: 0,  y: -1 },
  DOWN:  { x: 0,  y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x: 1,  y:  0 },
}

const rooms = new Map()
let waitingPlayer = null

// Utilitaires
function randomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function placeFruit(snake1, snake2) {
  const occupied = new Set([
    ...snake1.map(s => `${s.x},${s.y}`),
    ...snake2.map(s => `${s.x},${s.y}`),
  ])
  let fx, fy
  do {
    fx = Math.floor(Math.random() * COLS)
    fy = Math.floor(Math.random() * ROWS)
  } while (occupied.has(`${fx},${fy}`))
  return { x: fx, y: fy }
}

function createSnake(startX, startY, dir) {
  return [
    { x: startX - 2 * DIRS[dir].x, y: startY - 2 * DIRS[dir].y },
    { x: startX - 1 * DIRS[dir].x, y: startY - 1 * DIRS[dir].y },
    { x: startX,                    y: startY },
  ]
}

function createRoom(p1, p2) {
  const snake1 = createSnake(4,  10, 'RIGHT')
  const snake2 = createSnake(15, 10, 'LEFT')
  return {
    players: [
      { id: p1.id, userId: p1.userId, username: p1.username, snake: snake1, dir: 'RIGHT', nextDir: 'RIGHT', score: 0, alive: true },
      { id: p2.id, userId: p2.userId, username: p2.username, snake: snake2, dir: 'LEFT',  nextDir: 'LEFT',  score: 0, alive: true },
    ],
    fruit:  placeFruit(snake1, snake2),
    loop:   null,
    status: 'playing',
  }
}

// Logique de tick
async function tick(roomId, io) {
  const room = rooms.get(roomId)
  if (!room || room.status === 'finished') return

  const [p1, p2] = room.players

  // Déplace chaque joueur vivant
  for (const player of room.players) {
    if (!player.alive) continue

    player.dir = player.nextDir
    const head    = player.snake[player.snake.length - 1]
    const newHead = {
      x: head.x + DIRS[player.dir].x,
      y: head.y + DIRS[player.dir].y,
    }

    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
      player.alive = false
      continue
    }
    if (player.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      player.alive = false
      continue
    }
    const other = room.players.find(p => p.id !== player.id)
    if (other.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      player.alive = false
      continue
    }

    player.snake.push(newHead)

    if (newHead.x === room.fruit.x && newHead.y === room.fruit.y) {
      player.score++
      room.fruit = placeFruit(p1.snake, p2.snake)
    } else {
      player.snake.shift()
    }
  }

  // Vérifie fin de partie
  const alivePlayers = room.players.filter(p => p.alive)

  if (alivePlayers.length <= 1) {
    room.status = 'finished'
    clearInterval(room.loop)

    let winner = null

    if (alivePlayers.length === 1) {
      const survivor = alivePlayers[0]
      const other    = room.players.find(p => p.id !== survivor.id)
      if (survivor.score === other.score) {
        winner = null
      } else {
        winner = survivor.score > other.score ? survivor : other
      }
    }

    // Débloque les achievements multijoueur
    await Promise.all(room.players.map(player =>
      checkMultiplayerAchievements({
        userId:   player.userId,
        isWinner: player.id === winner?.id
      })
    ))

    io.to(roomId).emit('game:over', {
      winner:  winner?.id ?? null,
      players: room.players.map(p => ({ id: p.id, username: p.username, score: p.score }))
    })
    rooms.delete(roomId)
    return
  }

  // Envoie l'état mis à jour
  io.to(roomId).emit('game:state', {
    players: room.players.map(p => ({
      id:    p.id,
      snake: p.snake,
      score: p.score,
      alive: p.alive,
    })),
    fruit: room.fruit,
  })
}

// Setup Socket.io
export function setupMultiplayer(io) {
  io.on('connection', socket => {
    console.log(`Socket connecté : ${socket.id}`)

    socket.on('matchmaking:join', ({ username, userId }) => {
      socket.data.username = username
      socket.data.userId   = userId

      if (waitingPlayer && waitingPlayer.id !== socket.id) {
        const roomId = randomId()
        const room   = createRoom(
          { id: waitingPlayer.id, userId: waitingPlayer.data.userId, username: waitingPlayer.data.username },
          { id: socket.id,        userId: socket.data.userId,        username: socket.data.username }
        )
        rooms.set(roomId, room)

        waitingPlayer.join(roomId)
        socket.join(roomId)
        socket.data.roomId        = roomId
        waitingPlayer.data.roomId = roomId

        io.to(roomId).emit('matchmaking:found', {
          roomId,
          players: [
            { id: waitingPlayer.id, userId: waitingPlayer.data.userId, username: waitingPlayer.data.username, playerIndex: 0 },
            { id: socket.id,        userId: socket.data.userId,        username: socket.data.username,                               playerIndex: 1 },
          ]
        })

        setTimeout(() => {
          room.loop = setInterval(() => tick(roomId, io), SPEED)
          io.to(roomId).emit('game:start')
        }, 3000)

        waitingPlayer = null
      } else {
        waitingPlayer = socket
        socket.emit('matchmaking:waiting')
      }
    })

    socket.on('room:create', ({ username, userId }) => {
      const roomId = randomId()
      socket.data.username = username
      socket.data.userId   = userId
      socket.data.roomId   = roomId
      socket.data.isHost   = true
      socket.join(roomId)

      rooms.set(roomId, {
        players: [{ id: socket.id, userId: socket.data.userId, username, snake: [], dir: 'RIGHT', nextDir: 'RIGHT', score: 0, alive: true }],
        fruit:   null,
        loop:    null,
        status:  'waiting',
        host:    socket.id,
      })

      socket.emit('room:created', { roomId })
    })

    socket.on('room:join', ({ username, userId, roomId }) => {
      const room = rooms.get(roomId)

      if (!room)                     return socket.emit('room:error', { message: 'Room introuvable' })
      if (room.status !== 'waiting') return socket.emit('room:error', { message: 'La partie a déjà commencé' })
      if (room.players.length >= 2)  return socket.emit('room:error', { message: 'Room pleine' })

      socket.data.username = username
      socket.data.userId   = userId
      socket.data.roomId   = roomId
      socket.join(roomId)

      const snake1 = createSnake(4,  10, 'RIGHT')
      const snake2 = createSnake(15, 10, 'LEFT')

      room.players[0].snake = snake1
      room.players.push({ id: socket.id, userId: socket.data.userId, username, snake: snake2, dir: 'LEFT', nextDir: 'LEFT', score: 0, alive: true })
      room.fruit  = placeFruit(snake1, snake2)
      room.status = 'playing'

      io.to(roomId).emit('matchmaking:found', {
        roomId,
        players: [
          { id: room.players[0].id, userId: room.players[0].userId, username: room.players[0].username, playerIndex: 0 },
          { id: socket.id,          userId: socket.data.userId,        username: socket.data.username,                               playerIndex: 1 },
        ]
      })

      setTimeout(() => {
        room.loop = setInterval(() => tick(roomId, io), SPEED)
        io.to(roomId).emit('game:start')
      }, 3000)
    })

    socket.on('player:direction', ({ direction }) => {
      const roomId = socket.data.roomId
      const room   = rooms.get(roomId)
      if (!room) return

      const player = room.players.find(p => p.id === socket.id)
      if (!player || !player.alive) return

      const opposite = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
      if (direction !== opposite[player.dir]) {
        player.nextDir = direction
      }
    })

    socket.on('disconnect', () => {
      console.log(`Socket déconnecté : ${socket.id}`)

      if (waitingPlayer?.id === socket.id) {
        waitingPlayer = null
      }

      const roomId = socket.data.roomId
      const room   = rooms.get(roomId)
      if (room) {
        clearInterval(room.loop)
        io.to(roomId).emit('game:abandoned', { by: socket.data.username })
        rooms.delete(roomId)
      }
    })
  })
}