'use strict';
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const {
  app, BrowserWindow, ipcMain, dialog, Menu, Tray, Notification, screen, nativeImage, shell,
} = require('electron');
const store = require('./store');

const APP_ID = 'com.ghala.tartiba';
const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const DEFAULT_SOUND = path.join(ASSETS, 'sounds', 'alarm-clock.wav');
const WIDGET_ONLY = process.argv.includes('--widget-only');
// true when installed from the Microsoft Store (running inside an AppX/MSIX package)
const IS_STORE = process.windowsStore === true;

if (process.env.TARTIBA_DATA_DIR) app.setPath('userData', process.env.TARTIBA_DATA_DIR);
// a Store package already has its own identity from Windows; overriding it breaks the taskbar icon
if (!IS_STORE) app.setAppUserModelId(APP_ID);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => openMain());
}

let state;
let dataFile;
let mainWin = null;
let widgetWin = null;
let tray = null;
let saveTimer = null;
let quitting = false;

// ---------- storage ----------
function dataDir() { return app.getPath('userData'); }

function loadState() {
  dataFile = path.join(dataDir(), 'tartiba-data.json');
  const sysLang = (app.getLocale() || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en';
  let raw = null;
  for (const f of [dataFile, dataFile + '.bak']) {
    try { raw = JSON.parse(fs.readFileSync(f, 'utf8')); break; } catch (_) { /* try backup */ }
  }
  state = store.normalize(raw, sysLang);
  // timers that ran out while the app was closed simply show 00:00:00
  store.collectFinished(state, Date.now());
}

function saveNow() {
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    fs.mkdirSync(dataDir(), { recursive: true });
    const tmp = dataFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(state, null, 1), 'utf8');
    if (fs.existsSync(dataFile)) fs.copyFileSync(dataFile, dataFile + '.bak');
    fs.renameSync(tmp, dataFile);
  } catch (err) {
    console.error('Could not save data', err);
  }
}

function saveSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 250);
}

// ---------- state sent to windows ----------
function fileUrl(p) { return p ? pathToFileURL(p).href : null; }

function publicState() {
  return {
    ...state,
    photoUrls: state.photos.map((p) => (p && fs.existsSync(p) ? fileUrl(p) + '?v=' + fs.statSync(p).mtimeMs : null)),
    soundUrl: fileUrl(state.settings.sound && fs.existsSync(state.settings.sound) ? state.settings.sound : DEFAULT_SOUND),
    isDefaultSound: !state.settings.sound,
    assetsUrl: fileUrl(ASSETS),
    canOpenAtLogin: !IS_STORE,
  };
}

function broadcast() {
  const s = publicState();
  for (const w of [mainWin, widgetWin]) if (w && !w.isDestroyed()) w.webContents.send('state', s);
}

function changed() {
  saveSoon();
  broadcast();
  updateTray();
}

// ---------- timers ----------
setInterval(() => {
  if (!state) return;
  const finished = store.collectFinished(state, Date.now());
  if (!finished.length) return;
  changed();
  for (const f of finished) announceFinished(f);
}, 400);

function announceFinished(f) {
  const ar = state.settings.lang === 'ar';
  try {
    if (Notification.isSupported()) {
      new Notification({
        title: ar ? 'ترتيبة — انتهى الوقت ⏰' : 'Tartiba — time is up ⏰',
        body: f.text,
        icon: path.join(ASSETS, 'icon-256.png'),
        silent: true,
      }).show();
    }
  } catch (_) { /* notifications are optional */ }
  // the main window plays the sound when it is open, otherwise the widget does
  const target = (mainWin && !mainWin.isDestroyed()) ? mainWin : (widgetWin && !widgetWin.isDestroyed() ? widgetWin : null);
  if (target) target.webContents.send('alarm', f);
}

// ---------- windows ----------
function windowIcon() {
  return nativeImage.createFromPath(path.join(ASSETS, process.platform === 'win32' ? 'icon.ico' : 'icon-256.png'));
}

