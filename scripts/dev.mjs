import { spawn } from 'node:child_process'
import http from 'node:http'

const isWin = process.platform === 'win32'
const npxCmd = isWin ? 'npx.cmd' : 'npx'
const devUrl = 'http://localhost:5173'

const vite = spawn(npxCmd, ['vite'], { stdio: 'inherit', shell: true })

function waitForServer(url, cb) {
  const req = http.get(url, () => cb())
  req.on('error', () => setTimeout(() => waitForServer(url, cb), 300))
}

waitForServer(devUrl, () => {
  const electron = spawn(npxCmd, ['electron', '.'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, VITE_DEV_SERVER_URL: devUrl }
  })

  electron.on('exit', (code) => {
    vite.kill()
    process.exit(code ?? 0)
  })
})

process.on('SIGINT', () => {
  vite.kill()
  process.exit(0)
})
