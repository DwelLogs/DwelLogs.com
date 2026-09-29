/* DwelLogs — the browser side of the Sheets harness.
   ------------------------------------------------------------------------
   Two jobs, and the second one is the interesting one:

   1. Talk to the Apps Script web app.
   2. Map SCHEMA rows (property / structure / asset / schedule, all joined by
      uuid) onto the VIEW MODELS the prototype renders (places / things /
      checks, joined by name). That mapping is the part worth watching: every
      place it turns awkward is a place the model and the screens disagree,
      and finding those is the whole reason for doing this.

   Offline: reads are cached in localStorage, so the app still opens and
   still shows the last known state with no signal. Writes are not queued —
   they fail and say so. Queuing writes is the real offline story and it
   belongs in the app, not in a harness. */

/* Generated from schema.json by build_appsscript.py. A table missing here is
   simply an empty array in local mode — which is how a whole merged object can
   vanish without a single error. Do not hand-edit; run the build. */
const TABLE_NAMES = {
  property:1, structure:1, placement:1, area:1, hookup:1, shutoff:1,
  emergency_plan:1, plan_action:1, category:1, asset_type:1, asset:1,
  supply_link:1, fit_record:1, feedback:1, suggestion:1, vehicle:1, animal:1,
  budget:1, schedule:1, completion:1, reading:1, job:1, step:1, job_supply:1,
  notify:1, comment:1, intention:1, tag:1, tagging:1, trail:1, candidate:1,
  visit:1, supply:1, coverage:1, document:1, service:1, person:1,
  reminder_pref:1, invite:1, membership:1 };

