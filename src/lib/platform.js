import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'

export function loadData() {
  return invoke('load_data')
}

export function saveData(data) {
  return invoke('save_data', { data })
}

export async function exportBackup(data) {
  const defaultFileName = `mossy-backup-${new Date().toISOString().slice(0, 10)}.json`
  return invoke('export_backup', { data, defaultFileName })
}

export function importBackup() {
  return invoke('import_backup')
}

const appWindow = getCurrentWindow()

export const windowControls = {
  minimize: () => appWindow.minimize(),
  toggleMaximize: () => appWindow.toggleMaximize(),
  close: () => appWindow.close(),
  startResizeDragging: (direction) => appWindow.startResizeDragging(direction)
}
