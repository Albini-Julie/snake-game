import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'                           
import { setupMultiplayer } from './multiplayer.js'  

import scoresRouter  from './routes/scores.js'
import usersRouter   from './routes/users.js'
import avatarsRouter from './routes/avatars.js'
import aiRouter from './routes/ai.js'
import aiDemoRouter from './routes/aiDemo.js'
import achievementsRouter from './routes/achievements.js'

const app  = express()
const server = createServer(app)  

const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' }
})

const PORT = process.env.PORT || 3000

// Middlewares globaux 
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

// Routes
app.use('/scores',  scoresRouter)
app.use('/users',   usersRouter)
app.use('/avatars', avatarsRouter)
app.use('/ai', aiRouter)  
app.use('/ai', aiDemoRouter)
app.use('/achievements', achievementsRouter)

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }))

// 404 catch-all 
app.use((_, res) => res.status(404).json({ error: 'Route introuvable' }))

setupMultiplayer(io) 

// Démarrage
server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
})