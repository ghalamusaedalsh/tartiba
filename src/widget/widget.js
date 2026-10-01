(function () {
  'use strict';
  const T = window.T;
  const api = window.tartiba;
  const D = T.dates;
  const h = T.h;
  const $ = (id) => document.getElementById(id);

  let S = api.getState();
  let today = D.todayKey();

  const CHECK = '<svg viewBox="0 0 24 24"><path d="M4.5 12.5l4.8 4.8L19.5 6.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function render() {
    T.setLang(S.settings.lang);
    T.applyTheme(S.settings.theme);
    const lang = T.lang;
    $('w-title').textContent = T.t('todayTasks');
    const d = D.parse(today);
    const hj = D.hijri(d);
    $('w-date').textContent = D.WEEKDAYS[lang][d.getDay()] + ' ' + d.getDate() + ' ' + D.GREG[lang][d.getMonth()] + ' · ' + hj.day + ' ' + D.hijriMonthName(hj.month, lang);

    const pin = $('w-pin');
    pin.innerHTML = S.widget.pinned ? T.icons.pin : T.icons.pinOff;
    pin.classList.toggle('on', !!S.widget.pinned);
    pin.title = S.widget.pinned ? T.t('pinOn') : T.t('pinOff');
    $('w-open').innerHTML = T.icons.open;
    $('w-open').title = T.t('openApp');
    $('w-close').innerHTML = T.icons.close;
    $('w-close').title = T.t('close');

    const list = $('w-list');
    const scroll = list.scrollTop;
    list.innerHTML = '';
    const tasks = S.tasks[today] || [];
    if (!tasks.length) {
      list.append(h('div', { class: 'w-empty' }, h('div', {}, T.t('noTasksToday'), h('small', { text: T.t('addFromApp') }))));
      return;
    }
    for (const t of tasks) {
      const row = h('div', { class: 'w-task' + (t.done ? ' done' : '') });
      const box = h('button', { class: 'w-box', title: t.text, onclick: () => api.op('setDone', today, t.id, !t.done) });
      if (t.done) box.innerHTML = CHECK;
      row.append(box, h('div', { class: 'w-name', dir: 'auto', text: t.text, title: t.text }));
      if (t.timer) {
        const rem = T.remaining(t.timer);
        row.append(h('div', { class: 'w-timer' },
          h('span', {
            class: 'lcd' + (!t.timer.running && rem === 0 ? ' finished' : ''), text: T.fmtTime(rem),
            'data-run': t.timer.running ? '1' : '0', 'data-ends': t.timer.running ? t.timer.endsAt : '',
          }),
          h('button', {
            class: 'w-play', title: t.timer.running ? T.t('pause') : T.t('start'),
            html: t.timer.running ? T.icons.pause : T.icons.play,
            onclick: () => api.op(t.timer.running ? 'pauseTimer' : 'startTimer', today, t.id),
          })));
      } else {
        row.append(h('span'));
      }
      list.append(row);
    }
    list.scrollTop = scroll;
  }

  setInterval(() => {
    const now = Date.now();
    document.querySelectorAll('.lcd[data-run="1"]').forEach((el) => {
      el.textContent = T.fmtTime(Math.max(0, Math.ceil((Number(el.dataset.ends) - now) / 1000)));
    });
    const k = D.todayKey();
    if (k !== today) { today = k; render(); }
  }, 250);

  $('w-pin').addEventListener('click', () => api.op('setPinned', !S.widget.pinned));
  $('w-open').addEventListener('click', () => api.op('showDay', today));
  $('w-close').addEventListener('click', () => api.op('closeWidget'));

  api.onState((s) => { S = s; render(); });
  api.onAlarm((f) => T.ringAlarm(S.soundUrl, f.text));

  render();
})();
