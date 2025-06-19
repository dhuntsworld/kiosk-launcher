const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
const os = require("os")
const fs = require("fs")

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    resizable: false,
    maximizable: false,
    icon: path.join(__dirname, "../assets/icon.png"),
    titleBarStyle: "default",
  })

  mainWindow.loadFile("src/index.html")
  mainWindow.setMenuBarVisibility(false)
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Handle kiosk launch
ipcMain.handle("launch-kiosk", async (event, url) => {
  try {
    // Validate URL
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url
    }

    // Find Chrome executable
    let chromePath = findChromeExecutable()
    
    if (!chromePath) {
      throw new Error("Chrome not found. Please install Google Chrome.")
    }

    // Launch Chrome in kiosk mode
    const chromeArgs = [
      "--kiosk",
      "--kiosk-printing",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor",
      url,
    ]

    spawn(chromePath, chromeArgs, {
      detached: true,
      stdio: "ignore",
    })

    return { success: true }
  } catch (error) {
    console.error("Error launching kiosk:", error)
    return { success: false, error: error.message }
  }
})

function findChromeExecutable() {
  const platform = os.platform()
  
  if (platform === "win32") {
    // Windows Chrome paths - including LOCALAPPDATA
    const possiblePaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
      path.join(process.env.APPDATA || "", "..\\Local\\Google\\Chrome\\Application\\chrome.exe"),
    ]

    for (const chromePath of possiblePaths) {
      try {
        if (fs.existsSync(chromePath)) {
          return chromePath
        }
      } catch (e) {
        continue
      }
    }
  } else if (platform === "darwin") {
    // macOS Chrome path
    const macPath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    if (fs.existsSync(macPath)) {
      return macPath
    }
  } else {
    // Linux Chrome paths
    const linuxPaths = ["google-chrome", "google-chrome-stable", "chromium-browser"]
    for (const cmd of linuxPaths) {
      try {
        spawn(cmd, ["--version"], { stdio: "ignore" })
        return cmd
      } catch (e) {
        continue
      }
    }
  }
  
  return null
}

// Mock recent URLs storage (in production, use electron-store)
let recentUrls = ["google.com", "youtube.com", "github.com"]

ipcMain.handle("get-recent-urls", async () => {
  return recentUrls.slice(0, 5) // Return last 5 URLs
})

ipcMain.handle("save-recent-url", async (event, url) => {
  // Remove if already exists
  recentUrls = recentUrls.filter(u => u !== url)
  // Add to beginning
  recentUrls.unshift(url)
  // Keep only last 10
  recentUrls = recentUrls.slice(0, 10)
  return true
})