const DwelLogs = (function () {
  const CFG = { url: '', token: '', property: null };   // set by configure()
  const CACHE = 'dwellogs.cache.v1';
  let db = null;

  /* No URL means local mode: the same API backed by localStorage, so the
     whole first run can be walked through before any deploying happens, and
     so a demo does not need a live sheet. */
  function configure(url, token) { CFG.url = url || ''; CFG.token = token || ''; }
  const LOCAL = 'dwellogs.local.v1';
  function localDb() {
    try { return JSON.parse(localStorage.getItem(LOCAL) || 'null'); } catch (e) { return null; }
  }
  function localSave(d) { try { localStorage.setItem(LOCAL, JSON.stringify(d)); } catch (e) {} }
  function emptyDb() {
    const d = {}; Object.keys(TABLE_NAMES).forEach(t => { d[t] = []; }); return d;
  }
  function localWrite(writes) {
    const d = db || localDb() || emptyDb();
    const out = writes.map(w => {
      const rows = d[w.table] = d[w.table] || [];
      if (w.op === 'archive') {
        const r = rows.find(x => x.id === w.id); if (r) r.status = 'archived';
        return { id: w.id, warnings: [] };
      }
      const rec = Object.assign({}, w.record);
      rec.updated_at = new Date().toISOString();
      if (!rec.status) rec.status = 'active';
      const i = rec.id ? rows.findIndex(x => x.id === rec.id) : -1;
      if (i >= 0) Object.assign(rows[i], rec);
      else { rec.id = rec.id || 'loc-' + Math.random().toString(36).slice(2, 10); rows.push(rec); }
      return { id: rec.id, warnings: [] };
    });
    db = d; localSave(d);
    return out;
  }

  async function load({ fresh = true } = {}) {
    if (!CFG.url) { db = localDb() || emptyDb(); return { db, local: true }; }
    if (fresh && CFG.url) {
      try {
        const r = await fetch(CFG.url + '?token=' + encodeURIComponent(CFG.token));
        const j = await r.json();
        if (!j.ok) throw new Error(j.error);
        db = j.data;
        try { localStorage.setItem(CACHE, JSON.stringify({ at: Date.now(), db })); } catch (e) {}
        /* The script says on every reply whether the sheet has the columns this
           version needs. Dropping it here made the "your sheet is a version
           behind" card unreachable -- it was written, it rendered off a flag
           nothing ever set, and the only sign of a stale sheet was a write that
           quietly went nowhere. */
        return { db, stale: false, needsMigration: !!j.needs_migration,
                 appSchema: j.app_schema, sheetSchema: j.sheet_schema };
      } catch (e) {
        console.warn('[DwelLogs] live read failed, falling back to cache:', e.message);
      }
    }
    try {
      const c = JSON.parse(localStorage.getItem(CACHE) || 'null');
      if (c) { db = c.db; return { db, stale: true, at: c.at }; }
    } catch (e) {}
    throw new Error('No data, and nothing cached.');
  }

  async function write(writes) {
    if (!CFG.url) return localWrite(writes);
    const body = writes.length > 1
      ? { token: CFG.token, op: 'batch', writes }
      : Object.assign({ token: CFG.token }, writes[0]);
    // text/plain on purpose: anything else triggers a CORS preflight that
    // Apps Script does not answer, and the request dies before it is sent.
    const r = await fetch(CFG.url, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error);
    const warn = j.data.results.flatMap(x => x.warnings || []);
    if (warn.length) console.warn('[DwelLogs]', warn.join(' '));
    return j.data.results;
  }
  /* Adds missing tabs and columns and copies renamed columns forward. Additive
     only: nothing in their spreadsheet is reordered or removed, and columns of
     their own are reported back untouched. */
  async function migrate() {
    if (!CFG.url) return { migrated: { added_tables: [], added_columns: [],
                                       renamed: [], unknown_columns: [] } };
    const r = await fetch(CFG.url, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: CFG.token, op: 'migrate' })
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error);
    return j.data;
  }
  /* Shrink on the device, then send. A phone photo is 3-5MB; this lands around
     200-400KB, which is plenty to prove a scuff was there and small enough that
     a hundred of them do not fill somebody's Drive. */
  async function shrink(file, max = 1600, quality = 0.78) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => {
        const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
      });
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = c.toDataURL('image/jpeg', quality);
      return { b64: dataUrl.split(',')[1], width: w, height: h,
               bytes: Math.round(dataUrl.length * 0.75) };
    } finally { URL.revokeObjectURL(url); }
  }
  /* Local mode keeps the image in this browser and says so. It is a real
     answer for one device and a bad one for evidence, which the screen says. */
  /* A document is not a photo and must not be treated like one. There is no
     canvas trick for a PDF, so what goes up is what they picked, which means
     the ceiling is real: the file becomes a base64 string a third larger than
     itself, inside a JSON body, posted to Apps Script. Rather than discover
     that at the end of a slow upload on a phone, say it before starting. */
  const PAPER_MAX = 20 * 1024 * 1024;
  const PAPER_SLOW = 5 * 1024 * 1024;

  function readB64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(',')[1]);
      r.onerror = () => rej(new Error('Could not read that file.'));
      r.readAsDataURL(file);
    });
  }

  /* The device-only database, handed over whole. The app needs this at exactly
     one moment: somebody who has been running on one phone connects a sheet,
     and their work is sitting in here while the sheet is empty. Nothing else
     in this API can see it once a URL is configured. */
  function localSnapshot() { return localDb(); }

  async function upload(file, name, bucket) {
    if (file.size > PAPER_MAX)
      throw new Error('That file is ' + Math.round(file.size / 1048576) + 'MB. Anything over 20MB '
        + 'will not make it through to the sheet — link to it instead, or save a smaller scan.');
    const b64 = await readB64(file);
    const meta = { bytes: file.size, mime: file.type || 'application/octet-stream',
                   slow: file.size > PAPER_SLOW };
    if (!CFG.url) return Object.assign({ drive_id:'', url:'', local:true }, meta);
    const r = await fetch(CFG.url, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: CFG.token, op: 'file', b64,
        filename: name || file.name || 'file', mime: meta.mime, bucket: bucket || 'papers' })
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error);
    return Object.assign({}, meta, j.data);
  }

  async function photo(file, name) {
    const small = await shrink(file);
    if (!CFG.url) return Object.assign({ drive_id:'', url:'', local:true }, small);
    const r = await fetch(CFG.url, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: CFG.token, op: 'photo', b64: small.b64,
        filename: name || 'photo.jpg', mime: 'image/jpeg' })
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error);
    return Object.assign({}, small, j.data, { b64: undefined });
  }
  const save    = (table, record) => write([{ op: 'upsert', table, record }]);
  const archive = (table, id)     => write([{ op: 'archive', table, id }]);

  // ---- schema rows -> the arrays the prototype renders -------------------
  const ix = rows => Object.fromEntries((rows || []).map(r => [r.id, r]));

  function view(propertyId) {
    const P = ix(db.property), S = ix(db.structure), A = ix(db.area),
          AS = ix(db.asset), PE = ix(db.person);
    const pid = propertyId || (db.property[0] || {}).id;
    const mine = r => !r.property_id || r.property_id === pid;

    const structures = (db.structure || []).filter(mine);
    const byStruct = id => (S[id] || {}).name || '';

    const places = structures.map(s => ({
      n: s.name, kind: s.kind, hidden: s.hidden === true || s.hidden === 'TRUE',
      sub: [s.kind, (db.hookup || []).filter(h => h.structure_id === s.id)
        .map(h => h.utility).join(', ')].filter(Boolean).join(' · ')
    }));

    const areas = (db.area || []).filter(a => S[a.structure_id])
      .map(a => ({ n: a.name, where: byStruct(a.structure_id), kind: a.kind,
                   inside: (A[a.parent_area_id] || {}).name }));

    const things = (db.asset || []).filter(mine).map(a => ({
      n: a.name, where: byStruct(a.structure_id), room: (A[a.area_id] || {}).name,
      year: a.year_made, sub: [a.make, a.model].filter(Boolean).join(' '),
      feeds: (db.supply_link || []).filter(l => l.from_asset_id === a.id)
        .map(l => (AS[l.to_asset_id] || {}).name || byStruct(l.to_structure_id)).filter(Boolean),
      fedBy: (db.supply_link || []).filter(l => l.to_asset_id === a.id)
        .map(l => (AS[l.from_asset_id] || {}).name).filter(Boolean)
    }));

    const today = new Date();
    const days = d => d ? Math.round((new Date(d) - today) / 864e5) : null;
    const checks = (db.schedule || []).map(s => {
      const d = days(s.next_due_on);
      return { thing: (AS[s.asset_id] || {}).name || byStruct(s.structure_id),
        title: s.title, days: d,
        s: d == null ? 'ok' : d <= 0 ? 'attn' : d <= 14 ? 'soon' : 'ok',
        mins: s.estimated_hours ? s.estimated_hours * 60 : undefined,
        cost: s.estimated_cost ? { n: s.estimated_cost, src: s.cost_source } : undefined,
        who: (PE[s.service_id] || {}).name, meta: '' };
    });

    const history = {};
    (db.completion || []).forEach(c => {
      const on = (AS[c.asset_id] || {}).name; if (!on) return;
      (history[on] = history[on] || []).push({ kind: 'done', when: c.done_on,
        what: c.what, who: (PE[c.by_person_id] || {}).name, cost: c.cost, why: c.origin });
    });
    (db.reading || []).forEach(r => {
      const on = (AS[r.asset_id] || {}).name; if (!on) return;
      (history[on] = history[on] || []).push({ kind: 'reading', when: r.taken_on,
        what: r.result_type === 'numeric' ? r.value_num + (r.unit ? ' ' + r.unit : '') : r.value_flag,
        who: (PE[r.by_person_id] || {}).name });
    });

    const issues = {};
    (db.issue || []).forEach(i => {
      const on = (AS[i.asset_id] || {}).name || byStruct(i.structure_id) || 'The property';
      (issues[on] = issues[on] || []).push({ title: i.title, since: i.first_seen_on,
        state: i.state, priority: i.priority, investigating: i.investigating === true,
        workaround: i.workaround, cost: i.cost_to_fix, note: i.notes,
        deferred: i.deferred_until, why: i.defer_reason });
    });

    const people = (db.person || []).map(p => ({ n: p.name, role: p.role, note: p.notes, on: '' }));
    const docs = (db.document || []).filter(mine).map(d => ({
      n: d.name, kind: d.kind, when: d.dated_on, note: d.note,
      on: (AS[d.asset_id] || {}).name || byStruct(d.structure_id) || 'The Ranch' }));
    const shutoffs = (db.shutoff || []).filter(mine).map(s => ({
      what: s.label, where: s.where, how: [s.how, s.does_not_cover].filter(Boolean).join(' ') }));
    const improvements = (db.improvement || []).filter(mine).map(v => ({
      n: v.title, where: byStruct(v.structure_id), area: (A[v.area_id] || {}).name,
      status: v.status, now: v.now, want: v.want, hours: v.est_hours }));
    const slots = {};
    (db.work_item || []).forEach(w => { if (w.slot) slots[w.title] = w.slot; });

    return { places, areas, things, checks, history, issues, people, docs,
             shutoffs, improvements, slots };
  }

  /** Drop the view models onto window, so index.html renders unchanged. */
  function install(v) { Object.keys(v).forEach(k => { window[k] = v[k]; }); }

  return { configure, load, save, archive, write, migrate, photo, upload, shrink, view, install,
           localSnapshot,
           get raw() { return db; } };
})();
