const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('easelDesktop', {
  action: (name) => ipcRenderer.invoke('desktop:action', name),
  onState: (callback) => ipcRenderer.on('desktop:state', (_event, value) => callback(value)),
});
