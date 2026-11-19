import { $, allocationNote, byStart, el, emptyDrawCopy, groupLabel, organisationCount, request, splitPlayer, stats, toast } from './ui.js';
import { logo } from './logos.js';
let entries = [], filter = 'all', loading = false, source = 'preview';
// Each visitor's browser keeps the last draw it loaded, so a database outage on the day still shows their group.
const SAVED_DRAW = 'slg-draw-last';
const remember = rows => { try { localStorage.setItem(SAVED_DRAW, JSON.stringify(rows)); } catch {} };
const recall = () => {
  try { const rows = JSON.parse(localStorage.getItem(SAVED_DRAW)); return Array.isArray(rows) && rows.length && rows.every(e => Array.isArray(e?.groups)) ? rows : null; }
  catch { return null; }
};
function groups() {
  return entries.flatMap(e => e.groups.map((g, i) => ({ ...g, organisation: e.organisation, index: i + 1, total: e.bookings })));
}
function setFilter(value) {
  filter = value;
  document.querySelectorAll('[data-filter]').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === value);
    b.setAttribute('aria-pressed', String(b.dataset.filter === value));
  });
  render();
}
function render() {
  const all = groups(), assigned = all.filter(g => g.tee).length;
  const named = all.reduce((n, g) => n + g.players.filter(Boolean).length, 0);
  const q = $('#search').value.trim().toLowerCase();
  const visible = all.filter(g => (filter === 'all' || (filter === 'assigned' ? !!g.tee : !g.tee)) && `${g.organisation} ${g.tee} ${g.time || ''} ${g.players.join(' ')}`.toLowerCase().includes(q))
    .sort((a, b) => byStart(a, b) || a.organisation.localeCompare(b.organisation));
  stats('#stats', [[organisationCount(entries), 'Organisations', 'Joining us on the green'], [all.length, 'Booked groups', 'Four golfers per group'], [assigned, 'Starting holes assigned', allocationNote(all.length, assigned)], [named, 'Named golfers', `${all.length * 4} available player slots`]]);
  $('#count-all').textContent = all.length; $('#count-assigned').textContent = assigned; $('#count-pending').textContent = all.length - assigned;
  $('#results').textContent = `Showing ${visible.length} of ${all.length} groups`;
  $('#groups').replaceChildren(...visible.map(g => {
    const card = el('article', '', 'card'), head = el('div', '', 'card-head'), tee = el('div', '', 'tee');
    const when = el('div', '', 'tee-when');
    when.append(el('span', g.tee ? (g.time ? 'Tee off' : 'Starting hole') : 'Awaiting hole'));
    if (g.tee && g.time) when.append(el('b', g.time));
    tee.append(el('strong', g.tee || '—', g.tee.length > 2 ? 'long' : ''), when);
    const complete = g.players.every(Boolean) && !!g.tee;
    head.append(tee, el('span', complete ? 'Ready to play' : 'Provisional', `status ${complete ? 'complete' : ''}`));
    const body = el('div', '', 'card-body');
    // Organisations whose logo spells out their name show the logo alone; the name stays for screen readers and comes back if the image fails.
    const org = el('div', '', 'org'), badge = logo(g.organisation, 'org-logo'), name = el('h3', g.organisation);
    if (badge.classList.contains('has-logo') && !('mark' in badge.dataset)) {
      org.classList.add('logo-only'); name.className = 'visually-hidden';
      badge.querySelector('img').addEventListener('error', () => { org.classList.remove('logo-only'); name.className = ''; });
    } else if ('wide' in badge.dataset) {
      org.classList.add('logo-wide');
      badge.querySelector('img').addEventListener('error', () => org.classList.remove('logo-wide'));
    }
    org.append(badge, name);
    body.append(el('p', groupLabel(g, all.length), 'group-label'), org);
    const list = el('ol', '', 'players');
    g.players.forEach((player, i) => {
      const li = el('li'), { name: golfer, company } = splitPlayer(player), who = el('span', '', player ? 'player' : 'pending');
      who.textContent = golfer || 'Player to be confirmed';
      if (company) who.append(el('small', company));
      li.append(el('span', String(i + 1).padStart(2, '0'), 'number'), who); list.append(li);
    });
    body.append(list); card.append(head, body); return card;
  }));
  const copy = emptyDrawCopy(all.length);
  $('#empty h3').textContent = copy.title; $('#empty p').textContent = copy.text;
  $('#empty .empty-symbol').classList.toggle('is-hidden', !copy.canClear); $('#clear-search').classList.toggle('is-hidden', !copy.canClear);
  $('#empty').hidden = !!visible.length;
}
async function load(manual = false) {
  if (loading) return;
  loading = true; $('#refresh').disabled = true; $('#refresh .btn-label').textContent = 'Refreshing…'; $('#refresh').classList.add('is-loading'); $('#groups').setAttribute('aria-busy', 'true');
  try {
    const { data, response } = await request('/api/draw');
    entries = data.map(({ id, organisation, bookings, groups }) => ({ id, organisation, bookings, groups }));
    remember(entries);
    source = response.headers.get('X-Draw-Storage') || 'neon';
    $('#data-status').textContent = source === 'local' ? 'Local draw' : 'Live draw';
    $('#data-status').classList.add('live');
    const all = groups(), pending = all.filter(g => !g.tee).length;
    $('#notice').hidden = true; // only shown when the live draw can't be loaded
    if (manual) toast('Draw refreshed.');
  } catch (error) {
    if (entries.length && source !== 'preview') {
      $('#notice').hidden = false; $('#notice').textContent = `Unable to refresh. Showing the last loaded draw; it may have changed. ${error.message}`;
      $('#data-status').textContent = 'Refresh needed';
    } else {
      try {
        entries = recall() || (await request('/draw.json')).data; source = 'preview';
        $('#data-status').textContent = 'Saved draw';
        $('#notice').hidden = false; $('#notice').textContent = 'You are viewing a saved copy of the draw, so the latest changes may be missing. Please confirm your starting hole at registration.';
      } catch { entries = []; $('#notice').hidden = false; $('#notice').textContent = 'Unable to load the draw. Use Refresh draw to try again.'; $('#data-status').textContent = 'Unavailable'; }
    }
    $('#data-status').classList.remove('live');
    if (manual) toast(error.message, true);
  } finally {
    render(); loading = false; $('#refresh').disabled = false; $('#refresh .btn-label').textContent = 'Refresh draw'; $('#refresh').classList.remove('is-loading'); $('#groups').setAttribute('aria-busy', 'false');
  }
}
$('#search').addEventListener('input', render);
document.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filter)));
$('#clear-search').onclick = () => { $('#search').value = ''; setFilter('all'); $('#search').focus(); };
$('#print').onclick = () => window.print(); $('#refresh').onclick = () => load(true);
setInterval(() => { if (!document.hidden) load(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });

await load();
