import test from 'node:test';
import assert from 'node:assert/strict';
import { allocationNote, emptyDrawCopy, organisationCount } from '../public/ui.js';

test('allocation note never claims groups are allocated when there are none', () => {
  assert.equal(allocationNote(0, 0), 'Allocated once groups are added');
});

test('allocation note reports progress, then completion, in terms of starting holes', () => {
  assert.equal(allocationNote(4, 1), '1 of 4 groups allocated');
  assert.equal(allocationNote(4, 4), 'Every group has a starting hole');
});

test('empty state explains an unpublished draw instead of suggesting another search', () => {
  assert.deepEqual(emptyDrawCopy(0), { title: 'The draw is on its way', text: 'Groups and starting holes will appear here once the organisers add them.', canClear: false });
  assert.deepEqual(emptyDrawCopy(3), { title: 'No groups found', text: 'Try another name or starting hole.', canClear: true });
});

test('organisation count uses the companies beside golfer names in mixed four-balls', () => {
  const entries = [
    { groups: [{ players: ['Ann Lee · Hulamin', 'Bob Ray · NCS', '', ''] }] },
    { groups: [{ players: ['Cy Dube · Hulamin', '', '', ''] }] }
  ];
  assert.equal(organisationCount(entries), 2);
});

test('organisation count falls back to bookings when golfers have no company', () => {
  assert.equal(organisationCount([{ groups: [{ players: ['Ann Lee', '', '', ''] }] }, { groups: [{ players: ['', '', '', ''] }] }]), 2);
});
