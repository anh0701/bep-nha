
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

const envPath = fileURLToPath(
  new URL('./.env', import.meta.url),
)

const result = dotenv.config({ path: envPath })

if (result.error) {
  console.error('Cannot load .env:', result.error.message)
}

console.log('Environment variables:', {
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD_EXISTS: typeof process.env.DB_PASSWORD === 'string',
})

// Chỉ import app sau khi đã nạp biến môi trường.
const { default: app } = await import('./app.js')

const PORT = Number(process.env.PORT) || 3000

app.listen(PORT, () => {
  console.log(`Bep Nha API is running at http://localhost:${PORT}`)
})
