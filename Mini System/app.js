let rows = [];
const $ = id => document.getElementById(id);
$('dept').innerHTML = '<option value="">Select department</option>' +
  Object.keys(DEPTS).map(d => `<option>${d}</option>`).join('');

async function refresh() { rows = await loadToday(); render(); }

function render() {
  const n = s => rows.filter(r => r.status === s).length;
  $('s-wait').textContent = n('waiting'); $('s-serve').textContent = n('serving');
  $('s-done').textContent = n('completed'); $('s-total').textContent = rows.length;

  $('rooms').innerHTML = ROOMS.map(room => {
    const p = rows.find(r => r.status === 'serving' && r.counter === room);
    return `<div class="room ${p ? 'busy' : ''}"><b>${room}</b>
      <span class="tag">${p ? 'Busy' : 'Online'}</span>
      <p>${p ? esc(p.queue_no) + ' · ' + esc(p.patient_name) : 'Available'}</p></div>`;
  }).join('');

  const order = { serving: 0, waiting: 1, completed: 2, cancelled: 3 };
  const sorted = [...rows].sort((a, b) => order[a.status] - order[b.status] ||
    (b.priority - a.priority) || new Date(a.created_at) - new Date(b.created_at));
  $('tbody').innerHTML = sorted.map(r => `<tr>
    <td><b class="mono">${esc(r.queue_no)}</b>${r.priority ? ' <span class="tag pr">Priority</span>' : ''}</td>
    <td>${esc(r.patient_name)}</td><td><span class="tag">${esc(r.department)}</span></td>
    <td><span class="st ${r.status}">${r.status}</span>${r.counter ? ' · ' + r.counter : ''}</td>
    <td>${new Date(r.created_at).toLocaleTimeString()}</td>
    <td>${r.status === 'waiting' ? `<button class="btn green" onclick="callNext(${r.id})">Call</button>` : ''}
        ${r.status === 'serving' ? `<button class="btn blue" onclick="setStatus(${r.id},'completed')">Complete</button>` : ''}
        ${['waiting', 'serving'].includes(r.status) ? `<button class="btn red" onclick="setStatus(${r.id},'cancelled')">Cancel</button>` : ''}</td></tr>`).join('')
    || '<tr><td colspan="6" class="empty">No patients today</td></tr>';
}

$('form').onsubmit = async e => {
  e.preventDefault();
  const dept = $('dept').value, prefix = DEPTS[dept];
  const seq = rows.filter(r => r.queue_no.startsWith(prefix)).length + 1;
  const queue_no = prefix + String(seq).padStart(3, '0');
  const { error } = await db.from('queue_entries').insert({
    queue_no, patient_name: $('name').value.trim(), department: dept, priority: $('prio').checked });
  if (error) return alert(error.message);
  $('result').hidden = false; $('result-no').textContent = queue_no;
  e.target.reset(); refresh();
};

async function callNext(id) {
  const room = ROOMS.find(r => !rows.some(x => x.status === 'serving' && x.counter === r));
  if (!room) return alert('All rooms are busy. Complete a patient first.');
  await db.from('queue_entries').update({ status: 'serving', counter: room, called_at: new Date().toISOString() }).eq('id', id);
  refresh();
}
async function setStatus(id, status) {
  await db.from('queue_entries').update({ status, completed_at: new Date().toISOString() }).eq('id', id);
  refresh();
}
$('refresh').onclick = async () => {
  const b = $('refresh');
  b.disabled = true;
  b.textContent = 'Refreshing...';
  await refresh();
  b.textContent = '✔ Refreshed';
  setTimeout(() => { b.textContent = 'Refresh'; b.disabled = false; }, 800);
};
setInterval(() => $('clock').textContent = new Date().toLocaleString(), 1000);
live(refresh);