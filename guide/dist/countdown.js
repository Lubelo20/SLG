(() => {
  const arrival = Date.parse('2026-11-26T10:00:00+02:00');
  const end = Date.parse('2026-11-27T00:00:00+02:00');
  const units = ['days', 'hours', 'minutes', 'seconds'];
  let interval;
  function update() {
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((arrival - now) / 1000));
    const values = [Math.floor(remaining / 86400), Math.floor(remaining / 3600) % 24, Math.floor(remaining / 60) % 60, remaining % 60];
    units.forEach((unit, index) => { document.getElementById(unit).textContent = String(values[index]).padStart(2, '0'); });
    if (now >= arrival) {
      document.getElementById('countdown-label').textContent = now < end ? 'GOLF DAY IS HERE · WELCOME TO ZIMBALI LAKES' : 'THANK YOU FOR BEING PART OF OUR GOLF DAY';
      document.querySelector('.countdown').hidden = true;
      if (now >= end && interval) clearInterval(interval);
    }
  }
  interval = setInterval(update, 1000);
  update();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
})();
