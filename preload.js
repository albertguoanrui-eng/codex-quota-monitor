const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('widget', {
  togglePin: () => ipcRenderer.invoke('toggle-pin'),
  getUsage: () => ipcRenderer.invoke('get-usage'),
  getAmbientContrast: () => ipcRenderer.invoke('get-ambient-contrast'),
  close: () => ipcRenderer.send('close')
});
