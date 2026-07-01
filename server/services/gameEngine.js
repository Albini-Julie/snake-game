// Constantes du jeu
export const CELL  = 20
export const COLS  = 20
export const ROWS  = 20
export const SPEED = Number(process.env.GAME_SPEED_MS ?? 150) // ms par tick

export const DIRS = {
  UP:    { x: 0,  y: -1 },
  DOWN:  { x: 0,  y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x: 1,  y:  0 },
}

const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }

/**
 * Génère un identifiant de room aléatoire lisible
 * @returns {string} Identifiant de 6 caractères alphanumériques
 */
export function randomRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

/**
 * Place un fruit sur une case libre en dehors des deux snakes
 * @param {Array<{x: number, y: number}>} snake1
 * @param {Array<{x: number, y: number}>} snake2
 * @returns {{ x: number, y: number }}
 */
export function placeFruit(snake1, snake2) {
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

/**
 * Crée un snake de 3 segments orienté dans une direction
 * @param {number} startX - Position X de la tête
 * @param {number} startY - Position Y de la tête
 * @param {string} dir - Direction initiale ('UP' | 'DOWN' | 'LEFT' | 'RIGHT')
 * @returns {Array<{x: number, y: number}>}
 */
export function createSnake(startX, startY, dir) {
  return [
    { x: startX - 2 * DIRS[dir].x, y: startY - 2 * DIRS[dir].y },
    { x: startX - 1 * DIRS[dir].x, y: startY - 1 * DIRS[dir].y },
    { x: startX,                    y: startY },
  ]
}

/**
 * Crée l'état initial d'une partie à deux joueurs
 * @param {{ id: string, userId: string, username: string }} p1
 * @param {{ id: string, userId: string, username: string }} p2
 * @returns {object} État initial du jeu
 */
export function createGameState(p1, p2) {
  const snake1 = createSnake(4,  10, 'RIGHT')
  const snake2 = createSnake(15, 10, 'LEFT')

  return {
    players: [
      { id: p1.id, userId: p1.userId, username: p1.username, snake: snake1, dir: 'RIGHT', nextDir: 'RIGHT', score: 0, alive: true },
      { id: p2.id, userId: p2.userId, username: p2.username, snake: snake2, dir: 'LEFT',  nextDir: 'LEFT',  score: 0, alive: true },
    ],
    fruit:  placeFruit(snake1, snake2),
    status: 'playing',
  }
}

/**
 * Met à jour la direction demandée d'un joueur en interdisant le demi-tour
 * @param {object} player - Joueur à mettre à jour
 * @param {string} direction - Nouvelle direction ('UP' | 'DOWN' | 'LEFT' | 'RIGHT')
 */
export function setPlayerDirection(player, direction) {
  if (!player.alive) return
  if (direction !== OPPOSITE[player.dir]) {
    player.nextDir = direction
  }
}

/**
 * Avance tous les joueurs vivants d'un tick et résout les collisions.
 * Mute directement l'objet state passé en paramètre.
 * @param {object} state - État courant du jeu
 * @returns {object} État mis à jour
 */
export function stepGame(state) {
  const [p1, p2] = state.players

  for (const player of state.players) {
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
    const other = state.players.find(p => p.id !== player.id)
    if (other.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      player.alive = false
      continue
    }

    player.snake.push(newHead)

    if (newHead.x === state.fruit.x && newHead.y === state.fruit.y) {
      player.score++
      state.fruit = placeFruit(p1.snake, p2.snake)
    } else {
      player.snake.shift()
    }
  }

  return state
}

/**
 * Détermine si la partie est terminée et qui en est le gagnant
 * @param {object} state - État courant du jeu
 * @returns {{ finished: boolean, winner: object|null }}
 */
export function checkGameOver(state) {
  const alivePlayers = state.players.filter(p => p.alive)

  if (alivePlayers.length > 1) {
    return { finished: false }
  }

  let winner = null

  if (alivePlayers.length === 1) {
    const survivor = alivePlayers[0]
    const other    = state.players.find(p => p.id !== survivor.id)
    if (survivor.score !== other.score) {
      winner = survivor.score > other.score ? survivor : other
    }
  }

  return { finished: true, winner }
}

/**
 * Sérialise l'état du jeu pour l'envoyer au client
 * @param {object} state - État courant du jeu
 * @returns {{ players: object[], fruit: object }}
 */
export function serializeState(state) {
  return {
    players: state.players.map(p => ({
      id:    p.id,
      snake: p.snake,
      score: p.score,
      alive: p.alive,
    })),
    fruit: state.fruit,
  }
}