function openMain() {
  if (mainWin && !mainWin.isDestroyed()) {
    if (mainWin.isMinimized()) mainWin.restore();
    mainWin.show();
    mainWin.focus();
    return;
  }
  mainWin = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 900,
    minHeight: 520,
    title: 'ترتيبة — Tartiba',
    icon: windowIcon(),
    backgroundColor: '#cedfbe',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      additionalArguments: ['--tartiba-window=main'],
    },
  });
  mainWin.setMenu(null);
  mainWin.once('ready-to-show', () => mainWin.show());
  mainWin.on('closed', () => { mainWin = null; });
  mainWin.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  mainWin.webContents.on('will-navigate', (e) => e.preventDefault());
  mainWin.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function defaultWidgetBounds() {
  const wa = screen.getPrimaryDisplay().workArea;
  const width = 340;
  const height = 400;
  return { x: wa.x + wa.width - width - 24, y: wa.y + 24, width, height };
}

function boundsVisible(b) {
  return screen.getAllDisplays().some((d) => {
    const a = d.workArea;
    const ix = Math.min(b.x + b.width, a.x + a.width) - Math.max(b.x, a.x);
    const iy = Math.min(b.y + b.height, a.y + a.height) - Math.max(b.y, a.y);
    return ix > 60 && iy > 40;
  });
}

function openWidget() {
  if (widgetWin && !widgetWin.isDestroyed()) {
    widgetWin.show();
    widgetWin.focus();
    return;
  }
  let b = state.widget.bounds;
  if (!b || !boundsVisible(b)) b = defaultWidgetBounds();
  widgetWin = new BrowserWindow({
    ...b,
    minWidth: 200,
    minHeight: 120,
    frame: false,
    resizable: true,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: state.widget.pinned,
    title: 'Tartiba widget',
    icon: windowIcon(),
    backgroundColor: '#f2fbec',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      additionalArguments: ['--tartiba-window=widget'],
    },
  });
  if (state.widget.pinned) widgetWin.setAlwaysOnTop(true, 'floating');
  widgetWin.once('ready-to-show', () => widgetWin.showInactive());
  let boundsTimer = null;
  const remember = () => {
    clearTimeout(boundsTimer);
    boundsTimer = setTimeout(() => {
      if (!widgetWin || widgetWin.isDestroyed()) return;
      state.widget.bounds = widgetWin.getBounds();
      saveSoon();
    }, 300);
  };
  for (const ev of ['move', 'moved', 'resize', 'resized']) widgetWin.on(ev, remember);
  widgetWin.on('closed', () => {
    widgetWin = null;
    if (!quitting) {
      state.widget.open = false;
      changed();
    }
  });
  widgetWin.webContents.on('will-navigate', (e) => e.preventDefault());
  widgetWin.loadFile(path.join(__dirname, 'widget', 'widget.html'));
  if (!state.widget.open) {
    state.widget.open = true;
    changed();
  }
}

function closeWidget() {
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.close();
}

function setPinned(pinned) {
  state.widget.pinned = !!pinned;
  if (widgetWin && !widgetWin.isDestroyed()) {
    if (pinned) widgetWin.setAlwaysOnTop(true, 'floating');
    else widgetWin.setAlwaysOnTop(false);
  }
  changed();
}

// ---------- tray ----------
function updateTray() {
  if (!tray) return;
  const ar = state.settings.lang === 'ar';
  const widgetOpen = !!(widgetWin && !widgetWin.isDestroyed());
  tray.setToolTip(ar ? 'ترتيبة' : 'Tartiba');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: ar ? 'فتح ترتيبة' : 'Open Tartiba', click: openMain },
    { label: widgetOpen ? (ar ? 'إخفاء الودجت' : 'Hide widget') : (ar ? 'إظهار الودجت' : 'Show widget'), click: () => (widgetOpen ? closeWidget() : openWidget()) },
    { type: 'separator' },
    { label: ar ? 'خروج' : 'Quit', click: () => { quitting = true; app.quit(); } },
  ]));
}

