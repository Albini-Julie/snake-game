import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import scoresRouter  from './routes/scores.js'
import usersRouter   from './routes/users.js'
import avatarsRouter from './routes/avatars.js'

const app  = express()
const PORT = process.env.PORT || 3000

// Middlewares globaux 
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())

// Routes
app.use('/scores',  scoresRouter)
app.use('/users',   usersRouter)
app.use('/avatars', avatarsRouter)

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok' }))

// 404 catch-all 
app.use((_, res) => res.status(404).json({ error: 'Route introuvable' }))

// Démarrage
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
})