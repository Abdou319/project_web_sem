import { BrowserWindow, Menu, MenuItemConstructorOptions, app } from 'electron';

export function buildMenu(win: BrowserWindow): void {
  const isMac = process.platform === 'darwin';

  const template: MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),

    // File
    {
      label: 'File',
      submenu: [
        {
          label: 'Open RDF File…',
          accelerator: 'CmdOrCtrl+O',
          click: () => win.webContents.send('menu:openFile'),
        },
        { type: 'separator' },
        {
          label: 'Export as Turtle…',
          accelerator: 'CmdOrCtrl+S',
          click: () => win.webContents.send('menu:export', 'turtle'),
        },
        {
          label: 'Export as JSON-LD…',
          click: () => win.webContents.send('menu:export', 'json-ld'),
        },
        {
          label: 'Export as N-Triples…',
          click: () => win.webContents.send('menu:export', 'n-triples'),
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },

    // Edit
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const },
      ],
    },

    // View
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Dark Theme',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => win.webContents.send('menu:toggleTheme'),
        },
        { type: 'separator' },
        {
          label: 'Force Layout',
          click: () => win.webContents.send('menu:layout', 'force'),
        },
        {
          label: 'Hierarchical Layout',
          click: () => win.webContents.send('menu:layout', 'hierarchical'),
        },
        {
          label: 'Grid Layout',
          click: () => win.webContents.send('menu:layout', 'grid'),
        },
        { type: 'separator' },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' },
        { role: 'togglefullscreen' as const },
        ...(process.env.NODE_ENV === 'development'
          ? [{ role: 'toggleDevTools' as const }]
          : []),
      ],
    },

    // Help
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () =>
            win.webContents.send('shell:openExternal', 'https://github.com/Abdeval/project_web_sem'),
        },
        {
          label: 'Report Issue',
          click: () =>
            win.webContents.send('shell:openExternal', 'https://github.com/Abdeval/project_web_sem/issues'),
        },
        { type: 'separator' },
        {
          label: 'About Knowledge Graph Desktop',
          click: () => {
            // Could open an About dialog
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}