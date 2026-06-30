import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { setupMultiplayer } from './multiplayer.js'
import { errorHandler } from './middleware/errorHandler.js'
import logger from './config/logger.js'

import scoresRouter       from './routes/scores.js'
import usersRouter        from './routes/users.js'
import avatarsRouter      from './routes/avatars.js'
import aiRouter           from './routes/ai.js'
import aiDemoRouter       from './routes/aiDemo.js'
import achievementsRouter from './routes/achievements.js'

const app    = express()
const server = createServer(app)
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' }
})

const PORT = process.env.PORT || 3000

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

app.use('/scores',       scoresRouter)
app.use('/users',        usersRouter)
app.use('/avatars',      avatarsRouter)
app.use('/ai',           aiRouter)
app.use('/ai',           aiDemoRouter)
app.use('/achievements', achievementsRouter)

app.get('/health', (_, res) => res.json({ status: 'ok' }))
app.use((_, res) => res.status(404).json({ error: 'Route introuvable' }))

app.use(errorHandler)

setupMultiplayer(io)

server.listen(PORT, () => {
  logger.info(`Serveur démarré sur http://localhost:${PORT}`)
})