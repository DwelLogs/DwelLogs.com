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
   vanish without a single error. Do not hand-edit; run the build.

   One letter per column type, and that letter is what the validator below
   enforces. Generated for the same reason the table list is: a hand-kept copy
   of 511 field types is wrong within a week, and a field whose type nobody
   copied over is a field with no guard.

     i  this row's own id        r  another row's id
     t  text                     T  long text
     p  picklist                 P  multi-picklist
     n  number                   c  currency          %  percent
     d  date                     D  date and time
     b  checkbox                 u  url               f  file
     x  formula (computed; never accepted from outside)                      */
const TABLE_COLS = {
  property: {id:"i",name:"t",tenure:"p",kind:"p",region:"t",postcode:"t",country:"p",
    currency:"p",units:"p",freezes:"p",climate:"P",terrain:"P",elevation:"n",hazards:"P",
    profile_confirmed_on:"d",profile_review_on:"d",acquired_on:"d",disposed_on:"d"},
  structure: {id:"i",property_id:"r",name:"t",kind:"p",kind_other:"t",attached_to_id:"r",
    responsible_id:"r",visibility:"p",what_crosses:"x",water:"P",waste:"P",power:"P",heat:"P",
    cooling:"P",hot_water:"P",spaces:"P",people_living:"n",children_here:"p",mobile:"b",
    heated:"b",hidden:"b"},
  placement: {id:"i",structure_id:"r",area_id:"r",asset_id:"r",animal_id:"r",vehicle_id:"r",
    property_id:"r",address:"t",arrived_on:"d",left_on:"d",stay_kind:"p",water:"P",waste:"P",
    power:"P",source_note:"T",note:"T"},
  area: {id:"i",property_id:"r",structure_id:"r",name:"t",kind:"p",parent_area_id:"r",size:"n"},
  hookup: {id:"i",property_id:"r",structure_id:"r",utility:"p",area_id:"r",source_asset_id:"r",
    started_on:"d",ended_on:"d",account_ref:"t"},
  shutoff: {id:"i",property_id:"r",structure_id:"r",area_id:"r",state:"p",last_tested_on:"d",
    upstream_shutoff_id:"r",utility:"p",label:"t",where:"T",how:"T",does_not_cover:"T",
    photo_id:"r"},
  emergency_plan: {id:"i",property_id:"r",kind:"p",reviewed_on:"d",source:"t",grab:"T",
    if_time:"T",notes:"T"},
  plan_action: {id:"i",property_id:"r",plan_id:"r",what:"t",area_id:"r",act:"p",why:"t",
    shutoff_id:"r",sort:"n"},
  category: {id:"i",name:"t",sort:"n"},
  asset_type: {id:"i",category_id:"r",name:"t",source:"p",serial_format:"T"},
  asset: {id:"i",property_id:"r",asset_type_id:"r",structure_id:"r",area_id:"r",
    parent_asset_id:"r",name:"t",make:"t",model:"t",serial:"t",year_made:"n",installed_on:"d",
    power_source:"P",belongs_to:"p",usage_level:"p",status:"p",replaced_by_id:"r"},
  supply_link: {id:"i",property_id:"r",from_asset_id:"r",to_asset_id:"r",to_structure_id:"r",
    utility:"p"},
  fit_record: {id:"i",property_id:"r",asset_id:"r",opening_w:"n",opening_h:"n",opening_d:"n",
    hookups:"T",path_of_travel:"T",measured_by_id:"r",measured_on:"d",compliance_notes:"T"},
  feedback: {id:"i",person_id:"r",kind:"p",what:"T",expected:"T",screen:"t",context:"T",
    raised_on:"d",sent:"b",status:"p"},
  suggestion: {id:"i",object:"t",field:"t",typed:"t",normalised:"t",property_id:"r",count:"n",
    context_kind:"t",context_group:"p",by_kind:"T",suggest_for:"t",first_seen_on:"d",
    last_seen_on:"d",status:"p",promoted_value:"t",note:"T"},
  vehicle: {id:"i",owner_id:"r",property_id:"r",name:"t",kind:"p",make:"t",model:"t",year:"n",
    vin:"t",plate:"t",structure_id:"r",area_id:"r",role:"p",road_status:"p",fuel:"p",
    usage_unit:"p",acquired_on:"d",departed_on:"d",departure_reason:"p"},
  animal: {id:"i",owner_id:"r",property_id:"r",name:"t",type:"p",breed:"t",structure_id:"r",
    area_id:"r",birthdate:"d",age:"x",acquired_on:"d",role:"p",produces:"P",helps_with:"P",
    cared_for_by_id:"r",departed_on:"d",departure_reason:"p"},
  budget: {id:"i",property_id:"r",period_start:"d",period_end:"d",amount:"c",
    hours_available:"n",note:"T"},
  schedule: {id:"i",property_id:"r",asset_id:"r",structure_id:"r",area_id:"r",animal_id:"r",
    vehicle_id:"r",title:"t",kind:"p",applies_when_source:"P",every_n:"n",every_unit:"p",
    season:"t",until_condition:"t",until_progress:"t",responsibility:"p",service_id:"r",
    estimated_cost:"c",estimated_hours:"n",interval_source:"p",wear_flag:"b",interval_note:"t",
    cost_source:"p",next_due_on:"d",next_due_at:"n",muted:"b",then_id:"r"},
  completion: {id:"i",property_id:"r",schedule_id:"r",asset_id:"r",job_id:"r",animal_id:"r",
    vehicle_id:"r",visit_id:"r",supply_id:"r",how_many:"n",done_on:"d",recorded_on:"d",what:"T",
    by_person_id:"r",did_it:"p",service_id:"r",cost:"c",outcome:"p",origin:"p",
    expected_but_not_done:"T"},
  reading: {id:"i",asset_id:"r",animal_id:"r",vehicle_id:"r",property_id:"r",structure_id:"r",
    area_id:"r",schedule_id:"r",taken_on:"d",result_type:"p",value_num:"n",value_flag:"p",
    unit:"t",method:"t",source:"p",trusted:"b",by_person_id:"r"},
  job: {id:"i",property_id:"r",kind:"p",title:"t",notes:"T",asset_id:"r",structure_id:"r",
    area_id:"r",animal_id:"r",vehicle_id:"r",parent_job_id:"r",source:"p",schedule_id:"r",
    first_seen_on:"d",start_on:"d",due_on:"d",done_on:"d",position:"n",column_set_from:"p",
    slot:"p",slot_set_on:"d",shared:"b",status:"p",column:"p",priority:"p",est_minutes:"n",
    est_cost:"c",cost_of_waiting:"c",why_it_matters:"T",prerequisites:"T",needs_decision:"b",
    owner_id:"r",provider_id:"r",service_id:"r",claimed_by_id:"r",claimed_at:"D",
    blocked_on_person_id:"r",blocked_reason:"T",blocked_since:"d",depends_on_id:"r",
    bundled_to_id:"r",completion_id:"r",state:"p",safety:"p",affected_modes:"t",
    missed_by_document_id:"r",affects_supply_id:"r",investigating:"b",workaround:"T",
    workaround_holds_until:"t",deferred_until:"t",defer_reason:"T",coverage_id:"r",
    reported_on:"d",reported_to_id:"r",last_chased_on:"d",reply:"T",change:"p",now:"T",want:"T",
    required_by_coverage_id:"r",creates_asset_id:"r",retires_asset_id:"r"},
  step: {id:"i",property_id:"r",job_id:"r",structure_id:"r",area_id:"r",where_else:"t",text:"t",
    position:"n",done:"b",done_on:"d",done_by_id:"r"},
  job_supply: {id:"i",property_id:"r",job_id:"r",supply_id:"r",how_many:"n",note:"t"},
  job_also: {id:"i",property_id:"r",job_id:"r",structure_id:"r",area_id:"r",asset_id:"r",
    animal_id:"r",vehicle_id:"r"},
  notify: {id:"i",property_id:"r",job_id:"r",person_id:"r",counterparty:"t",expecting:"T",
    ask:"t",tell_by:"d",consequence:"t",status:"p",reply:"T",told_on:"d"},
  comment: {id:"i",property_id:"r",job_id:"r",asset_id:"r",author_id:"r",body:"T",said_at:"D"},
  intention: {id:"i",property_id:"r",slot:"p",starts_on:"d",text:"t",person_id:"r"},
  tag: {id:"i",property_id:"r",name:"t",colour:"t"},
  tagging: {id:"i",property_id:"r",tag_id:"r",job_id:"r",asset_id:"r",document_id:"r"},
  trail: {id:"i",property_id:"r",job_id:"r",happened_on:"d",what:"T",person_id:"r",
    ruled_out:"T"},
  candidate: {id:"i",property_id:"r",job_id:"r",asset_id:"r",name:"t",price:"c",url:"u",
    fits:"p",why_not:"T",chosen:"b",chosen_on:"d"},
  view: {id:"i",property_id:"r",person_id:"r",name:"t",filters:"T",sort:"t",on_home:"b",
    position:"n"},
  visit: {id:"i",property_id:"r",animal_id:"r",vehicle_id:"r",person_id:"r",asset_id:"r",
    job_id:"r",visited_on:"d",expected:"T",total_cost:"c",notes:"T"},
  supply: {id:"i",property_id:"r",area_id:"r",asset_id:"r",animal_id:"r",vehicle_id:"r",
    name:"t",on_hand:"n",keep_at_least:"n",part_number:"t",link:"t",unit:"t",pack_size:"n",
    covers:"n",rate_estimate:"t",rate_source:"p",rate_note:"T",is_material:"b",supplier_id:"r"},
  coverage: {id:"i",asset_id:"r",animal_id:"r",vehicle_id:"r",structure_id:"r",property_id:"r",
    kind:"p",provider:"t",cost:"c",status:"p",replaced_by_id:"r",starts_on:"d",expires_on:"d",
    document_id:"r"},
  document: {id:"i",property_id:"r",animal_id:"r",vehicle_id:"r",asset_id:"r",structure_id:"r",
    name:"t",area_id:"r",kind:"p",purpose:"p",dated_on:"d",taken_on:"d",by_person_id:"r",
    drive_id:"t",url:"u",width:"n",height:"n",bytes:"n",file:"f",mime:"t",good_until:"d",
    inherited:"b",note:"T"},
  service: {id:"i",property_id:"r",animal_id:"r",vehicle_id:"r",asset_id:"r",name:"t",
    person_id:"r",structure_id:"r",cost_per_visit:"c",started_on:"d",ended_on:"d"},
  person: {id:"i",name:"t",role:"p",company:"t",phone:"t",email:"t",added_in_id:"r",
    auth_provider:"p",auth_subject:"t",email_verified:"b",last_seen_on:"d",currency:"p",
    country:"p",notes:"T"},
  reminder_pref: {id:"i",person_id:"r",property_id:"r",channel:"p",what:"P",lead_days:"n",
    cadence:"p",send_day:"p",send_hour:"n",max_per_week:"n",only_mine:"b",snooze_until:"d",
    never_about_unknowns:"b",last_sent_on:"d",sent_this_week:"n",feed_key:"t"},
  invite: {id:"i",property_id:"r",scope_structure_id:"r",label:"t",for_person_id:"r",access:"p",
    can_see_costs:"b",code:"t",single_use:"b",expires_on:"d",sent_by_id:"r",sent_on:"d",
    state:"p",accepted_on:"d",accepted_by_id:"r",their_structure_id:"r",note:"T"},
  membership: {id:"i",property_id:"r",person_id:"r",scope_structure_id:"r",access:"p",
    cost_share:"%",cares_for_animals:"b",notify:"P"},
};
const TABLE_NAMES = Object.fromEntries(Object.keys(TABLE_COLS).map(t => [t, 1]));

