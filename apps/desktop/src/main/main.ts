import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { buildMenu } from './menu';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0F172A',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false, // Show after ready-to-show for smooth launch
    icon: path.join(__dirname, '../../assets/icon.png'),
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) mainWindow?.webContents.openDevTools({ mode: 'detach' });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  buildMenu(mainWindow);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── App lifecycle ─────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC handlers ──────────────────────────────────────────────────────────

/** Open RDF file dialog */
ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open RDF File',
    filters: [
      { name: 'RDF Files', extensions: ['ttl', 'rdf', 'owl', 'n3', 'nt', 'jsonld', 'json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const filePath = result.filePaths[0];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { filePath, content, fileName: path.basename(filePath) };
  } catch (err: unknown) {
    if (err instanceof Error) dialog.showErrorBox('File Error', `Could not read file: ${err.message}`);
    else dialog.showErrorBox('File Error', 'Could not read file');
    return null;
  }
});

/** Save / export file */
ipcMain.handle('dialog:saveFile', async (_event, { content, defaultName, filters }) => {
  if (!mainWindow) return false;

  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export RDF',
    defaultPath: defaultName,
    filters: filters ?? [{ name: 'All Files', extensions: ['*'] }],
  });

  if (result.canceled || !result.filePath) return false;

  try {
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return true;
  } catch (err: unknown) {
    if (err instanceof Error) dialog.showErrorBox('Save Error', `Could not save file: ${err.message}`);
    else dialog.showErrorBox('Save Error', 'Could not save file');
    return false;
  }
});

/** Open URL in browser */
ipcMain.handle('shell:openExternal', (_event, url: string) => {
  shell.openExternal(url);
});