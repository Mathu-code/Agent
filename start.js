#!/usr/bin/env node
// Simple launcher - starts backend which serves both API and built frontend

const { spawn } = require('child_process')
const path = require('path')
const http = require('http')

const PORT = process.env.PORT || 45678

// Check if port is free
const server = http.createServer()
server.listen(PORT, async () => {
  server.close()
  console.log(`Starting Kapruka agent on port ${PORT}...`)

  const backendDir = path.join(__dirname, '..', 'backend')
  const child = spawn('node', ['server.js'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: String(PORT) }
  })

  child.on('error', (err) => {
    console.error('Failed to start:', err.message)
    process.exit(1)
  })

  console.log(`🛍️  Frontend: http://localhost:${PORT}`)
  console.log(`📊  Health:   http://localhost:${PORT}/health`)
})

server.on('error', () => {
  console.error(`Port ${PORT} is already in use. Try another port:`)
  console.error(`  PORT=6000 node start.js`)
  process.exit(1)
})