/* ------------------------------------------------------------------------
   The gate.

   Two doors into this app: write() on the way out, load() on the way in.
   Everything else — every screen, every setup step, every sheet — arrives
   through one of them, so the checking happens here and not in forty screens
   that each have to remember.

   The two doors want opposite behaviour, which is the whole point of doing it
   in one place where the difference is visible:

     OUT  somebody typed it and is standing there. "abc" in a cost field must
          not quietly become nothing — throw, and the screen says what is
          wrong while they can still fix it.

     IN   a sheet is a document anyone with the link can edit, so it is
          hostile input by definition — and the app still has to open. Never
          throw. A bad number becomes blank, a bad date becomes blank, and a
          row whose id is not id-shaped is dropped, because that id is about
          to be interpolated into an onclick handler.

   Columns nobody knows about are kept, not dropped. People add their own
   columns to their own spreadsheet and the migration promises never to touch
   them; dropping them here would quietly blank them on the next write-back.
   They ride through as plain text and nothing renders them.              */

const MAX_TEXT = 500;         // a name, a label, a part number
const MAX_MULTI = 2000;       // every value of a multi-picklist, joined
const MAX_LONG = 20000;       // notes, and someone WILL paste a manual in
const ID_OK = /^[A-Za-z0-9_-]{1,64}$/;
/* Numbers big enough for any real cost or reading, small enough that nothing
   downstream does arithmetic on Infinity and renders "NaN days ago". */