function createTray() {
  try {
    tray = new Tray(nativeImage.createFromPath(path.join(ASSETS, 'icon-256.png')).resize({ width: 16, height: 16 }));
    tray.on('double-click', openMain);
    tray.on('click', openMain);
    updateTray();
  } catch (_) { tray = null; }
}

// ---------- start with Windows ----------
function applyLoginItem() {
  // Store packages cannot register themselves to start with Windows this way
  if (IS_STORE) return;
  if (process.platform !== 'win32' && process.platform !== 'darwin') return;
  const args = app.isPackaged ? ['--widget-only'] : [app.getAppPath(), '--widget-only'];
  try {
    app.setLoginItemSettings({ openAtLogin: !!state.settings.openWidgetAtLogin, path: process.execPath, args });
  } catch (_) { /* not supported */ }
}

// ---------- files the user picks ----------
async function pickFile(win, filters) {
  const res = await dialog.showOpenDialog(win, { properties: ['openFile'], filters });
  if (res.canceled || !res.filePaths.length) return null;
  return res.filePaths[0];
}

function copyInto(sub, src, baseName) {
  const dir = path.join(dataDir(), sub);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, baseName + '-' + Date.now() + path.extname(src).toLowerCase());
  fs.copyFileSync(src, dest);
  return dest;
}

function removeFile(p) {
  try { if (p && p.startsWith(dataDir())) fs.unlinkSync(p); } catch (_) { /* already gone */ }
}

// ---------- IPC ----------
ipcMain.on('get-state-sync', (e) => { e.returnValue = publicState(); });

ipcMain.handle('op', async (e, name, ...args) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (Object.prototype.hasOwnProperty.call(store.ops, name)) {
    if (store.ops[name](state, ...args)) changed();
    return true;
  }
  switch (name) {
    case 'pickPhoto': {
      const i = Number(args[0]);
      if (!(i >= 0 && i < 4)) return false;
      const src = await pickFile(win, [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] }]);
      if (!src) return false;
      const dest = copyInto('photos', src, 'photo' + (i + 1));
      removeFile(state.photos[i]);
      state.photos[i] = dest;
      changed();
      return true;
    }
    case 'removePhoto': {
      const i = Number(args[0]);
      if (!(i >= 0 && i < 4) || !state.photos[i]) return false;
      removeFile(state.photos[i]);
      state.photos[i] = null;
      changed();
      return true;
    }
    case 'pickSound': {
      const src = await pickFile(win, [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus', 'webm'] }]);
      if (!src) return false;
      const dest = copyInto('sounds', src, 'timer-sound');
      removeFile(state.settings.sound);
      state.settings.sound = dest;
      state.settings.soundName = path.basename(src);
      changed();
      return true;
    }
    case 'resetSound': {
      removeFile(state.settings.sound);
      state.settings.sound = null;
      state.settings.soundName = null;
      changed();
      return true;
    }
    case 'setOpenWidgetAtLogin': {
      state.settings.openWidgetAtLogin = !!args[0];
      applyLoginItem();
      changed();
      return true;
    }
    case 'openWidget': openWidget(); return true;
    case 'closeWidget': closeWidget(); return true;
    case 'toggleWidget':
      if (widgetWin && !widgetWin.isDestroyed()) closeWidget(); else openWidget();
      return true;
    case 'setPinned': setPinned(args[0]); return true;
    case 'openMain': openMain(); return true;
    case 'showDay':
      openMain();
      if (mainWin) mainWin.webContents.send('show-day', args[0]);
      return true;
    default:
      return false;
  }
});

// ---------- lifecycle ----------
app.whenReady().then(() => {
  loadState();
  Menu.setApplicationMenu(null);
  createTray();
  if (WIDGET_ONLY) {
    openWidget();
  } else {
    openMain();
    if (state.widget.open) openWidget();
  }
});

app.on('before-quit', () => {
  quitting = true;
  if (state) saveNow();
});

app.on('window-all-closed', () => {
  if (state) saveNow();
  app.quit();
});
