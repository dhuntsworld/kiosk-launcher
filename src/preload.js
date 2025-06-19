const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  launchKiosk: (url) => ipcRenderer.invoke("launch-kiosk", url),
  getRecentUrls: () => ipcRenderer.invoke("get-recent-urls"),
  saveRecentUrl: (url) => ipcRenderer.invoke("save-recent-url", url),
})