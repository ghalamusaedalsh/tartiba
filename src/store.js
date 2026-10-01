'use strict';
// Data model and all changes to it. Pure JavaScript (no Electron) so it can be tested.
//
// state = {
//   version: 1,
//   tasks:   { 'YYYY-MM-DD': [ { id, text, done, createdAt, timer: null | { duration, remaining, running, endsAt } } ] },
//   quotes:  [7 strings]  // index 0 = Sunday ... 6 = Saturday
//   photos:  [4 file paths or null],
//   settings:{ lang: 'ar'|'en', theme, sound: path|null, soundName: string|null, openWidgetAtLogin: bool },
//   widget:  { open: bool, pinned: bool, bounds: {x,y,width,height}|null }
// }

const crypto = require('crypto');

const MAX_TIMER = 99 * 3600 + 59 * 60 + 59;

function defaultState(lang = 'en') {
  return {
    version: 1,
    tasks: {},
    quotes: ['', '', '', '', '', '', ''],
    photos: [null, null, null, null],
    settings: { lang, theme: 'fresh', sound: null, soundName: null, openWidgetAtLogin: false },
    widget: { open: false, pinned: true, bounds: null },
  };
}

// Repairs anything missing or malformed in a loaded file so the app never crashes on old data.
function normalize(raw, lang = 'en') {
  const base = defaultState(lang);
  if (!raw || typeof raw !== 'object') return base;
  const s = base;
  if (raw.tasks && typeof raw.tasks === 'object') {
    for (const [date, list] of Object.entries(raw.tasks)) {
      if (!isDateKey(date) || !Array.isArray(list)) continue;
      const clean = list.filter((t) => t && typeof t.text === 'string').map((t) => ({
        id: typeof t.id === 'string' ? t.id : newId(),
        text: t.text,
        done: !!t.done,
        createdAt: Number(t.createdAt) || Date.now(),
        timer: normalizeTimer(t.timer),
      }));
      if (clean.length) s.tasks[date] = clean;
    }
  }
  if (Array.isArray(raw.quotes)) for (let i = 0; i < 7; i++) s.quotes[i] = typeof raw.quotes[i] === 'string' ? raw.quotes[i] : '';
  if (Array.isArray(raw.photos)) for (let i = 0; i < 4; i++) s.photos[i] = typeof raw.photos[i] === 'string' ? raw.photos[i] : null;
  if (raw.settings && typeof raw.settings === 'object') {
    const r = raw.settings;
    if (r.lang === 'ar' || r.lang === 'en') s.settings.lang = r.lang;
    if (typeof r.theme === 'string') s.settings.theme = r.theme;
    if (typeof r.sound === 'string') s.settings.sound = r.sound;
    if (typeof r.soundName === 'string') s.settings.soundName = r.soundName;
    s.settings.openWidgetAtLogin = !!r.openWidgetAtLogin;
  }
  if (raw.widget && typeof raw.widget === 'object') {
    s.widget.open = !!raw.widget.open;
    s.widget.pinned = raw.widget.pinned !== false;
    const b = raw.widget.bounds;
    if (b && [b.x, b.y, b.width, b.height].every(Number.isFinite)) s.widget.bounds = { x: b.x, y: b.y, width: b.width, height: b.height };
  }
  return s;
}

function normalizeTimer(t) {
  if (!t || typeof t !== 'object') return null;
  const duration = clampSeconds(t.duration);
  if (!duration) return null;
  const running = !!t.running && Number.isFinite(t.endsAt);
  return {
    duration,
    remaining: Math.min(duration, Math.max(0, Math.round(Number(t.remaining) || 0))),
    running,
    endsAt: running ? t.endsAt : null,
  };
}

function clampSeconds(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, MAX_TIMER);
}

function isDateKey(k) {
  return typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
}

function newId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

function findTask(state, date, id) {
  const list = state.tasks[date];
  if (!list) return null;
  return list.find((t) => t.id === id) || null;
}

