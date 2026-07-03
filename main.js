const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const winWidth = 350;
  const winHeight = 350;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    // Position near the bottom-right of the primary screen, just above the taskbar
    x: screenWidth - winWidth - 50,
    y: screenHeight - winHeight - 50,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  // Start with click-through enabled (ignoring clicks) for transparent parts.
  // forward: true ensures mouse movements are still tracked inside the window.
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Disable GPU occlusion tracking to prevent chromium from suspending rendering
// when window overlaps with other apps
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows', 'true');

// Force Electron to request the high-performance dedicated GPU (discrete graphics)
app.commandLine.appendSwitch('force_high_performance_gpu', 'true');

// Bypass Chromium driver blocklists to ensure hardware acceleration is active
app.commandLine.appendSwitch('ignore-gpu-blocklist', 'true');

// Disable automatic DPI scaling to prevent window enlarging/shrinking when dragging across monitors
app.commandLine.appendSwitch('force-device-scale-factor', '1');

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// IPC handler to toggle mouse click-through capability
ipcMain.on('set-ignore-mouse', (event, ignore) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

// IPC handler to move the window when dragging the character
ipcMain.on('move-window', (event, delta) => {
  if (mainWindow) {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(Math.round(x + delta.x), Math.round(y + delta.y));
  }
});

// IPC handler to dynamically resize the window based on 3D asset dimensions
ipcMain.on('resize-window', (event, size) => {
  if (mainWindow) {
    const [x, y] = mainWindow.getPosition();
    const [w, h] = mainWindow.getSize();
    const deltaW = Math.round(size.width - w);
    const deltaH = Math.round(size.height - h);
    
    // Adjust position coordinates by the size delta so the bottom-right corner stays anchored
    mainWindow.setBounds({
      x: Math.round(x - deltaW),
      y: Math.round(y - deltaH),
      width: Math.round(size.width),
      height: Math.round(size.height)
    });
  }
});
