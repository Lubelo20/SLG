import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../api/draw.js';
import { createLocalRepository } from '../lib/local-database.js';

const env = { ADMIN_PASSWORD: 'test-dashboard-password', SESSION_SECRET: 'test-signing-secret-with-at-least-32-chars' };
const booking = { organisation: 'Attendance club', bookings: 2, groups: [{ tee: '1', players: ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', ''] }, { tee: '2', players: ['Linus Torvalds', '', '', ''] }] };
const groupsWith = (first, second = booking.groups[1].players) => [{ tee: '1', players: first }, { tee: '2', players: second }];

async function setup(wrap = db => db) {
  const db = createLocalRepository(':memory:');
  const handler = createHandler(() => wrap(db), { configured: true, env });
  async function call(method, body, query = '', cookie = '') {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; } };
    await handler({ method, url: '/api/draw' + query, body, headers: { host: 'localhost', origin: 'http://localhost', cookie } }, res);
    return res;
  }
  const cookie = (await call('POST', { password: env.ADMIN_PASSWORD }, '?action=login')).headers['Set-Cookie'].split(';')[0];
  const entry = (await call('POST', booking, '', cookie)).data;
  const edit = groups => call('PUT', { organisation: booking.organisation, bookings: groups.length, groups, updated_at: entry.updated_at }, '?id=' + entry.id, cookie);
  return { db, entry, edit };
}
const marks = res => res.data.groups.map(g => g.attended || [false, false, false, false]);
const none = [false, false, false, false];

test('replacing a ticked golfer does not mark the new golfer as arrived', async () => {
  const { db, entry, edit } = await setup();
  try {
    await db.attend(entry.id, 0, 1, true);
    const res = await edit(groupsWith(['Ada Lovelace', 'Bob Smith', 'Alan Turing', '']));
    assert.equal(res.code, 200);
    assert.deepEqual(marks(res), [none, none]);
  } finally { db.close(); }
});

test('a ticked golfer moved to another slot or group keeps the tick', async () => {
  const { db, entry, edit } = await setup();
  try {
    await db.attend(entry.id, 0, 1, true);
    const res = await edit(groupsWith(['Ada Lovelace', '', 'Alan Turing', ''], ['Linus Torvalds', 'Grace Hopper', '', '']));
    assert.deepEqual(marks(res), [none, [false, true, false, false]]);
  } finally { db.close(); }
});

test('a corrected spelling keeps the tick', async () => {
  const { db, entry, edit } = await setup();
  try {
    await db.attend(entry.id, 0, 1, true);
    const res = await edit(groupsWith(['Ada Lovelace', 'Grace B. Hopper', 'Alan Turing', '']));
    assert.deepEqual(marks(res), [[false, true, false, false], none]);
  } finally { db.close(); }
});

test('naming a ticked "name pending" slot keeps the tick', async () => {
  const { db, entry, edit } = await setup();
  try {
    await db.attend(entry.id, 0, 3, true);
    const res = await edit(groupsWith(['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Ken Thompson']));
    assert.deepEqual(marks(res), [[false, false, false, true], none]);
  } finally { db.close(); }
});

test('removing a ticked golfer clears the tick', async () => {
  const { db, entry, edit } = await setup();
  try {
    await db.attend(entry.id, 0, 1, true);
    const res = await edit(groupsWith(['Ada Lovelace', '', 'Alan Turing', '']));
    assert.deepEqual(marks(res), [none, none]);
  } finally { db.close(); }
});

test('a tick made while an edit is being saved is not lost', async () => {
  let raced = false, target;
  const { db, entry, edit } = await setup(db => ({
    list: () => db.list(), attend: (...a) => db.attend(...a),
    async save(...args) {
      if (target && !raced) { raced = true; await db.attend(target, 0, 0, true); }
      return db.save(...args);
    }
  }));
  try {
    target = entry.id;
    const res = await edit(groupsWith(['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Ken Thompson']));
    assert.equal(res.code, 200);
    assert.equal(raced, true);
    assert.deepEqual(marks(res), [[true, false, false, false], none]);
  } finally { db.close(); }
});

test('an edit that keeps colliding with ticks asks the organiser to save again', async () => {
  let target, flip = false;
  const { db, entry, edit } = await setup(db => ({
    list: () => db.list(), attend: (...a) => db.attend(...a),
    async save(...args) {
      if (target) { flip = !flip; await db.attend(target, 0, 0, flip); }
      return db.save(...args);
    }
  }));
  try {
    target = entry.id;
    const res = await edit(groupsWith(['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Ken Thompson']));
    assert.equal(res.code, 409);
    assert.equal(res.data.code, 'ATTENDANCE_CHANGED');
    assert.deepEqual((await db.list())[0].groups[0].players[3], '', 'the edit was not applied');
  } finally { db.close(); }
});
