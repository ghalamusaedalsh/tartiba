(function () {
  'use strict';
  const T = window.T;
  const api = window.tartiba;
  const D = T.dates;
  const h = T.h;
  const $ = (id) => document.getElementById(id);

  let S = api.getState();
  let view = 'calendar';
  let current = D.todayKey(); // day shown on the tasks screen
  let viewY; let viewM; // month shown on the calendar
  let editing = false; // a task name is being edited
  let pending = false; // state arrived while editing
  let addTimerSec = 0; // timer for the next task being added
  let lastToday = D.todayKey();
  let settingsOpen = null; // refresh function while the settings panel is open

  const SLOTS = [[444.3, 348.9], [457.7, 522.9], [471.1, 696.9], [484.5, 870.9]];

  { const t = new Date(); viewY = t.getFullYear(); viewM = t.getMonth(); }

  // ---------- scale the 1920x1080 design to the window ----------
  const stage = $('stage');
  const viewport = $('viewport');
  function fit() {
    const w = window.innerWidth; const ht = window.innerHeight;
    const s = Math.min(w / 1920, ht / 1080);
    const ox = (w - 1920 * s) / 2; const oy = (ht - 1080 * s) / 2;
    stage.style.transform = `translate(${ox}px, ${oy}px) scale(${s})`;
    document.documentElement.style.setProperty('--scale', s);
    viewport.style.backgroundPosition = `${ox}px ${oy - 36 * s}px`;
  }
  window.addEventListener('resize', fit);

  // ---------- small helpers ----------
  function rng(seed) {
    let x = 2166136261;
    for (const c of seed) x = Math.imul(x ^ c.charCodeAt(0), 16777619);
    return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 100000) / 100000; };
  }

  // hand-drawn pencil loop around a date
  function pencilSvg(seed) {
    const r = rng(seed);
    const cx = 48; const cy = 36; const rx = 35 + r() * 4; const ry = 25 + r() * 3;
    const start = r() * Math.PI * 2; const sweep = Math.PI * 2 * (1.1 + r() * 0.08); const tilt = (r() - 0.5) * 0.3;
    const pts = [];
    const n = 36;
    for (let i = 0; i <= n; i++) {
      const t = start + (sweep * i) / n;
      const wob = 1 + 0.04 * Math.sin(t * 3 + 1.7) + (i / n) * 0.09;
      const x = Math.cos(t) * rx * wob; const y = Math.sin(t) * ry * wob;
      pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
    }
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2; const my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    return `<svg class="pencil" viewBox="0 0 96 72"><path d="${d}" fill="none" stroke="#3f3f3f" stroke-width="2.6" stroke-linecap="round" opacity=".82"/><path d="${d}" transform="translate(1 .7)" fill="none" stroke="#7a7a7a" stroke-width="1.2" stroke-linecap="round" opacity=".5"/></svg>`;
  }

  const CHECK_SMALL = '<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const CHECK_BIG = '<svg viewBox="0 0 70 70"><path d="M12 37 L28 53 L58 16" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function tasksOf(k) { return S.tasks[k] || []; }

  // ---------- everything ----------
  function renderAll() {
    T.setLang(S.settings.lang);
    T.applyTheme(S.settings.theme);
    document.title = T.lang === 'ar' ? 'ترتيبة — Tartiba' : 'Tartiba · ترتيبة';
    renderToolbar();
    renderPhotos();
    renderQuote();
    renderCalendar();
    if (view === 'tasks') renderTasks();
    renderAddBar();
    if (settingsOpen) settingsOpen();
  }

  function renderToolbar() {
    const tool = (el, icon, label) => { el.innerHTML = ''; el.append(h('span', { html: T.icons[icon] }), h('span', { text: label })); };
    const back = $('back-btn');
    back.hidden = view !== 'tasks';
    tool(back, 'calendar', T.t('calendar'));
    tool($('widget-btn'), 'widget', T.t('widget'));
    $('widget-btn').classList.toggle('on', !!S.widget.open);
    $('widget-btn').title = S.widget.open ? T.t('hideWidget') : T.t('showWidget');
    tool($('settings-btn'), 'gear', T.t('settings'));
    tool($('lang-btn'), 'globe', T.t('otherLang'));
  }

  // ---------- photos ----------
  function renderPhotos() {
    const layer = $('photo-layer'); const hits = $('photo-hits');
    layer.innerHTML = ''; hits.innerHTML = '';
    SLOTS.forEach(([x, y], i) => {
      const url = S.photoUrls[i];
      layer.append(h('div', { class: 'slot-photo', style: { left: x + 'px', top: y + 'px' } },
        url ? h('img', { src: url, alt: '', draggable: 'false' })
          : h('div', { class: 'empty' }, h('span', { html: T.icons.camera }), h('span', { text: T.t('addPhoto') }))));
      const hit = h('button', {
        class: 'slot-hit', style: { left: x + 'px', top: y + 'px' }, title: url ? T.t('changePhoto') : T.t('addPhoto'),
        onclick: () => api.op('pickPhoto', i),
      });
      if (url) {
        hit.append(
          h('span', { class: 'mini', text: T.t('changePhoto') }),
          h('span', { class: 'mini danger', text: T.t('removePhoto'), onclick: (e) => { e.stopPropagation(); api.op('removePhoto', i); } }));
      }
      hits.append(hit);
    });
  }

  // ---------- daily quote ----------
  function renderQuote() {
    const q = (S.quotes[new Date().getDay()] || '').trim();
    const btn = $('quote'); const span = $('quote-text');
    btn.classList.toggle('placeholder', !q);
    span.textContent = q || T.t('pickQuote');
    btn.title = T.t('quotes');
    // shrink the text until it fits inside the cloud
    let size = q ? 42 : 46;
    span.style.fontSize = size + 'px';
    const maxH = btn.clientHeight - 12; const maxW = btn.clientWidth - 16;
    while (size > 15 && (span.scrollHeight > maxH || span.scrollWidth > maxW)) {
      size -= 1;
      span.style.fontSize = size + 'px';
    }
  }

  // ---------- calendar ----------
  function renderCalendar() {
    const lang = T.lang;
    const ms = $('month-select');
    ms.innerHTML = '';
    D.GREG[lang].forEach((name, i) => ms.append(h('option', { value: i, text: name, selected: i === viewM })));
    ms.value = viewM;
    const ys = $('year-select');
    ys.innerHTML = '';
    const nowY = new Date().getFullYear();
    for (let y = Math.min(nowY - 60, viewY); y <= Math.max(nowY + 60, viewY); y++) ys.append(h('option', { value: y, text: y }));
    ys.value = viewY;
    $('hijri-range').textContent = D.hijriRange(viewY, viewM, lang);
    const tb = $('today-btn');
    tb.textContent = T.t('today');
    const t = new Date();
    tb.style.visibility = (t.getFullYear() === viewY && t.getMonth() === viewM) ? 'hidden' : 'visible';

    const wd = $('weekdays');
    wd.innerHTML = '';
    D.WEEKDAYS[lang].forEach((n, i) => wd.append(h('span', { class: i >= 5 ? 'we' : '', text: n })));

    const { cells, rows } = D.monthCells(viewY, viewM);
    const grid = $('grid');
    grid.innerHTML = '';
    grid.className = 'grid rows-' + rows;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    grid.style.setProperty('--num', rows >= 6 ? '34px' : '40px');
    const todayK = D.todayKey();
    cells.forEach((c, idx) => {
      const list = tasksOf(c.key);
      const unfinished = list.some((x) => !x.done);
      const allDone = list.length > 0 && !unfinished;
      const hj = D.hijri(c.date);
      const firstLabel = hj.day === 1 || idx === 0;
      const cls = ['day'];
      if (!c.inMonth) cls.push('out');
      if (c.weekday >= 5) cls.push('we');
      if (c.key === todayK) cls.push('today');
      const btn = h('button', { class: cls.join(' '), onclick: () => openDay(c.key), title: D.longGregorian(c.key, lang) + '\n' + D.longHijri(c.key, lang) },
        allDone ? h('span', { class: 'check', html: CHECK_SMALL }) : null,
        h('span', { class: 'num', text: c.date.getDate() }),
        h('span', { class: 'hij' + (firstLabel ? ' first' : ''), text: firstLabel ? hj.day + ' ' + D.hijriMonthName(hj.month, lang) : hj.day }));
      if (unfinished) btn.insertAdjacentHTML('beforeend', pencilSvg(c.key));
      grid.append(btn);
    });
  }

  $('month-select').addEventListener('change', (e) => { viewM = Number(e.target.value); renderCalendar(); });
  $('year-select').addEventListener('change', (e) => { viewY = Number(e.target.value); renderCalendar(); });
  $('today-btn').addEventListener('click', () => { const t = new Date(); viewY = t.getFullYear(); viewM = t.getMonth(); renderCalendar(); });

  // ---------- tasks ----------
  function openDay(k) {
    current = k;
    const d = D.parse(k);
    viewY = d.getFullYear(); viewM = d.getMonth();
    view = 'tasks';
    $('cal-screen').hidden = true;
    $('tasks-screen').hidden = false;
    renderToolbar();
    renderTasks();
    renderAddBar();
    setTimeout(() => $('add-input').focus(), 30);
  }

  function showCalendar() {
    view = 'calendar';
    $('tasks-screen').hidden = true;
    $('cal-screen').hidden = false;
    renderToolbar();
    renderCalendar();
    renderQuote();
  }

  function renderTasks() {
    const lang = T.lang;
    $('tag-text').textContent = T.t('tasks');
    $('day-greg').textContent = D.longGregorian(current, lang);
    $('day-hijri').textContent = D.longHijri(current, lang);
    const listEl = $('task-list');
    const scroll = listEl.scrollTop;
    listEl.innerHTML = '';
    const list = tasksOf(current);
    if (!list.length) {
      listEl.append(h('div', { class: 'empty-tasks', text: T.t('noTasks') }));
      return;
    }
    for (const t of list) listEl.append(taskRow(t));
    listEl.scrollTop = scroll;
  }

  function taskRow(t) {
    const date = current;
    const row = h('div', { class: 'task' + (t.done ? ' done' : ''), 'data-id': t.id });
    const box = h('button', { class: 'box', title: t.done ? '✓' : '', 'aria-pressed': String(!!t.done), onclick: () => api.op('setDone', date, t.id, !t.done) });
    if (t.done) box.innerHTML = CHECK_BIG;
    const name = h('div', { class: 'task-name', dir: 'auto', text: t.text, title: t.text + '\n(' + T.t('doubleClickEdit') + ')', ondblclick: () => startEdit(row, name, t) });

    const timerArea = h('div', { class: 'timer-area' });
    if (t.timer) {
      const rem = T.remaining(t.timer);
      const lcd = h('span', {
        class: 'lcd' + (!t.timer.running && rem === 0 ? ' finished' : ''), text: T.fmtTime(rem),
        'data-run': t.timer.running ? '1' : '0', 'data-ends': t.timer.running ? t.timer.endsAt : '',
        title: T.t('setTimer'),
        onclick: () => { if (!t.timer.running) openTimerPop(t.timer.duration, (sec) => api.op('setTimer', date, t.id, sec), () => api.op('setTimer', date, t.id, 0)); },
      });
      const play = h('button', {
        class: 'round', title: t.timer.running ? T.t('pause') : T.t('start'),
        html: t.timer.running ? T.icons.pause : T.icons.play,
        onclick: () => api.op(t.timer.running ? 'pauseTimer' : 'startTimer', date, t.id),
      });
      const reset = h('button', { class: 'round ghost', title: T.t('reset'), html: T.icons.reset, onclick: () => api.op('resetTimer', date, t.id) });
      timerArea.append(lcd, play, reset);
    } else {
      timerArea.append(h('button', {
        class: 'add-timer', onclick: () => openTimerPop(0, (sec) => api.op('setTimer', date, t.id, sec)),
      }, h('span', { html: T.icons.timer }), h('span', { text: T.t('addTimer') })));
    }
    const actions = h('div', { class: 'task-actions' },
      h('button', { class: 'round ghost danger', title: T.t('delete'), html: T.icons.trash, onclick: () => confirmDelete(date, t) }));
    row.append(box, name, timerArea, actions);
    return row;
  }

  function startEdit(row, nameEl, t) {
    if (editing) return;
    editing = true;
    const input = h('input', { class: 'task-name-input', dir: 'auto', value: t.text, maxlength: '200' });
    nameEl.replaceWith(input);
    input.focus();
    input.select();
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      editing = false;
      const v = input.value.trim();
      if (save && v && v !== t.text) api.op('editTask', current, t.id, v);
      else { renderTasks(); }
      if (pending) { pending = false; renderAll(); }
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') { e.stopPropagation(); finish(false); }
    });
    input.addEventListener('blur', () => finish(true));
  }

  // live countdown
  setInterval(() => {
    const now = Date.now();
    document.querySelectorAll('.lcd[data-run="1"]').forEach((el) => {
      el.textContent = T.fmtTime(Math.max(0, Math.ceil((Number(el.dataset.ends) - now) / 1000)));
    });
    const k = D.todayKey();
    if (k !== lastToday) { lastToday = k; renderAll(); }
  }, 250);

  // ---------- add task ----------
  function renderAddBar() {
    $('add-input').placeholder = T.t('addTaskPlaceholder');
    $('add-btn').textContent = T.t('add');
    const tbtn = $('add-timer-btn');
    tbtn.innerHTML = '';
    tbtn.append(h('span', { html: T.icons.timer }));
    if (addTimerSec) tbtn.append(h('span', { class: 'lcd', text: T.fmtTime(addTimerSec) }));
    else tbtn.append(h('span', { text: T.t('noTimer') }));
    tbtn.title = T.t('setTimer');
  }

  $('add-timer-btn').addEventListener('click', () => {
    openTimerPop(addTimerSec, (sec) => { addTimerSec = sec; renderAddBar(); }, addTimerSec ? () => { addTimerSec = 0; renderAddBar(); } : null);
  });

  $('add-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('add-input');
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    api.op('addTask', current, text, addTimerSec);
    input.value = '';
    addTimerSec = 0;
    renderAddBar();
    input.focus();
    setTimeout(() => { const l = $('task-list'); l.scrollTop = l.scrollHeight; }, 60);
  });

  // ---------- popovers ----------
  function modal(panel, { clear = false, onClose } = {}) {
    const root = $('modal-root');
    const bd = h('div', { class: 'backdrop' + (clear ? ' clear' : '') });
    const close = () => { bd.remove(); document.removeEventListener('keydown', esc, true); if (onClose) onClose(); };
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    bd.addEventListener('mousedown', (e) => { if (e.target === bd) close(); });
    document.addEventListener('keydown', esc, true);
    bd.append(panel);
    root.append(bd);
    return close;
  }

  function openTimerPop(seconds, onSave, onRemove) {
    const hh = Math.floor(seconds / 3600); const mm = Math.floor((seconds % 3600) / 60); const ss = seconds % 60;
    const field = (val, max, label) => h('label', {}, h('input', { type: 'number', min: 0, max, value: String(val).padStart(2, '0') }), h('span', { text: label }));
    const fH = field(hh, 99, T.t('hours')); const fM = field(mm, 59, T.t('minutes')); const fS = field(ss, 59, T.t('seconds'));
    const inputs = [fH, fM, fS].map((f) => f.querySelector('input'));
    inputs.forEach((inp) => {
      inp.addEventListener('focus', () => inp.select());
      inp.addEventListener('blur', () => { const v = Math.max(0, Math.min(Number(inp.max), Math.floor(Number(inp.value) || 0))); inp.value = String(v).padStart(2, '0'); });
    });
    const total = () => {
      const [a, b, c] = inputs.map((i) => Math.max(0, Math.floor(Number(i.value) || 0)));
      return Math.min(a, 99) * 3600 + Math.min(b, 59) * 60 + Math.min(c, 59);
    };
    const setTotal = (sec) => {
      inputs[0].value = String(Math.floor(sec / 3600)).padStart(2, '0');
      inputs[1].value = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
      inputs[2].value = String(sec % 60).padStart(2, '0');
    };
    const presets = h('div', { class: 'presets' },
      [5, 10, 15, 25, 30, 45, 60, 90].map((m) => h('button', {
        type: 'button', text: m < 60 ? `${m} ${T.t('minutes')}` : `${m / 60} ${T.t('hours')}`.replace('1.5', '1:30'), onclick: () => setTotal(m * 60),
      })));
    let close;
    const save = () => { const v = total(); if (v > 0) onSave(v); else if (onRemove) onRemove(); close(); };
    const panel = h('div', { class: 'panel timer-pop' },
      h('h2', { text: T.t('setTimer') }),
      h('div', { class: 'hms' }, fH, h('span', { class: 'colon', text: ':' }), fM, h('span', { class: 'colon', text: ':' }), fS),
      presets,
      h('div', { class: 'row end' },
        onRemove ? h('button', { class: 'btn', text: T.t('removeTimer'), onclick: () => { onRemove(); close(); } }) : null,
        h('button', { class: 'btn', text: T.t('cancel'), onclick: () => close() }),
        h('button', { class: 'btn primary', text: T.t('save'), onclick: save })));
    panel.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } });
    close = modal(panel);
    setTimeout(() => inputs[1].focus(), 20);
  }

  function confirmDelete(date, t) {
    let close;
    const panel = h('div', { class: 'panel confirm' },
      h('p', { text: T.t('confirmDelete') }),
      h('div', { class: 'what', dir: 'auto', text: t.text }),
      h('div', { class: 'row end' },
        h('button', { class: 'btn', text: T.t('cancel'), onclick: () => close() }),
        h('button', { class: 'btn danger', text: T.t('yesDelete'), onclick: () => { api.op('deleteTask', date, t.id); close(); } })));
    close = modal(panel);
  }

  // ---------- settings ----------
  function openSettings(focusQuotes) {
    if (settingsOpen) return;
    const panel = h('div', { class: 'panel settings' });
    let quoteTimers = {};
    const build = () => {
      panel.innerHTML = '';
      const lang = T.lang;
      panel.append(
        h('button', { class: 'round ghost x', title: T.t('close'), html: T.icons.close, onclick: () => close() }),
        h('h2', { text: T.t('settings') }));

      // language
      panel.append(h('h3', { text: T.t('language') }),
        h('div', { class: 'seg' },
          h('button', { class: S.settings.lang === 'ar' ? 'on' : '', text: 'العربية', onclick: () => api.op('setLang', 'ar') }),
          h('button', { class: S.settings.lang === 'en' ? 'on' : '', text: 'English', onclick: () => api.op('setLang', 'en') })));

      // themes
      panel.append(h('h3', { text: T.t('theme') }));
      for (const group of ['pastel', 'dark']) {
        panel.append(h('div', { class: 'hint', text: T.t(group === 'pastel' ? 'pastels' : 'darks') }));
        panel.append(h('div', { class: 'themes' }, T.THEMES.filter((t) => t.group === group).map((th) => h('button', {
          class: 'theme-card' + (S.settings.theme === th.id ? ' on' : ''), onclick: () => api.op('setTheme', th.id),
        }, h('span', { class: 'sw' }, th.swatch.map((c) => h('i', { style: { background: c } }))), h('span', { text: th.name[lang] })))));
      }

      // quotes
      const todayIdx = new Date().getDay();
      panel.append(h('h3', { id: 'quotes-h', text: T.t('quotes') }), h('div', { class: 'hint', text: T.t('quotesHint') }));
      const qg = h('div', { class: 'quotes-grid' });
      D.WEEKDAYS[lang].forEach((day, i) => {
        const inp = h('input', { dir: 'auto', value: S.quotes[i] || '', placeholder: T.t('quotePlaceholder'), maxlength: '300', 'data-q': i });
        inp.addEventListener('input', () => {
          clearTimeout(quoteTimers[i]);
          quoteTimers[i] = setTimeout(() => api.op('setQuote', i, inp.value), 350);
        });
        qg.append(h('label', { class: i === todayIdx ? 'today' : '', text: day }), inp);
      });
      panel.append(qg);

      // sound
      panel.append(h('h3', { text: T.t('timerSound') }), h('div', { class: 'hint', text: T.t('soundHint') }));
      const soundRow = h('div', { class: 'row' });
      panel.append(soundRow);

      // widget
      panel.append(h('h3', { text: T.t('widgetSection') }));
      const loginCb = h('input', { type: 'checkbox' });
      loginCb.checked = !!S.settings.openWidgetAtLogin;
      loginCb.addEventListener('change', () => api.op('setOpenWidgetAtLogin', loginCb.checked));
      const widgetRow = h('div', { class: 'row' });
      // the Microsoft Store version cannot start with Windows, so the option is left out there
      if (S.canOpenAtLogin !== false) panel.append(h('label', { class: 'check-row' }, loginCb, h('span', { text: T.t('openAtLogin') })), h('div', { style: { height: '12px' } }));
      panel.append(widgetRow);

      const refreshDynamic = () => {
        soundRow.innerHTML = '';
        soundRow.append(
          h('span', { class: 'sound-name', text: '🔔 ' + (S.isDefaultSound ? T.t('defaultSound') : (S.settings.soundName || '')) }),
          h('button', { class: 'btn', text: '▶ ' + T.t('test'), onclick: (e) => {
            const btn = e.currentTarget;
            const a = T.playSound(S.soundUrl, false);
            btn.textContent = '■ ' + T.t('stop');
            btn.onclick = () => { T.stopAlarm(); refreshDynamic(); };
            a.addEventListener('ended', () => refreshDynamic());
          } }),
          h('button', { class: 'btn primary', text: T.t('changeSound'), onclick: () => api.op('pickSound') }));
        if (!S.isDefaultSound) soundRow.append(h('button', { class: 'btn', text: T.t('useDefault'), onclick: () => api.op('resetSound') }));
        widgetRow.innerHTML = '';
        widgetRow.append(h('button', { class: 'btn', text: S.widget.open ? T.t('hideWidget') : T.t('showWidget'), onclick: () => api.op('toggleWidget') }));
        loginCb.checked = !!S.settings.openWidgetAtLogin;
        panel.querySelectorAll('.theme-card').forEach((el, i) => el.classList.toggle('on', T.THEMES.filter((t) => t.group === 'pastel').concat(T.THEMES.filter((t) => t.group === 'dark'))[i].id === S.settings.theme));
      };
      refreshDynamic();
      return refreshDynamic;
    };

    let builtLang = T.lang;
    let refresh = build();
    settingsOpen = () => {
      if (T.lang !== builtLang) { builtLang = T.lang; refresh = build(); } else refresh();
    };
    const close = modal(panel, { onClose: () => { settingsOpen = null; T.stopAlarm(); } });
    if (focusQuotes) {
      setTimeout(() => {
        const inp = panel.querySelector(`[data-q="${new Date().getDay()}"]`);
        if (inp) { inp.scrollIntoView({ block: 'center' }); inp.focus(); }
      }, 30);
    }
  }

  // ---------- toolbar & keys ----------
  $('back-btn').addEventListener('click', showCalendar);
  $('widget-btn').addEventListener('click', () => api.op('toggleWidget'));
  $('settings-btn').addEventListener('click', () => openSettings(false));
  $('lang-btn').addEventListener('click', () => api.op('setLang', S.settings.lang === 'ar' ? 'en' : 'ar'));
  $('quote').addEventListener('click', () => openSettings(true));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && view === 'tasks' && !editing && !$('modal-root').children.length) showCalendar();
  });

  // ---------- updates from the app ----------
  api.onState((s) => {
    S = s;
    if (editing) { pending = true; return; }
    renderAll();
  });
  api.onAlarm((f) => T.ringAlarm(S.soundUrl, f.text));
  api.onShowDay((k) => openDay(k || D.todayKey()));

  fit();
  renderAll();
  if (document.fonts) document.fonts.ready.then(() => renderQuote());
})();
