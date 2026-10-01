'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const windowArg = process.argv.find((a) => a.startsWith('--tartiba-window='));

contextBridge.exposeInMainWorld('tartiba', {
  windowType: windowArg ? windowArg.split('=')[1] : 'main',
  getState: () => ipcRenderer.sendSync('get-state-sync'),
  op: (name, ...args) => ipcRenderer.invoke('op', name, ...args),
  onState: (cb) => ipcRenderer.on('state', (_e, s) => cb(s)),
  onAlarm: (cb) => ipcRenderer.on('alarm', (_e, f) => cb(f)),
  onShowDay: (cb) => ipcRenderer.on('show-day', (_e, d) => cb(d)),
});
