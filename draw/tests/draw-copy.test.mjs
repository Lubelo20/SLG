import test from 'node:test';
import assert from 'node:assert/strict';
import { allocationNote, emptyDrawCopy, groupLabel, organisationCount, splitPlayer } from '../public/ui.js';
import { logoFor } from '../public/logos.js';

test('allocation note reports how many groups still need a starting hole', () => {
  assert.equal(allocationNote(0, 0), '0 awaiting allocation');
  assert.equal(allocationNote(4, 1), '3 awaiting allocation');
  assert.equal(allocationNote(4, 4), '0 awaiting allocation');
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

test('group label numbers a mixed four-ball within the whole field', () => {
  assert.equal(groupLabel({ organisation: 'Four-ball 3', index: 1, total: 1 }, 16), 'GROUP 03 / 16');
});

test('group label numbers an organisation booking within that organisation', () => {
  assert.equal(groupLabel({ organisation: 'Hulamin', index: 2, total: 4 }, 16), 'GROUP 02 / 04');
});

test('a golfer entry separates the name from the company', () => {
  assert.deepEqual(splitPlayer('Ann Lee · Kuhn & Reinhardt'), { name: 'Ann Lee', company: 'Kuhn & Reinhardt' });
  assert.deepEqual(splitPlayer('Ann Lee'), { name: 'Ann Lee', company: '' });
});

test('mixed four-balls show the host logo and unknown organisations show none', () => {
  assert.equal(logoFor('Four-ball 12').src, '/assets/golfday/slg-logo-card.png');
  assert.equal(logoFor('Some Company'), null);
});
