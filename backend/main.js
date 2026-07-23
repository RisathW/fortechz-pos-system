const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

// 1. Boot up the Express Backend Server safely in the background
try {
  require('./server.js');
} catch (error) {
  console.error("Failed to start backend server:", error);
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 720,
    title: "ForTechZ POS System",
    icon: path.join(__dirname, 'icon.ico'), 
    show: false, // Keeps the screen hidden until everything is loaded (prevents white flashing)
    autoHideMenuBar: true, // Hides the default Windows menu bar for a cleaner POS look
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 2. Connect the Electron Window to your React/Express Server
  // We use a slight delay to ensure the database and port 5000 are ready
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:5000')
      .catch((err) => {
        dialog.showErrorBox(
          "System Error", 
          "Failed to connect to the POS server. Please restart the application or check your database connection."
        );
      });
  }, 1500);

  // 3. Gracefully show the window once it is fully rendered and maximize it
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize(); // Opens the POS in full screen automatically
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// 4. App Lifecycle Management
app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  // Kills the background server processes when you close the app
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});