function remainingOf(timer, now) {
  if (!timer) return 0;
  if (timer.running) return Math.max(0, Math.ceil((timer.endsAt - now) / 1000));
  return timer.remaining;
}

// Every change goes through here. Returns true if state changed.
const ops = {
  addTask(state, date, text, seconds) {
    if (!isDateKey(date)) return false;
    text = String(text || '').trim();
    if (!text) return false;
    const duration = clampSeconds(seconds);
    const task = {
      id: newId(), text, done: false, createdAt: Date.now(),
      timer: duration ? { duration, remaining: duration, running: false, endsAt: null } : null,
    };
    (state.tasks[date] = state.tasks[date] || []).push(task);
    return true;
  },
  editTask(state, date, id, text) {
    const t = findTask(state, date, id);
    text = String(text || '').trim();
    if (!t || !text) return false;
    t.text = text;
    return true;
  },
  deleteTask(state, date, id) {
    const list = state.tasks[date];
    if (!list) return false;
    const i = list.findIndex((t) => t.id === id);
    if (i < 0) return false;
    list.splice(i, 1);
    if (!list.length) delete state.tasks[date];
    return true;
  },
  setDone(state, date, id, done) {
    const t = findTask(state, date, id);
    if (!t) return false;
    t.done = !!done;
    if (t.done && t.timer && t.timer.running) ops.pauseTimer(state, date, id);
    return true;
  },
  setTimer(state, date, id, seconds) {
    const t = findTask(state, date, id);
    if (!t) return false;
    const duration = clampSeconds(seconds);
    t.timer = duration ? { duration, remaining: duration, running: false, endsAt: null } : null;
    return true;
  },
  startTimer(state, date, id, now = Date.now()) {
    const t = findTask(state, date, id);
    if (!t || !t.timer || t.timer.running) return false;
    if (t.timer.remaining <= 0) t.timer.remaining = t.timer.duration;
    t.timer.running = true;
    t.timer.endsAt = now + t.timer.remaining * 1000;
    return true;
  },
  pauseTimer(state, date, id, now = Date.now()) {
    const t = findTask(state, date, id);
    if (!t || !t.timer || !t.timer.running) return false;
    t.timer.remaining = remainingOf(t.timer, now);
    t.timer.running = false;
    t.timer.endsAt = null;
    return true;
  },
  resetTimer(state, date, id) {
    const t = findTask(state, date, id);
    if (!t || !t.timer) return false;
    t.timer.running = false;
    t.timer.endsAt = null;
    t.timer.remaining = t.timer.duration;
    return true;
  },
  setQuote(state, index, text) {
    index = Number(index);
    if (!(index >= 0 && index < 7)) return false;
    state.quotes[index] = String(text || '').slice(0, 300);
    return true;
  },
  setLang(state, lang) {
    if (lang !== 'ar' && lang !== 'en') return false;
    state.settings.lang = lang;
    return true;
  },
  setTheme(state, theme) {
    if (typeof theme !== 'string' || !theme) return false;
    state.settings.theme = theme;
    return true;
  },
};

// Finds running timers that have reached zero, stops them and returns them.
function collectFinished(state, now = Date.now()) {
  const done = [];
  for (const [date, list] of Object.entries(state.tasks)) {
    for (const t of list) {
      if (t.timer && t.timer.running && t.timer.endsAt <= now) {
        t.timer.running = false;
        t.timer.endsAt = null;
        t.timer.remaining = 0;
        done.push({ date, id: t.id, text: t.text });
      }
    }
  }
  return done;
}

function hasRunningTimers(state) {
  for (const list of Object.values(state.tasks)) for (const t of list) if (t.timer && t.timer.running) return true;
  return false;
}

module.exports = { defaultState, normalize, ops, collectFinished, hasRunningTimers, remainingOf, isDateKey, MAX_TIMER };
