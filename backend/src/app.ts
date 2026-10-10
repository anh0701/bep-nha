import express from 'express'
import cors from 'cors'
import healthRoutes from './routes/health.routes.js'
import databaseRoutes from './routes/database.routes.js'
import dishRoutes from './routes/dish.routes.js'

const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
}))

app.use(express.json())

app.use('/api', healthRoutes)
app.use('/api', databaseRoutes)
app.use('/api', dishRoutes)

export default app