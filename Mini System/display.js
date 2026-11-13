const $ = id => document.getElementById(id);
let voiceOn = false, ready = false, lastKey = null;
const evTime = r => new Date(r.recall_at || r.called_at).getTime();

function speak(no, room) {
  if (!voiceOn || !('speechSynthesis' in window)) return;
  const spoken = no.split('').join(' ');          // "G001" -> "G 0 0 1"
  speechSynthesis.cancel();
  for (let i = 0; i < 2; i++) {                   // announce twice
    const u = new SpeechSynthesisUtterance(`Now serving number ${spoken}. Please proceed to ${room}.`);
    u.rate = 0.85; u.lang = 'en-US';
    speechSynthesis.speak(u);
  }
}
$('voice').onclick = () => {                      // browsers need one click before sound is allowed
  voiceOn = !voiceOn;
  $('voice').textContent = voiceOn ? '🔊 Voice ON' : '🔇 Enable voice';
  $('voice').classList.toggle('on', voiceOn);
  if (voiceOn) speechSynthesis.speak(new SpeechSynthesisUtterance('Voice announcements enabled'));
};

async function update() {
  const rows = await loadToday();
  const called = rows.filter(r => r.called_at).sort((a, b) => new Date(b.called_at) - new Date(a.called_at));
  const now = rows.filter(r => r.status === 'serving').sort((a, b) => evTime(b) - evTime(a))[0];
  const waiting = rows.filter(r => r.status === 'waiting')
    .sort((a, b) => (b.priority - a.priority) || new Date(a.created_at) - new Date(b.created_at));
  $('now').textContent = now ? now.queue_no : '- - -';
  $('where').textContent = now ? 'Please proceed to ' + now.counter : 'Please wait for your number';
  $('next').textContent = waiting[0] ? waiting[0].queue_no : '- - -';
  $('wait').textContent = waiting.length;
  const mins = called.map(r => (new Date(r.called_at) - new Date(r.created_at)) / 60000);
  $('avg').textContent = (mins.length ? Math.round(mins.reduce((a, b) => a + b) / mins.length) : 0) + ' min';
    // Recently called: only patients still being served
  // (completed or cancelled numbers disappear)
  const stillServing = called.filter(r => r.status === 'serving');
  $('recent').innerHTML = stillServing.slice(0, 6)
    .map(r => `<span class="chip">${esc(r.queue_no)}</span>`).join('') || 'No recent calls';
  $('wlist').textContent = waiting.length ? waiting.slice(0, 8).map(r => r.queue_no).join('  ·  ') : 'Queue is empty';

  const key = now ? now.id + '|' + evTime(now) : null;   // changes on a new call OR a voice re-call
  if (ready && key && key !== lastKey) {
    speak(now.queue_no, now.counter);
    const c = $('nowcard'); c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash');
  }
  lastKey = key; ready = true;
}
setInterval(() => { const d = new Date(); $('date').textContent = d.toDateString(); $('time').textContent = d.toLocaleTimeString(); }, 1000);
live(update);
