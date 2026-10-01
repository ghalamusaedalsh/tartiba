/* Shared helpers: timer text, alarm sound + banner, small DOM helpers. */
(function () {
  const T = (window.T = window.T || {});

  T.h = function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  };

  T.fmtTime = (sec) => {
    sec = Math.max(0, Math.ceil(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const p = (n) => String(n).padStart(2, '0');
    return p(h) + ':' + p(m) + ':' + p(s);
  };

  T.remaining = (timer, now = Date.now()) => {
    if (!timer) return 0;
    if (timer.running) return Math.max(0, Math.ceil((timer.endsAt - now) / 1000));
    return timer.remaining;
  };

  T.icons = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><rect x="6.5" y="5.5" width="4" height="13" rx="1.2" fill="currentColor"/><rect x="13.5" y="5.5" width="4" height="13" rx="1.2" fill="currentColor"/></svg>',
    reset: '<svg viewBox="0 0 24 24"><path d="M5 12a7 7 0 1 0 2.1-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M5 4.5V9h4.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    timer: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13.5" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 13.5V10M10 3.5h4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M9 3h6l-1 5 3 3v2h-4v6l-1 2-1-2v-6H7v-2l3-3z" fill="currentColor"/></svg>',
    pinOff: '<svg viewBox="0 0 24 24"><path d="M9 3h6l-1 5 3 3v2h-4v6l-1 2-1-2v-6H7v-2l3-3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="15" r="1.8" fill="currentColor"/></svg>',
    widget: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><rect x="6" y="8" width="3" height="3" rx=".7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 9.5h7M11 14.5h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="6" y="13" width="3" height="3" rx=".7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><path d="M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19.4 13.5l1.6 1.2-1.8 3.1-1.9-.7a7.5 7.5 0 0 1-2 1.2L15 20.3h-3.6l-.4-2a7.5 7.5 0 0 1-2-1.2l-1.9.7-1.8-3.1 1.6-1.2a7.7 7.7 0 0 1 0-2.3L5.3 10l1.8-3.1 1.9.7a7.5 7.5 0 0 1 2-1.2l.4-2h3.6l.4 2a7.5 7.5 0 0 1 2 1.2l1.9-.7 1.8 3.1-1.6 1.2a7.7 7.7 0 0 1 0 2.3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.3 3.8 8.5s-1.2 6.1-3.8 8.5M12 3.5C9.4 5.9 8.2 8.8 8.2 12s1.2 6.1 3.8 8.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    open: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-8.5 8.5M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12.5" r="3.4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15z" fill="currentColor"/><path d="M10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };

  // ---------- alarm ----------
  let audio = null;
  let stopTimer = null;
  let banner = null;

  T.stopAlarm = () => {
    if (audio) { audio.pause(); audio.src = ''; audio = null; }
    clearTimeout(stopTimer);
    if (banner) { banner.remove(); banner = null; }
  };

  T.playSound = (url, loop) => {
    T.stopAlarm();
    audio = new Audio(url);
    audio.loop = !!loop;
    audio.play().catch(() => {});
    stopTimer = setTimeout(T.stopAlarm, loop ? 60000 : 15000);
    return audio;
  };

  T.ringAlarm = (soundUrl, text) => {
    T.playSound(soundUrl, true);
    banner = T.h('div', { class: 'alarm-banner', role: 'alert' },
      T.h('span', { class: 'alarm-bell', html: T.icons.bell }),
      T.h('div', { class: 'alarm-text' }, T.h('b', { text: T.t('timesUp') }), T.h('span', { text: text })),
      T.h('button', { class: 'alarm-stop', text: T.t('stop'), onclick: T.stopAlarm }));
    document.body.append(banner);
  };
})();
