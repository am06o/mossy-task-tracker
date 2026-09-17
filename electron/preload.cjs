const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (data) => ipcRenderer.invoke('data:save', data),
  exportBackup: (data) => ipcRenderer.invoke('data:exportBackup', data),
  importBackup: () => ipcRenderer.invoke('data:importBackup')
})