const MAX_NUM = 1e12;
const YEAR_MIN = 1800, YEAR_MAX = 2200;

/* Control characters are not typed; they are pasted or planted. A NUL or an
   escape sequence in a name has no meaning a person intended, and it travels
   badly through CSV, the sheet, and anything reading the export afterwards.
   Newlines and tabs stay — those are real in a long note. */
const strip = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

const asNum = v => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (v == null || typeof v === 'object') return null;   // "1,2" from [1,2] is not 12
  let t = strip(v).trim().replace(/^[$€£¥]\s*/, '').replace(/\s/g, '');
  /* Commas come off only where they are actually thousands separators. The
     unconditional strip read the array [1,2] as "1,2" and handed back twelve,
     which is the shape of every quiet data-corruption bug: no error, wrong
     number, and it only shows up in a total three screens away. */
  if (/^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) t = t.replace(/,/g, '');
  if (!t || !/^[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) && Math.abs(n) <= MAX_NUM ? n : null;
};

/* A real calendar date, not a string that merely looks like one. "2026-02-31"
   parses in JavaScript and lands on March 3rd, which is how a schedule ends up
   due on a day nobody chose. Round-trip it and check it came back the same. */
const asDate = v => {
  const t = strip(v == null ? '' : v).trim();
  if (!t) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  let y, mo, d;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else {
    const p = new Date(t);
    if (isNaN(p)) return null;
    y = p.getUTCFullYear(); mo = p.getUTCMonth() + 1; d = p.getUTCDate();
  }
  if (y < YEAR_MIN || y > YEAR_MAX || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const iso = [y, String(mo).padStart(2, '0'), String(d).padStart(2, '0')].join('-');
  const back = new Date(iso + 'T00:00:00Z');
  return !isNaN(back) && back.toISOString().slice(0, 10) === iso ? iso : null;
};

const asStamp = v => {
  const t = strip(v == null ? '' : v).trim();
  if (!t) return '';
  const p = new Date(t);
  if (isNaN(p)) return null;
  const y = p.getUTCFullYear();
  return y >= YEAR_MIN && y <= YEAR_MAX ? p.toISOString() : null;
};

const asBool = v => {
  if (typeof v === 'boolean') return v;
  const t = strip(v == null ? '' : v).trim().toLowerCase();
  if (!t) return '';
  if (['true', 'yes', 'y', '1', 'on', 'checked'].includes(t)) return true;
  if (['false', 'no', 'n', '0', 'off', ''].includes(t)) return false;
  return null;
};

/* javascript: in a stored URL is a click away from running as this app, and a
   sheet cell is a perfectly good place to put one. An allow-list, because the
   list of schemes worth blocking keeps growing and the list worth keeping does
   not. A bare domain gets https:// rather than being thrown away. */
const asUrl = v => {
  const t = strip(v == null ? '' : v).trim();
  if (!t) return '';
  if (t.length > 2000) return null;
  if (/^(https?:)?\/\//i.test(t)) {
    try { const u = new URL(t, 'https://x'); return /^https?:$/.test(u.protocol) ? t : null; }
    catch (e) { return null; }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return null;   // any other scheme: no
  return /^[\w.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(t) ? 'https://' + t : null;
};

const LABEL = { n: 'a number', c: 'an amount', '%': 'a percentage',
                d: 'a date', D: 'a date', b: 'a yes or no', u: 'a web address',
                i: 'an id', r: 'an id' };

/* One value, one type letter. Returns { v } to use it, or { bad } with a
   reason — the callers decide whether that reason is thrown at a person or
   swallowed and blanked. */
function check(code, v, field) {
  const name = String(field || 'that').replace(/_/g, ' ').replace(/ id$/, '');
  const no = () => ({ bad: name.charAt(0).toUpperCase() + name.slice(1)
                           + ' needs to be ' + (LABEL[code] || 'text')
                           + (v === '' || v == null ? '.' : ' — got "'
                              + String(v).slice(0, 40) + '".') });
  if (v === undefined) return { v: undefined };
  switch (code) {
    case 'i': case 'r': {
      const t = strip(v == null ? '' : v).trim();
      if (!t) return { v: '' };
      return ID_OK.test(t) ? { v: t } : no();
    }
    case 'n': case 'c': case '%': {
      if (v === '' || v == null) return { v: '' };
      const n = asNum(v);
      if (n == null) return no();
      if (code === '%' && (n < 0 || n > 100))
        return { bad: name.charAt(0).toUpperCase() + name.slice(1)
                      + ' is a percentage, so it has to be between 0 and 100.' };
      return { v: n };
    }
    case 'd': { const d = asDate(v); return d == null ? no() : { v: d }; }
    case 'D': { const d = asStamp(v); return d == null ? no() : { v: d }; }
    case 'b': { const b = asBool(v); return b == null ? no() : { v: b }; }
    case 'u': case 'f': { const u = asUrl(v); return u == null ? no() : { v: u }; }
    case 'x': return { v: undefined };        // computed elsewhere; drop it
    case 'T': return { v: strip(v == null ? '' : v).slice(0, MAX_LONG) };
    /* The screens join a multi-picklist before it gets here, but an array is
       the honest shape of one and something will hand us a raw one eventually.
       Join it rather than let String() make "[object Object]" of it. */
    case 'P': return { v: (Array.isArray(v) ? v.map(x => strip(x == null ? '' : x)).join(', ')
                                            : strip(v == null ? '' : v)).slice(0, MAX_MULTI) };
    default:  return { v: strip(v == null ? '' : v).slice(0, MAX_TEXT) };
  }
}

/* Out. Throws on the first thing that is wrong, with a sentence a person can
   act on, because every save path already shows what it catches. */
function cleanWrite(w) {
  if (!w || typeof w !== 'object') throw new Error('Nothing to save.');
  const cols = TABLE_COLS[w.table];
  if (!cols) throw new Error('There is no ' + String(w.table).replace(/_/g, ' ') + ' to save to.');
  if (w.op === 'archive') {
    const r = check('i', w.id, 'id');
    if (r.bad || !r.v) throw new Error('That row has no id to remove.');
    return { op: 'archive', table: w.table, id: r.v };
  }
  const rec = {}, src = w.record || {};
  Object.keys(src).forEach(k => {
    const r = check(cols[k] || 't', src[k], k);
    if (r.bad) throw new Error(r.bad);
    if (r.v !== undefined) rec[k] = r.v;
  });
  return { op: w.op || 'upsert', table: w.table, record: rec };
}

/* In. Never throws — the app opens on whatever is in that spreadsheet, and
   says afterwards what it could not read. A row with an unusable id is the one
   thing dropped outright: every screen puts that id inside an onclick, and a
   row nobody can safely refer to is not data, it is a hole. */
function cleanRead(raw) {
  const out = {}, notes = [];
  let dropped = 0;
  Object.keys(TABLE_COLS).forEach(t => { out[t] = []; });
  Object.keys(raw || {}).forEach(table => {
    const cols = TABLE_COLS[table];
    const rows = Array.isArray(raw[table]) ? raw[table] : [];
    if (!cols) return;                        // a tab we do not know: not ours
    out[table] = rows.reduce((keep, row) => {
      if (!row || typeof row !== 'object') { dropped++; return keep; }
      const id = check('i', row.id, 'id');
      if (id.bad) { dropped++; return keep; }
      const rec = {};
      Object.keys(row).forEach(k => {
        /* A formula column is the sheet's answer, not ours: refused on the way
           out, kept as read-only text on the way in so the app can show it. */
        const r = check(cols[k] === 'x' ? 'T' : (cols[k] || 't'), row[k], k);
        if (r.bad) { notes.push(table + '.' + k); rec[k] = ''; }
        else if (r.v !== undefined) rec[k] = r.v;
      });
      rec.id = id.v;
      keep.push(rec);
      return keep;
    }, []);
  });
  const seen = [...new Set(notes)];
  return { db: out, dropped,
           unreadable: seen.slice(0, 6), unreadableN: notes.length };
}

/* ------------------------------------------------------------------------
   An account: the log on Supabase, reached by plain fetch. Built 1 Oct.

   No client library: the site loads nothing from anybody else's server, and
   what the app needs is six requests -- send a sign-in link, start Google,
   refresh a session, sign out, and two calls (everything, apply) that 0003
   adds to the database. The key below is the publishable one: it is meant to
   be in a page, and what it can reach is decided by the rules in 0002, not by
   keeping it secret. */
const SB_URL = 'https://nwiulbgeqhmyfwgnarpv.supabase.co';
const SB_KEY = 'sb_publishable_GCDa4R4mzlOkV1_RnItaFw_0yfsbPf8';

/* A request into a flicker of signal can sit there for a minute. Past 8
   seconds it is treated as no signal: the change waits on the phone and goes
   up later, and the screen moves on (5 Oct). */
function timed(url, opt, ms = 8000) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  return fetch(url, { ...opt, signal: c.signal }).finally(() => clearTimeout(t));
}
const Account = (function () {
  const KEY = 'dwellogs.session';
  const get = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  const put = s => { try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch (e) {} };
  const here = () => location.origin + location.pathname;
  const head = tok => ({ apikey: SB_KEY, 'Content-Type': 'application/json',
                         Authorization: 'Bearer ' + (tok || SB_KEY) });
  // The session's own claims, for the email to show. Read, never trusted: the
  // database checks the token itself.
  const claims = t => { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); }
                        catch (e) { return {}; } };

  /* A link from the email, or Google, lands back here with the session in the
     fragment -- never sent to any server, read once and scrubbed from the
     address bar so it is not left in history or in a screenshot of the URL. */
  function takeFromUrl() {
    const h = location.hash || '';
    if (!/[#&](access_token|error)=/.test(h)) return null;
    const p = new URLSearchParams(h.slice(1));
    history.replaceState(null, '', location.href.split('#')[0]);
    if (p.get('error')) return { error: p.get('error_code') === 'otp_expired'
      ? 'That link has run out or was already used. Ask for a new one.'
      : (p.get('error_description') || 'Signing in did not work.').replace(/\+/g, ' ') };
    const s = { access_token: p.get('access_token'), refresh_token: p.get('refresh_token'),
                expires_at: Number(p.get('expires_at')) || Math.floor(Date.now() / 1000) + Number(p.get('expires_in') || 3600) };
    if (!s.access_token || !s.refresh_token) return { error: 'Signing in did not finish. Try the link again.' };
    put(s);
    return { ok: true };
  }

  async function sendLink(email) {
    const r = await fetch(SB_URL + '/auth/v1/otp?redirect_to=' + encodeURIComponent(here()),
      { method: 'POST', headers: head(), body: JSON.stringify({ email, create_user: true }) });
    if (r.ok) return;
    const j = await r.json().catch(() => ({}));
    if (r.status === 429) throw new Error('Too many links asked for in a short time. Wait a few minutes, then try again.');
    /* Until the project has its own email sender, Supabase's sends only to the
       people on the project (1 Oct). Everybody else gets this, not its code. */
    if (/not authorized/i.test(j.msg || j.message || ''))
      throw new Error('Signing in is open to the first testers for now.');
    throw new Error(j.msg || j.message || j.error_description || 'The link could not be sent.');
  }
  /* The code in the same email, typed into the app you are already in. The
     link opens in the phone's default browser, and on a phone every browser and
     every home-screen app keeps its own storage -- so a link tapped in Mail
     signs in Chrome while the log sits in the home-screen app (found
     on 1 Oct). The code works wherever the app is open. */
  async function verifyCode(email, code) {
    const r = await fetch(SB_URL + '/auth/v1/verify',
      { method: 'POST', headers: head(), body: JSON.stringify({ type: 'email', email, token: code }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.access_token) {
      if (r.status === 429) throw new Error('Too many tries in a short time. Wait a few minutes, then try again.');
      throw new Error(/expired|invalid/i.test(j.msg || j.error_description || j.message || '')
        ? 'That code has run out or is not the one in the email. Ask for a new one.'
        : 'That code did not work. Check it against the email.');
    }
    put({ access_token: j.access_token, refresh_token: j.refresh_token,
          expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600) });
  }
  function google() {
    location.assign(SB_URL + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(here()));
  }
  async function providers() {
    try { const r = await fetch(SB_URL + '/auth/v1/settings', { headers: { apikey: SB_KEY } });
          return (await r.json()).external || {}; }
    catch (e) { return {}; }
  }

  /* A session lasts an hour; the refresh token makes a new one. A refresh that
     is refused (signed out elsewhere, or a year untouched) ends the session
     here too, so the app asks to sign in rather than failing every save. */
  async function token() {
    const s = get(); if (!s) return null;
    if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
    const r = await timed(SB_URL + '/auth/v1/token?grant_type=refresh_token',
      { method: 'POST', headers: head(), body: JSON.stringify({ refresh_token: s.refresh_token }) });
    if (!r.ok) { if (r.status >= 400 && r.status < 500) put(null); throw new Error('Signed out. Sign in again.'); }
    const j = await r.json();
    put({ access_token: j.access_token, refresh_token: j.refresh_token,
          expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600) });
    return j.access_token;
  }

  /* A call into the database. Two kinds of failure, and they are kept apart:
     no signal (fetch throws -- try again later) and a refusal (the database
     answered no -- tell the person). */
  async function rpc(name, args, ms) {
    const tok = await token();
    if (!tok) throw Object.assign(new Error('Not signed in.'), { refused: true });
    const r = await timed(SB_URL + '/rest/v1/rpc/' + name,
      { method: 'POST', headers: head(tok), body: JSON.stringify(args || {}) }, ms);
    const j = await r.json().catch(() => null);
    if (!r.ok) throw Object.assign(new Error(readable((j && (j.message || j.msg)) || r.statusText)), { refused: true });
    return j;
  }
  // The database's own words, turned into ones a person can act on.
  function readable(m) {
    m = String(m || '');
    if (/row-level security|not yours/i.test(m)) return 'That is not yours to change on this place.';
    if (/duplicate key/i.test(m)) return 'Something with that id is already there and is not yours.';
    if (/not signed in/i.test(m)) return 'Signed in, but not set up yet. Open the app again.';
    return m.charAt(0).toUpperCase() + m.slice(1);
  }

  async function signOut() {
    const s = get();
    if (s) fetch(SB_URL + '/auth/v1/logout', { method: 'POST', headers: head(s.access_token) }).catch(() => {});
    put(null);
  }
  const email = () => { const s = get(); return s ? (claims(s.access_token).email || '') : ''; };
  return { signedIn: () => !!get(), takeFromUrl, sendLink, verifyCode, google, providers, rpc, signOut, email };
})();

const DwelLogs = (function () {
  const CFG = { url: '', token: '', property: null };   // set by configure()
  const CACHE = 'dwellogs.cache.v1';
  let db = null;

  /* No URL means local mode: the same API backed by localStorage, so the
     whole first run can be walked through before any deploying happens, and
     so a demo does not need a live sheet. */
  /* A session outranks a sheet: signing in is the newer, deliberate choice. */
  function configure(url, token) {
    CFG.url = url || ''; CFG.token = token || ''; CFG.account = Account.signedIn();
  }
  const LOCAL = 'dwellogs.local.v1';
  /* The account's copy on this phone, and what is waiting to go up. Separate
     from LOCAL on purpose: the device-only log stays exactly as it was until
     moving it up has worked, so a failed move costs nothing. */
  const ACCOUNT = 'dwellogs.account.v1', QUEUE = 'dwellogs.queue.v1';
  const store = () => CFG.account ? ACCOUNT : LOCAL;
  function localDb(key) {
    try { return JSON.parse(localStorage.getItem(key || store()) || 'null'); } catch (e) { return null; }
  }
  function localSave(d) { try { localStorage.setItem(store(), JSON.stringify(d)); } catch (e) {} }
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

  /* Everything that becomes `db` comes through here, whatever it came from:
     the sheet, the cache, this device. The cache is not safer than the sheet
     — it IS the sheet, from five minutes ago — and the device file is one
     devtools console away from anything. So all three get the same reading. */
  let lastRead = { dropped: 0, unreadable: [], unreadableN: 0 };
  function settle(raw) {
    const r = cleanRead(raw);
    lastRead = { dropped: r.dropped, unreadable: r.unreadable, unreadableN: r.unreadableN };
    if (r.dropped || r.unreadableN)
      console.warn('[DwelLogs] ' + r.dropped + ' row(s) dropped, '
        + r.unreadableN + ' value(s) unreadable: ' + r.unreadable.join(', '));
    return r.db;
  }

  async function load({ fresh = true } = {}) {
    if (CFG.account) return accountLoad();
    if (!CFG.url) { db = settle(localDb() || emptyDb()); return { db, local: true, read: lastRead }; }
    if (fresh && CFG.url) {
      try {
        const r = await fetch(CFG.url + '?token=' + encodeURIComponent(CFG.token));
        const j = await r.json();
        if (!j.ok) throw new Error(j.error);
        db = settle(j.data);
        try { localStorage.setItem(CACHE, JSON.stringify({ at: Date.now(), db })); } catch (e) {}
        /* The script says on every reply whether the sheet has the columns this
           version needs. Dropping it here made the "your sheet is a version
           behind" card unreachable -- it was written, it rendered off a flag
           nothing ever set, and the only sign of a stale sheet was a write that
           quietly went nowhere. */
        return { db, stale: false, needsMigration: !!j.needs_migration,
                 appSchema: j.app_schema, sheetSchema: j.sheet_schema, read: lastRead };
      } catch (e) {
        console.warn('[DwelLogs] live read failed, falling back to cache:', e.message);
      }
    }
    try {
      const c = JSON.parse(localStorage.getItem(CACHE) || 'null');
      if (c) { db = settle(c.db); return { db, stale: true, at: c.at, read: lastRead }; }
    } catch (e) {}
    throw new Error('No data, and nothing cached.');
  }

  async function write(writes) {
    /* The gate. Before anything is stored anywhere, local or live: a number
       column holds a number, a date column holds a real day on the calendar,
       an id looks like an id, and text is stripped of the characters nobody
       types. It throws with a sentence, and every save path already shows what
       it catches. */
    writes = (Array.isArray(writes) ? writes : [writes]).map(cleanWrite);
    if (!writes.length) return [];
    if (CFG.account) return accountWrite(writes);
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
  /* ---- account mode ------------------------------------------------------
     The screens keep writing what they always wrote. These two functions are
     the whole difference between a row on the phone and a row in the database:
       out: only the model's columns; blank is null; a tick is true; the app's
            status=archived becomes an archive, which stamps archived_at.
       in:  null is blank; true is 'TRUE'; archived_at is status=archived again
            on the tables that have no status of their own.
     Created and updated times, and who signed in, are the database's to keep. */
  const LOCKED = { person: ['auth_subject', 'auth_provider', 'email_verified'] };
  function toDb(w) {
    if (w.op === 'archive') return [{ op: 'archive', table: w.table, id: w.id }];
    const cols = TABLE_COLS[w.table], src = w.record || {}, rec = {};
    const norm = (k, v) => v === '' || v == null ? null
      : cols[k] === 'b' ? (v === true || String(v).toUpperCase() === 'TRUE') : v;
    const was = ((db || {})[w.table] || []).find(r => r.id === src.id);
    Object.keys(src).forEach(k => {
      if (!(k in cols) || (LOCKED[w.table] || []).includes(k)) return;
      /* A row this phone already has sends only what changed. Screens write the
         whole row back, so a change made offline used to carry the rest of the
         row with it and put back whatever somebody else had changed meanwhile
         (5 Oct). Two people editing different parts of a job no longer collide;
         the same field edited in two places is newest-wins. */
      if (was && k !== 'id' && String(norm(k, was[k])) === String(norm(k, src[k]))) return;
      rec[k] = norm(k, src[k]);
    });
    /* A person written down here belongs to this place's list (person.added_in_id,
       1 Oct), or nobody but themselves could see them. */
    if (!was && w.table === 'person' && !rec.added_in_id && src.id !== localStorage.getItem('dwellogs.me'))
      rec.added_in_id = localStorage.getItem('dwellogs.place') || null;
    const out = [];
    if (!was || Object.keys(rec).some(k => k !== 'id')) out.push({ op: 'upsert', table: w.table, record: rec });
    if (src.status === 'archived' && !('status' in cols)) out.push({ op: 'archive', table: w.table, id: rec.id });
    // Archived here, written back as anything else: brought back, so archived_at
    // is cleared. Only then -- every other save leaves it alone.
    if (was && was.status === 'archived' && src.status && src.status !== 'archived')
      out.push({ op: 'restore', table: w.table, id: rec.id });
    return out;
  }
  function fromDb(all) {
    const raw = {};
    Object.keys(all || {}).forEach(t => {
      const cols = TABLE_COLS[t]; if (!cols) return;
      raw[t] = (all[t] || []).map(row => {
        const rec = {};
        Object.keys(row).forEach(k => {
          const v = row[k];
          rec[k] = v === null ? '' : v === true ? 'TRUE' : v === false ? '' : v;
        });
        if (row.archived_at) rec.status = 'archived';
        else if (!('status' in cols)) rec.status = 'active';
        return rec;
      });
    });
    return raw;
  }
  const queued = () => { try { return JSON.parse(localStorage.getItem(QUEUE) || '[]'); } catch (e) { return []; } };
  const setQueue = q => { try { q.length ? localStorage.setItem(QUEUE, JSON.stringify(q))
                                         : localStorage.removeItem(QUEUE); } catch (e) {} };
  /* Send what is waiting, oldest first. No signal: it stays, and is sent next
     time. Refused: it can never go, so it is dropped and said, and the next
     read puts the phone back in step with what the database actually holds. */
  let refusedNote = '';
  async function flush() {
    let q = queued();
    while (q.length) {
      try { await Account.rpc('apply', { p_writes: q[0] }); }
      catch (e) {
        if (!e.refused) return false;
        refusedNote = 'A change made without signal could not be saved: ' + e.message;
      }
      q = q.slice(1); setQueue(q);
    }
    return true;
  }
  async function accountLoad() {
    try {
      await flush();
      const all = await Account.rpc('everything');
      db = settle(fromDb(all));
      localSave(db);
      const note = refusedNote; refusedNote = '';
      return { db, account: true, read: lastRead, note };
    } catch (e) {
      if (e.refused) throw e;
      const c = localDb();
      if (c) { db = settle(c); return { db, stale: true, account: true, read: lastRead }; }
      throw new Error('No signal, and nothing on this phone yet.');
    }
  }
  /* Saved on the phone first whatever happens, so a screen never waits on the
     signal; then sent. A refusal undoes nothing on the phone by itself -- the
     error is thrown, the screen says it, and the next read restores the truth. */
  async function accountWrite(writes) {
    const batch = writes.flatMap(toDb);
    const out = localWrite(writes);
    if (queued().length) { setQueue(queued().concat([batch])); await flush(); return out; }
    try { await Account.rpc('apply', { p_writes: batch }); }
    catch (e) {
      if (e.refused) throw e;
      setQueue([batch]);
      out.forEach(r => r.warnings.push('Saved on this phone. It goes up when there is signal.'));
    }
    return out;
  }

  /* Moving a phone's own log into the account it just signed in to. Once, in
     one transaction: it all arrives or none of it does, and the phone's copy is
     not touched either way.
     Order matters because the rules check as rows arrive: the place, then your
     own membership of it, then the people on its list, then everything else. A
     lookup to a row that arrives later (a done job's completion, a building
     attached to another) is filled in by a second write at the end. */
  const LATER = { job: ['completion_id', 'parent_job_id', 'depends_on_id', 'bundled_to_id'],
    structure: ['attached_to_id'], area: ['parent_area_id'], asset: ['parent_asset_id', 'replaced_by_id'],
    schedule: ['then_id'], shutoff: ['upstream_shutoff_id'], coverage: ['replaced_by_id'] };
  const FIRST = ['property', 'membership', 'person', 'category', 'asset_type', 'structure', 'area',
    'asset', 'hookup', 'supply_link', 'animal', 'vehicle', 'placement', 'service', 'supply', 'schedule',
    'document', 'coverage', 'job', 'step', 'completion', 'reading'];
  async function liftToAccount(name) {
    const l = localDb(LOCAL) || {};
    const myId = localStorage.getItem('dwellogs.me');
    const id = await Account.rpc('claim_me', { p_name: name || null, p_person_id: myId || null });
    const place = ((l.property || [])[0] || {}).id || null;
    /* Signed in somewhere else first, so the account already has you under
       another id: the phone's rows that point at the phone's you point at that
       one instead, or the move would make you twice. */
    const swap = r => { if (!myId || id === myId) return r;
      const o = {}; Object.keys(r).forEach(k => { o[k] = r[k] === myId ? id : r[k]; }); return o; };
    const tables = FIRST.concat(Object.keys(l).filter(t => !FIRST.includes(t) && TABLE_COLS[t]));
    const now = [], after = [];
    tables.forEach(t => (l[t] || [])
      .filter(r => (t !== 'membership' || r.person_id === myId)
        // claim_me made your own row; it is updated with your name below, not sent twice
        && !(t === 'person' && r.id === myId && id !== myId))
      .concat(t === 'person' ? (l.membership || []).filter(r => r.person_id !== myId)
                               .map(r => ({ __t: 'membership', ...r })) : [])
      .forEach(r0 => {
        const table = r0.__t || t, r = swap({ ...r0 }); delete r.__t;
        if (table === 'person' && r.id !== myId && !r.added_in_id) r.added_in_id = place;
        // Rows from a build older than a required field: filled the way today's
        // app writes them (supabase/load_set.py does the same for saved sets).
        if (table === 'completion') {
          r.what = r.what || ((l.job || []).find(j => j.id === r.job_id) || {}).title || 'Done';
          r.origin = r.origin || 'planned';
        }
        const late = {};
        (LATER[table] || []).forEach(c => { if (r[c]) { late[c] = r[c]; delete r[c]; } });
        toDb({ op: 'upsert', table, record: r }).forEach(x => now.push(x));
        if (Object.keys(late).length) after.push({ op: 'upsert', table, record: { id: r.id, ...late } });
      }));
    // A whole log in one save: longer than the 8 seconds a screen waits. Sent
    // again after a timeout it does no harm -- every write is update-or-insert.
    await Account.rpc('apply', { p_writes: now.concat(after) }, 60000);
    localStorage.setItem('dwellogs.me', id);
    return { id, rows: now.length };
  }
  async function claim(name) { return Account.rpc('claim_me', { p_name: name || null }); }

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
  function localSnapshot() { return localDb(LOCAL); }

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
           localSnapshot, liftToAccount, claim, account: Account,
           /* Send what is waiting, now. The app calls it when the phone says the
              signal is back; it never redraws, so nothing being typed is lost. */
           async sync() { return CFG.account && queued().length ? flush() : true; },
           get pending() { return queued().length; },
           /* Exposed so the negative tests can push rubbish at the gate
              directly rather than through a screen. */
           check, cleanWrite, cleanRead, cols: TABLE_COLS,
           get lastRead() { return lastRead; },
           get raw() { return db; } };
})();
