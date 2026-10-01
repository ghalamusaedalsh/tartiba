'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { defaultState, normalize, ops, collectFinished, remainingOf } = require('../src/store');

const D = '2026-10-01';

test('add, edit, complete and delete a task', () => {
  const s = defaultState();
  assert.ok(ops.addTask(s, D, '  Read a book  ', 0));
  assert.equal(s.tasks[D].length, 1);
  const t = s.tasks[D][0];
  assert.equal(t.text, 'Read a book');
  assert.equal(t.timer, null);
  assert.ok(ops.editTask(s, D, t.id, 'Read 20 pages'));
  assert.equal(t.text, 'Read 20 pages');
  assert.ok(ops.setDone(s, D, t.id, true));
  assert.equal(t.done, true);
  assert.ok(ops.deleteTask(s, D, t.id));
  assert.equal(s.tasks[D], undefined, 'empty days are removed');
});

test('empty task text is ignored', () => {
  const s = defaultState();
  assert.equal(ops.addTask(s, D, '   ', 0), false);
  assert.deepEqual(s.tasks, {});
});

test('tasks stay on their own day', () => {
  const s = defaultState();
  ops.addTask(s, '2026-10-01', 'a', 0);
  ops.addTask(s, '2026-10-02', 'b', 0);
  assert.equal(s.tasks['2026-10-01'][0].text, 'a');
  assert.equal(s.tasks['2026-10-02'][0].text, 'b');
});

test('timer start, pause, resume, finish and reset', () => {
  const s = defaultState();
  ops.addTask(s, D, 'Study', 60);
  const t = s.tasks[D][0];
  assert.deepEqual(t.timer, { duration: 60, remaining: 60, running: false, endsAt: null });
  ops.startTimer(s, D, t.id, 1000);
  assert.equal(t.timer.running, true);
  assert.equal(t.timer.endsAt, 61000);
  ops.pauseTimer(s, D, t.id, 21000); // 20 s later
  assert.equal(t.timer.remaining, 40);
  assert.equal(t.timer.running, false);
  ops.startTimer(s, D, t.id, 100000);
  assert.equal(remainingOf(t.timer, 110000), 30);
  assert.deepEqual(collectFinished(s, 139000), []);
  const fin = collectFinished(s, 140000);
  assert.equal(fin.length, 1);
  assert.equal(fin[0].text, 'Study');
  assert.equal(t.timer.remaining, 0);
  assert.equal(t.timer.running, false);
  ops.resetTimer(s, D, t.id);
  assert.equal(t.timer.remaining, 60);
  // starting a finished timer restarts it from the full duration
  t.timer.remaining = 0;
  ops.startTimer(s, D, t.id, 0);
  assert.equal(t.timer.endsAt, 60000);
});

test('ticking a task done pauses its timer', () => {
  const s = defaultState();
  ops.addTask(s, D, 'x', 100);
  const t = s.tasks[D][0];
  ops.startTimer(s, D, t.id, 0);
  ops.setDone(s, D, t.id, true);
  assert.equal(t.timer.running, false);
});

test('set and remove a timer on an existing task', () => {
  const s = defaultState();
  ops.addTask(s, D, 'x', 0);
  const t = s.tasks[D][0];
  ops.setTimer(s, D, t.id, 90);
  assert.equal(t.timer.duration, 90);
  ops.setTimer(s, D, t.id, 0);
  assert.equal(t.timer, null);
});

test('quotes: seven, one per weekday', () => {
  const s = defaultState();
  assert.ok(ops.setQuote(s, 4, 'Keep going'));
  assert.equal(s.quotes[4], 'Keep going');
  assert.equal(ops.setQuote(s, 7, 'nope'), false);
  assert.equal(s.quotes.length, 7);
});

test('normalize repairs broken or old data without losing tasks', () => {
  const s = normalize({
    tasks: { '2026-10-01': [{ text: 'kept', done: 1 }, null, { nope: true }], bad: [{ text: 'x' }] },
    quotes: ['a'],
    settings: { lang: 'ar', theme: 'navy' },
    widget: { pinned: false, bounds: { x: 1, y: 2, width: 3, height: 4 } },
  });
  assert.equal(s.tasks['2026-10-01'].length, 1);
  assert.equal(s.tasks['2026-10-01'][0].done, true);
  assert.equal(s.tasks.bad, undefined);
  assert.equal(s.quotes.length, 7);
  assert.equal(s.settings.lang, 'ar');
  assert.equal(s.widget.pinned, false);
  assert.deepEqual(normalize(null).tasks, {});
});
