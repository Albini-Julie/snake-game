import logger from '../server/config/logger.js'
import { checkMultiplayerAchievements } from './services/achievementService.js'
import {
  SPEED,
  randomRoomId,
  createSnake,
  placeFruit,
  createGameState,
  setPlayerDirection,
  stepGame,
  checkGameOver,
  serializeState,
} from './services/gameEngine.js'

// Rooms actives : roomId → gameState (+ loop, host)
const rooms = new Map()

// File d'attente matchmaking
let waitingPlayer = null

// Boucle de jeu 
async function tick(roomId, io) {
  const room = rooms.get(roomId)
  if (!room || room.status === 'finished') return

  stepGame(room)

  const { finished, winner } = checkGameOver(room)

  if (finished) {
    room.status = 'finished'
    clearInterval(room.loop)

    // Débloque les achievements multijoueur pour les deux joueurs
    await Promise.all(room.players.map(player =>
      checkMultiplayerAchievements({
        userId:   player.userId,
        isWinner: player.id === winner?.id,
      })
    ))

    io.to(roomId).emit('game:over', {
      winner:  winner?.id ?? null,
      players: room.players.map(p => ({ id: p.id, username: p.username, score: p.score })),
    })
    rooms.delete(roomId)
    return
  }

  io.to(roomId).emit('game:state', serializeState(room))
}

// Setup Socket.io 
export function setupMultiplayer(io) {
  io.on('connection', socket => {
    logger.info({ socketId: socket.id }, 'Socket connecté')

    // Matchmaking automatique 
    socket.on('matchmaking:join', ({ username, userId }) => {
      socket.data.username = username
      socket.data.userId   = userId

      if (waitingPlayer && waitingPlayer.id !== socket.id) {
        const roomId = randomRoomId()
        const room   = createGameState(
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
            { id: socket.id,        userId: socket.data.userId,        username: socket.data.username,        playerIndex: 1 },
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

    //  Créer une room 
    socket.on('room:create', ({ username, userId }) => {
      const roomId = randomRoomId()
      socket.data.username = username
      socket.data.userId   = userId
      socket.data.roomId   = roomId
      socket.join(roomId)

      rooms.set(roomId, {
        players: [{ id: socket.id, userId, username, snake: [], dir: 'RIGHT', nextDir: 'RIGHT', score: 0, alive: true }],
        fruit:   null,
        loop:    null,
        status:  'waiting',
        host:    socket.id,
      })

      socket.emit('room:created', { roomId })
    })

    // Rejoindre une room 
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
      room.players.push({ id: socket.id, userId, username, snake: snake2, dir: 'LEFT', nextDir: 'LEFT', score: 0, alive: true })
      room.fruit  = placeFruit(snake1, snake2)
      room.status = 'playing'

      io.to(roomId).emit('matchmaking:found', {
        roomId,
        players: [
          { id: room.players[0].id, userId: room.players[0].userId, username: room.players[0].username, playerIndex: 0 },
          { id: socket.id,          userId,                          username,                           playerIndex: 1 },
        ]
      })

      setTimeout(() => {
        room.loop = setInterval(() => tick(roomId, io), SPEED)
        io.to(roomId).emit('game:start')
      }, 3000)
    })

    // Direction d'un joueur 
    socket.on('player:direction', ({ direction }) => {
      const room = rooms.get(socket.data.roomId)
      if (!room) return

      const player = room.players.find(p => p.id === socket.id)
      if (!player) return

      setPlayerDirection(player, direction)
    })

    // Déconnexion
    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Socket déconnecté')

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