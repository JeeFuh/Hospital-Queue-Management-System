const $ = id => document.getElementById(id);
async function update() {
  const rows = await loadToday();
  const called = rows.filter(r => r.called_at).sort((a, b) => new Date(b.called_at) - new Date(a.called_at));
  const now = called.find(r => r.status === 'serving');
  const waiting = rows.filter(r => r.status === 'waiting')
    .sort((a, b) => (b.priority - a.priority) || new Date(a.created_at) - new Date(b.created_at));
  $('now').textContent = now ? now.queue_no : '- - -';
  $('where').textContent = now ? 'Please proceed to ' + now.counter : 'Please wait for your number';
  $('next').textContent = waiting[0] ? waiting[0].queue_no : '- - -';
  $('wait').textContent = waiting.length;
  const mins = called.map(r => (new Date(r.called_at) - new Date(r.created_at)) / 60000);
  $('avg').textContent = (mins.length ? Math.round(mins.reduce((a, b) => a + b) / mins.length) : 0) + ' min';
  $('recent').innerHTML = called.slice(0, 6).map(r => `<span class="chip">${esc(r.queue_no)}</span>`).join('') || 'No recent calls';
  $('wlist').textContent = waiting.length ? waiting.slice(0, 8).map(r => r.queue_no).join('  ·  ') : 'Queue is empty';
}
setInterval(() => { const d = new Date(); $('date').textContent = d.toDateString(); $('time').textContent = d.toLocaleTimeString(); }, 1000);
live(update);