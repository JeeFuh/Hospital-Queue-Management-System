// Supabase > Project Settings > API
const SUPABASE_URL = 'https://zodmglnimrlkynusdfyh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Hdp1H_2lJEZM1Yi0oyQOZA_UHB4TkAU';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DEPTS = { 'General Checkup': 'G', Pediatrics: 'P', Laboratory: 'L', Pharmacy: 'M', Emergency: 'E' };
const ROOMS = ['Room 1', 'Room 2', 'Room 3'];
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function loadToday() {
  const { data, error } = await db.from('queue_entries').select('*')
    .gte('created_at', startOfToday()).order('created_at');
  if (error) { console.error(error); return []; }
  return data;
}
function live(fn) { // realtime + 5s polling fallback
  db.channel('q').on('postgres_changes', { event: '*', schema: 'public', table: 'queue_entries' }, fn).subscribe();
  setInterval(fn, 5000); fn();
}