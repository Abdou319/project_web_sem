import { contextBridge, ipcRenderer } from 'electron';

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (options: { content: string; defaultName: string; filters?: unknown[] }) =>
    ipcRenderer.invoke('dialog:saveFile', options),

  // Shell
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),

  // Menu events (from main → renderer)
  onMenuOpenFile: (cb: () => void) => {
    ipcRenderer.on('menu:openFile', () => cb());
    return () => ipcRenderer.removeAllListeners('menu:openFile');
  },
  onMenuExport: (cb: (format: string) => void) => {
    ipcRenderer.on('menu:export', (_e, format) => cb(format));
    return () => ipcRenderer.removeAllListeners('menu:export');
  },
  onMenuToggleTheme: (cb: () => void) => {
    ipcRenderer.on('menu:toggleTheme', () => cb());
    return () => ipcRenderer.removeAllListeners('menu:toggleTheme');
  },
  onMenuLayout: (cb: (layout: string) => void) => {
    ipcRenderer.on('menu:layout', (_e, layout) => cb(layout));
    return () => ipcRenderer.removeAllListeners('menu:layout');
  },
});

// Type declaration (for renderer TypeScript)
declare global {
  interface Window {
    electronAPI: {
      openFile: () => Promise<{ filePath: string; content: string; fileName: string } | null>;
      saveFile: (opts: { content: string; defaultName: string; filters?: unknown[] }) => Promise<boolean>;
      openExternal: (url: string) => void;
      onMenuOpenFile: (cb: () => void) => () => void;
      onMenuExport: (cb: (format: string) => void) => () => void;
      onMenuToggleTheme: (cb: () => void) => () => void;
      onMenuLayout: (cb: (layout: string) => void) => () => void;
    };
  }
}