const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const dataFile = () => path.join(app.getPath('userData'), 'data.json')
const backupFile = () => path.join(app.getPath('userData'), 'data.backup.json')

function defaultData() {
  return { projects: [] }
}

function loadData() {
  try {
    const raw = fs.readFileSync(dataFile(), 'utf-8')
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.projects)) return defaultData()
    return parsed
  } catch {
    return defaultData()
  }
}

function saveData(data) {
  const file = dataFile()
  try {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, backupFile())
    }
  } catch {
    // backup is best-effort
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8')
}

let win = null
const iconPath = path.join(__dirname, '../build/icon.ico')

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 720,
    minHeight: 480,
    title: 'mossy',
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    icon: iconPath,
    // 윈도우 기본 제목표시줄은 시스템 강조색(초록 등)을 따라가서 앱과 색이 어긋난다.
    // 제목표시줄을 숨기고 창 버튼만 앱 배경색 위에 얹는다(제목 줄은 렌더러의 .titlebar).
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#ffffff', symbolColor: '#6b7280', height: 32 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.on('closed', () => {
    win = null
  })
}

ipcMain.handle('data:load', () => loadData())

ipcMain.handle('data:save', (_event, data) => {
  saveData(data)
  return true
})

ipcMain.handle('data:exportBackup', async (_event, data) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: '데이터 내보내기',
    defaultPath: `mossy-backup-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (canceled || !filePath) return { ok: false }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  return { ok: true, filePath }
})

ipcMain.handle('data:importBackup', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: '데이터 불러오기',
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (canceled || !filePaths[0]) return { ok: false }
  try {
    const raw = fs.readFileSync(filePaths[0], 'utf-8')
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.projects)) throw new Error('invalid shape')
    return { ok: true, data: parsed }
  } catch {
    return { ok: false, error: 'invalid-file' }
  }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
