// T1.9a: full backup (build, validate, restore/merge) and the backup notice. CORE block only: pure functions.
//
// What this covers: buildBackup, validateBackup, restoreBackup, backupNotice, progressCount, noteBackup (index.html, CORE).
// What it does NOT cover: the screens, the file download and the file input, the safety backup before "Replace everything",
// storage reads and writes, and "export -> clear site data -> restore" in a browser. Those are T1.9b, T1.11, T1.12 and an e2e test.
//
// State used here is built with the real parsers (parseCourse, parseCats, parseRoads) on the repo's example files, plus the fields
// the app adds when a course is imported (cat, imported, owner, vis).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const indexHtml = readFileSync(join(repoRoot, 'index.html'), 'utf8');
const coreStart = indexHtml.indexOf('/*CORE*/');
const coreEnd = indexHtml.indexOf('/*ENDCORE*/');
assert.ok(coreStart !== -1 && coreEnd !== -1, 'CORE markers not found');
const ctx = createContext({});
runInContext(
  indexHtml.slice(coreStart + 8, coreEnd) +
    '\n;globalThis.__CORE__ = {BK,buildBackup,validateBackup,restoreBackup,backupNotice,progressCount,noteBackup,parseCourse,parseCats,parseRoads};',
  ctx,
);
const { BK, buildBackup, validateBackup, restoreBackup, backupNotice, progressCount, noteBackup, parseCourse, parseCats, parseRoads } = ctx.__CORE__;

// Objects built inside the vm context have other prototypes: compare and pass plain JSON copies.
const P = x => JSON.parse(JSON.stringify(x));
const example = name => readFileSync(join(repoRoot, 'examples', name), 'utf8');
const NOW = 1800000000000;
const DAY = 864e5;

// Same rule as the app's pool(): scored questions of a module, by module id or by domain.
const poolOf = (c, m) => c.qs.filter(q => q.scored && (q.mod ? q.mod === m.id : q.dom && q.dom === m.dom));

const committed = (course, owner = 'p1') => ({ ...P(course), cat: 'Uncategorized', imported: 1700000000000, owner, vis: 'public' });
const sampleCourse = () => committed(parseCourse(example('sample-course.md')).course);
const fullState = () => P({
  profiles: [{ id: 'p1', name: 'Me' }, { id: 'p2', name: 'Sam' }],
  active: 'p2',
  courses: [sampleCourse()],
  prog: {
    p1: {
      'bits-bytes-and-colour-sample-course': {
        done: { m1: 1 }, att: [{ t: 11, got: 2, max: 3, ev: 'rules-0.2', lv: 1, run: 1 }], rec: { m1: { best: 100, tries: 2 } },
        seen: ['sample-q-1', 3], rv: { 'sample-q-1': { stage: 1, due: 5, last: 2 } }, dt: { m1: 1700000000000 }, run: 1, ach: [{ t: 9, run: 1, stars: 3, best: 90 }],
      },
    },
    p2: {},
  },
  cats: parseCats(example('sample-categories.md')).cats,
  roads: parseRoads(example('sample-roadmap.md')).roads,
  gone: { 'old-course': { title: 'Old course', t: 7 } },
  unl: { p1: ['private-one'] },
  cfg: { lock: true, lastBackup: { t: 1700000000000, n: 3 } },
  migEmptyPool2: { t: 5, marked: [['p1', 'bits-bytes-and-colour-sample-course', 'm1']] },
});

const ok = r => { assert.equal(r.ok, true, r.err); return r; };
const built = (state, opts) => ok(buildBackup(state, { now: NOW, appVersion: 'test', ...opts })).backup;
const roundTrip = state => ok(validateBackup(JSON.stringify(built(state))));
const withoutLocalFlags = s => { const x = P(s); delete x.migratedEmptyPool; return x; };

// A course with modules and no scored questions, and a profile record with progress, for the migration tests.
const mod = (id, dom) => ({ kind: 'module', id, title: id, md: '', dom, uid: '' });
const questionLess = id => ({ id, title: id, hours: 1, secs: [{ kind: 'page', id: 'p0', title: 'About', md: '' }, mod('m1', 'D1'), mod('m2', 'D2'), mod('m3', 'D3')], qs: [], diag: null, cat: '', imported: 1, owner: 'p1', vis: 'public' });
const record = over => ({ done: {}, att: [], rec: {}, seen: [], rv: {}, dt: {}, run: 1, ach: [], ...over });
const minimalState = (over = {}) => P({ profiles: [{ id: 'p1', name: 'Me' }], active: 'p1', courses: [], prog: {}, cats: [], roads: [], gone: {}, unl: {}, cfg: { lock: true }, ...over });

describe('buildBackup and validateBackup: round trip', () => {
  it('builds the documented envelope', () => {
    const b = built(fullState());
    assert.equal(b.format, 'olib-backup');
    assert.equal(b.schema, 1);
    assert.equal(b.appVersion, 'test');
    assert.equal(b.exportedAt, NOW);
    assert.deepEqual(Object.keys(b.state).sort(), ['active', 'cats', 'cfg', 'courses', 'gone', 'migEmptyPool2', 'profiles', 'prog', 'roads', 'unl']);
  });

  it('export then validate gives back an identical state (and leaves out what is not a backup field)', () => {
    const s = fullState();
    s.migratedEmptyPool = true; // the PR #5 flag: not part of a backup
    s.somethingElse = { x: 1 };
    const v = roundTrip(s);
    assert.equal(v.clean.kind, 'olib-backup');
    assert.deepEqual(P(v.clean.state), fullState()); // the same state without the two fields above
  });

  it('accepts an already parsed object as well as a JSON string', () => {
    const s = fullState();
    assert.deepEqual(P(ok(validateBackup(P(built(s)))).clean.state), s);
  });

  it('the preview counts profiles, courses and attempts and gives the date', () => {
    const v = roundTrip(fullState());
    assert.deepEqual(P(v.preview), { kind: 'olib-backup', date: NOW, profiles: ['Me', 'Sam'], courses: 1, attempts: 1, hasSource: false });
  });

  it('keeps the optional course source ("src") when there is one, and adds none when there is not', () => {
    const s = fullState();
    assert.equal('src' in roundTrip(s).clean.state.courses[0], false);
    s.courses[0].src = '# Source\n\ntext';
    const v = roundTrip(s);
    assert.equal(v.clean.state.courses[0].src, '# Source\n\ntext');
    assert.equal(v.preview.hasSource, true);
  });

  it('keeps a private course with its salt and password hash, and keeps its owner', () => {
    const s = fullState();
    Object.assign(s.courses[0], { vis: 'private', salt: 'abc123', ph: 'zz9', owner: 'p2' });
    assert.deepEqual(P(roundTrip(s).clean.state.courses[0]), s.courses[0]);
  });

  it('round-trips an empty library with one profile', () => {
    const s = minimalState();
    assert.deepEqual(P(roundTrip(s).clean.state), s);
  });

  it('keeps a course whose id is the empty string (the known T1.22 defect), it is not dropped', () => {
    const s = minimalState({ courses: [{ ...questionLess(''), id: '' }] });
    assert.equal(roundTrip(s).clean.state.courses.length, 1);
  });

  it('keeps text exactly as typed, including markup and non-Latin text (rendering escapes it; the backup does not)', () => {
    const s = fullState();
    s.courses[0].title = '<script>alert(1)</script> دورة 课程 😀';
    s.profiles[0].name = '<b>Me</b>';
    const v = roundTrip(s);
    assert.equal(v.clean.state.courses[0].title, s.courses[0].title);
    assert.equal(v.clean.state.profiles[0].name, '<b>Me</b>');
  });

  it('DRIFT GUARD: every field the real parser and the import step put on a course, a section and a question survives a backup', () => {
    // If this fails, a stored field was added (for example by T1.15) and is not in the whitelist of bkCourse in index.html.
    // Add it there, or backups silently lose it. Then update this test's fixtures if needed.
    const c = sampleCourse();
    const back = roundTrip(minimalState({ courses: [c] })).clean.state.courses[0];
    const keys = o => Object.keys(o).sort();
    assert.deepEqual(keys(P(back)), keys(c), 'course fields');
    assert.deepEqual(keys(P(back.secs[1])), keys(c.secs[1]), 'section fields');
    for (const q of c.qs) assert.deepEqual(keys(P(back.qs.find(x => x.n === q.n))), keys(q), 'question fields of Q' + q.n);
    assert.deepEqual(keys(P(back.diag)), keys(c.diag), 'diagnostic fields');
    assert.deepEqual(keys(P(back.diag.items[0])), keys(c.diag.items[0]), 'diagnostic item fields');
    assert.deepEqual(P(back), c);
  });

  it('cuts profile names to 40 characters', () => {
    const s = minimalState({ profiles: [{ id: 'p1', name: 'x'.repeat(100) }] });
    assert.equal(roundTrip(s).clean.state.profiles[0].name.length, 40);
  });

  it('buildBackup refuses a state that is over a limit, with a clear message', () => {
    const s = minimalState({ profiles: Array.from({ length: BK.profiles + 1 }, (_, i) => ({ id: 'p' + i, name: 'n' })) });
    const r = buildBackup(s, { now: NOW });
    assert.equal(r.ok, false);
    assert.match(r.err, /too many profiles/);
  });
});

describe('validateBackup: old files ({v:1}, what backupProg writes)', () => {
  const rec = P(record({ done: { m1: 1 }, rec: { m1: { best: 100, tries: 1 } }, dt: { m1: 5 } }));

  it('accepts the real shape: progress of every profile, keyed by profile id, labelled with one profile', () => {
    const file = JSON.stringify({ v: 1, t: NOW, profile: { id: 'p2', name: 'Sam' }, prog: { p1: { c1: rec }, p2: { c1: rec } } });
    const v = ok(validateBackup(file));
    assert.equal(v.clean.kind, 'progress-v1');
    assert.deepEqual(P(v.clean.state.profiles), [{ id: 'p1', name: 'Restored profile' }, { id: 'p2', name: 'Sam' }]);
    assert.deepEqual(P(v.clean.state.prog), { p1: { c1: rec }, p2: { c1: rec } });
    assert.deepEqual(P(v.clean.state.courses), []);
    assert.equal(v.preview.date, NOW);
  });

  it('accepts the course-keyed shape (progress of one profile) when the file names the profile', () => {
    const v = ok(validateBackup(JSON.stringify({ v: 1, t: NOW, profile: { id: 'p9', name: 'Zed' }, prog: { c1: rec, c2: rec } })));
    assert.deepEqual(P(v.clean.state.profiles), [{ id: 'p9', name: 'Zed' }]);
    assert.deepEqual(Object.keys(v.clean.state.prog.p9).sort(), ['c1', 'c2']);
  });

  it('rejects the course-keyed shape when the file does not say which profile it is', () => {
    const r = validateBackup(JSON.stringify({ v: 1, t: NOW, prog: { c1: rec } }));
    assert.equal(r.ok, false);
    assert.match(r.err, /does not say which profile/);
  });

  it('rejects progress data of an unknown shape, and a file that holds no progress', () => {
    assert.equal(validateBackup(JSON.stringify({ v: 1, prog: { a: 1 } })).ok, false);
    assert.equal(validateBackup(JSON.stringify({ v: 1, prog: { a: { b: { c: 1 } } } })).ok, false);
    const empty = validateBackup(JSON.stringify({ v: 1, profile: { id: 'p1', name: 'Me' }, prog: {} }));
    assert.equal(empty.ok, false);
    assert.match(empty.err, /holds no progress/);
  });

  it('a version other than 1 is not recognized', () => {
    assert.equal(validateBackup(JSON.stringify({ v: 2, prog: {} })).ok, false);
  });
});

describe('validateBackup: rejects bad files with a clear message', () => {
  const rejected = (input, re) => { const r = validateBackup(input); assert.equal(r.ok, false); assert.match(r.err, re); };
  const file = over => ({ format: 'olib-backup', schema: 1, exportedAt: NOW, state: P(minimalState()), ...over });

  it('not JSON, empty, and JSON that is not an object', () => {
    rejected('{not json', /not valid JSON/);
    rejected('', /not valid JSON/);
    rejected('[1,2]', /not a backup file/);
    rejected('42', /not a backup file/);
    rejected('null', /not a backup file/);
    rejected(null, /not a backup file/);
  });

  it('JSON that is not one of our files', () => {
    rejected('{"hello":"world"}', /not an Offline Course Library backup/);
    rejected(file({ format: 'something-else' }), /not an Offline Course Library backup/);
  });

  it('a missing, wrong or newer format version', () => {
    rejected(file({ schema: undefined }), /no valid format version/);
    rejected(file({ schema: 0 }), /no valid format version/);
    rejected(file({ schema: '1' }), /no valid format version/);
    rejected(file({ schema: BK.schema + 1 }), /newer version of the app/);
  });

  it('missing state, state that is not an object, and a backup with no profiles', () => {
    rejected(file({ state: undefined }), /no data/);
    rejected(file({ state: [] }), /no data/);
    rejected(file({ state: P(minimalState({ profiles: [] })) }), /no profiles/);
  });

  it('a file over the size limit is refused without being parsed', () => {
    rejected('x'.repeat(BK.chars + 1), /too large/);
  });

  it('too many profiles, courses, questions, sections or progress entries', () => {
    rejected(file({ state: P(minimalState({ profiles: Array.from({ length: BK.profiles + 1 }, (_, i) => ({ id: 'p' + i, name: 'n' })) })) }), /too many profiles/);
    rejected(file({ state: P(minimalState({ courses: Array.from({ length: BK.courses + 1 }, (_, i) => ({ id: 'c' + i, title: 't' })) })) }), /too many courses/);
    const big = questionLess('big');
    big.qs = Array.from({ length: BK.qs + 1 }, (_, i) => ({ n: i + 1 }));
    rejected(file({ state: P(minimalState({ courses: [big] })) }), /too many questions/);
    const wide = questionLess('wide');
    wide.secs = Array.from({ length: BK.secs + 1 }, (_, i) => mod('m' + i, 'D'));
    rejected(file({ state: P(minimalState({ courses: [wide] })) }), /too many sections/);
    const done = {};
    for (let i = 0; i <= BK.rows; i++) done['m' + i] = 1;
    rejected(file({ state: P(minimalState({ prog: { p1: { c: record({ done }) } } })) }), /too many entries in a progress record/);
  });
});

describe('validateBackup: hostile content', () => {
  const clean = state => ok(validateBackup({ format: 'olib-backup', schema: 1, exportedAt: NOW, state })).clean.state;

  it('drops __proto__, constructor and prototype keys everywhere, and pollutes nothing', () => {
    const text = `{"format":"olib-backup","schema":1,"exportedAt":1,"state":{
      "profiles":[{"id":"p1","name":"Me"}],"active":"p1","__proto__":{"polluted":"state"},
      "courses":[{"id":"c","title":"t","secs":[],"qs":[{"n":1,"opts":{"A":"a","__proto__":{"polluted":"opts"},"constructor":"x"}}],"__proto__":{"polluted":"course"}}],
      "prog":{"p1":{"c":{"done":{"m1":1,"__proto__":{"polluted":"done"},"constructor":1},"rec":{"__proto__":{"best":1}},"dt":{"prototype":5},"rv":{"__proto__":{}},"att":[],"seen":[],"ach":[],"run":1},"__proto__":{"polluted":"profile"}},"__proto__":{"polluted":"prog"}},
      "cats":[],"roads":[{"id":"r","title":"r","meta":{"__proto__":"x","k":"v"},"levels":[]}],
      "gone":{"__proto__":{"title":"x","t":1},"g":{"title":"g","t":1}},"unl":{"__proto__":["x"],"p1":["c"]},"cfg":{"lock":true,"__proto__":{"polluted":"cfg"}}}}`;
    const v = ok(validateBackup(text)).clean.state;
    assert.equal(Object.prototype.polluted, undefined);
    assert.equal(({}).polluted, undefined);
    assert.deepEqual(Object.keys(v.prog.p1.c.done), ['m1']);
    assert.deepEqual(Object.keys(v.courses[0].qs[0].opts), ['A']);
    assert.deepEqual(Object.keys(v.roads[0].meta), ['k']);
    assert.deepEqual(Object.keys(v.gone), ['g']);
    assert.deepEqual(Object.keys(v.unl), ['p1']);
    assert.deepEqual(Object.keys(v.prog.p1.c.rec), []);
    assert.deepEqual(Object.keys(v.prog.p1.c.dt), []);
    assert.deepEqual(Object.keys(v.prog), ['p1']);
  });

  it('drops unknown keys at every level', () => {
    const s = fullState();
    s.evil = 1; s.courses[0].evil = 1; s.courses[0].secs[1].evil = 1; s.courses[0].qs[0].evil = 1; s.courses[0].diag.evil = 1; s.courses[0].diag.items[0].evil = 1;
    s.profiles[0].evil = 1; s.cats[0].evil = 1; s.roads[0].evil = 1; s.roads[0].levels[0].evil = 1; s.roads[0].levels[0].steps[0].evil = 1; s.cfg.evil = 1; s.gone['old-course'].evil = 1;
    const rec = s.prog.p1['bits-bytes-and-colour-sample-course'];
    rec.evil = 1; rec.att[0].evil = 1; rec.rec.m1.evil = 1; rec.rv['sample-q-1'].evil = 1; rec.ach[0].evil = 1;
    assert.deepEqual(P(clean(s)), fullState());
  });

  it('coerces wrong types instead of trusting them', () => {
    const s = minimalState({
      profiles: [{ id: 'p1', name: 42 }, { id: 7, name: 'x' }, 'text', null],
      courses: [{ id: 'c', title: { a: 1 }, hours: 'many', secs: 'nope', qs: [{ n: '1' }, { n: 2, stem: 5, scored: 'yes', val: 'x', opts: [] }, 'q'], diag: 'd', vis: 7, owner: 3 }],
      prog: { p1: { c: { done: [1], att: 'x', rec: { m1: 'x', m2: { best: '9', tries: null } }, seen: [{}, true, 'ok', 5], rv: 3, dt: { m1: 'x', m2: 4 }, run: 'x', ach: [1, null] } } },
      cfg: { lock: 'yes', lastBackup: 5 },
    });
    const c = clean(s);
    assert.deepEqual(P(c.profiles), [{ id: 'p1', name: 'p1' }]);
    const course = P(c.courses[0]);
    assert.deepEqual([course.title, course.hours, course.secs.length, course.vis, course.owner, course.diag], ['', null, 0, 'public', '', null]);
    assert.deepEqual(P(course.qs), [{ n: 2, opts: {} }]);
    const r = P(c.prog.p1.c);
    assert.deepEqual(r, { done: {}, att: [], rec: { m2: { best: 0, tries: 0 } }, seen: ['ok', 5], rv: {}, dt: { m2: 4 }, run: 1, ach: [] });
    assert.deepEqual(P(c.cfg), {});
  });

  it('turns NaN and Infinity (possible in a parsed object, never in JSON) into plain defaults', () => {
    const s = minimalState();
    s.courses = [{ id: 'c', title: 't', hours: NaN, secs: [], qs: [{ n: Infinity }, { n: 1, val: NaN, tol: Infinity }], imported: -Infinity }];
    s.prog = { p1: { c: { done: {}, att: [{ t: NaN, got: Infinity, max: 1 }], rec: { m1: { best: NaN, tries: 1 } }, seen: [NaN], rv: {}, dt: {}, run: NaN, ach: [] } } };
    const c = clean(s);
    assert.equal(c.courses[0].hours, null);
    assert.equal(c.courses[0].imported, 0);
    assert.deepEqual(P(c.courses[0].qs), [{ n: 1, opts: {} }]);
    const r = P(c.prog.p1.c);
    assert.deepEqual([r.att[0].t, r.att[0].got, r.rec.m1.best, r.seen, r.run], [0, 0, 0, [], 1]);
  });

  it('cuts long strings: ids to 100, titles to 2000, and so on', () => {
    const s = minimalState({ courses: [{ id: 'i'.repeat(500), title: 't'.repeat(5000), secs: [], qs: [], cat: 'c'.repeat(5000), owner: 'p1' }] });
    const c = P(clean(s).courses[0]);
    assert.equal(c.id.length, BK.id);
    assert.equal(c.title.length, BK.line);
    assert.equal(c.cat.length, BK.line);
  });

  it('keeps visibility "private" and turns anything else into "public" (the same meaning the app gives it)', () => {
    const vis = v => clean(minimalState({ courses: [{ ...questionLess('c'), vis: v }] })).courses[0].vis;
    assert.equal(vis('private'), 'private');
    for (const v of ['public', 'PRIVATE', 'secret', 1, null, undefined, true]) assert.equal(vis(v), 'public', String(v));
  });

  it('keeps only the first of duplicate ids for profiles, courses, categories and roadmaps', () => {
    const s = minimalState({
      profiles: [{ id: 'p1', name: 'First' }, { id: 'p1', name: 'Second' }],
      courses: [{ ...questionLess('c'), title: 'First' }, { ...questionLess('c'), title: 'Second' }],
      cats: [{ id: 'k', name: 'First' }, { id: 'k', name: 'Second' }],
      roads: [{ id: 'r', title: 'First', meta: {}, levels: [] }, { id: 'r', title: 'Second', meta: {}, levels: [] }],
    });
    const c = clean(s);
    assert.deepEqual([c.profiles[0].name, c.courses[0].title, c.cats[0].name, c.roads[0].title], ['First', 'First', 'First', 'First']);
    assert.deepEqual([c.profiles.length, c.courses.length, c.cats.length, c.roads.length], [1, 1, 1, 1]);
  });

  it('keeps only option letters A to E and only valid key letters', () => {
    const s = minimalState({ courses: [{ ...questionLess('c'), qs: [{ n: 1, opts: { A: 'a', E: 'e', F: 'f', a: 'x', '': 'y' }, key: ['A', 'F', 'e', 3, 'B'] }] }] });
    const q = P(clean(s).courses[0].qs[0]);
    assert.deepEqual(Object.keys(q.opts), ['A', 'E']);
    assert.deepEqual(q.key, ['A', 'B']);
  });

  it('leaves out progress of a profile that is not in the profile list, and says so', () => {
    const v = ok(validateBackup({ format: 'olib-backup', schema: 1, state: minimalState({ prog: { p1: { c: record() }, ghost: { c: record() } } }) }));
    assert.deepEqual(Object.keys(v.clean.state.prog), ['p1']);
    assert.ok(v.notes.some(n => /unknown profile/.test(n)));
  });

  it('falls back to the first profile when "active" is not a profile of the file', () => {
    assert.equal(clean(minimalState({ active: 'nobody' })).active, 'p1');
  });

  it('keeps a migration record only when it is well formed', () => {
    const m = clean(minimalState({ migEmptyPool2: { t: 9, marked: [['p1', 'c', 'm1'], ['x'], [1, 2, 3], 'junk'] } })).migEmptyPool2;
    assert.deepEqual(P(m), { t: 9, marked: [['p1', 'c', 'm1']] });
    assert.equal('migEmptyPool2' in clean(minimalState({ migEmptyPool2: 'x' })), false);
  });
});

describe('restoreBackup: merge', () => {
  const restore = (current, file, opts) => ok(restoreBackup(current, ok(validateBackup(typeof file === 'string' ? file : JSON.stringify(file))).clean, { mode: 'merge', poolOf, now: NOW, ...opts }));
  const oldFile = (hint, prog) => JSON.stringify({ v: 1, t: NOW, profile: hint, prog });

  it('restores another profile\'s backup on a fresh device (the existing restore refuses this: it demands the same profile id)', () => {
    const fresh = minimalState();
    const r = restore(fresh, oldFile({ id: 'p1794912758988', name: 'Sam' }, { p1: { c1: record({ done: { m1: 1 } }) }, p1794912758988: { c1: record({ done: { m1: 1, m2: 1 } }) } }));
    assert.deepEqual(P(r.state.profiles.map(p => p.name)), ['Me', 'Sam']);
    assert.deepEqual(Object.keys(r.state.prog.p1794912758988.c1.done), ['m1', 'm2']);
    assert.equal(r.state.active, 'p1');
  });

  it('profiles are merged by id: an existing profile keeps its local name', () => {
    const cur = minimalState({ profiles: [{ id: 'p1', name: 'Local name' }] });
    const r = restore(cur, built(minimalState({ profiles: [{ id: 'p1', name: 'File name' }, { id: 'p2', name: 'Sam' }] })));
    assert.deepEqual(P(r.state.profiles), [{ id: 'p1', name: 'Local name' }, { id: 'p2', name: 'Sam' }]);
    assert.equal(r.report.addedProfiles, 1);
  });

  it('courses are merged by id: a course already in the library is kept as it is, new ones are added', () => {
    const local = { ...questionLess('same'), title: 'Local copy' };
    const cur = minimalState({ courses: [local] });
    const file = minimalState({ courses: [{ ...questionLess('same'), title: 'File copy' }, { ...questionLess('new'), title: 'New one' }] });
    const r = restore(cur, built(file));
    assert.deepEqual(P(r.state.courses.map(c => c.title)), ['Local copy', 'New one']);
    assert.deepEqual([r.report.keptCourses, r.report.addedCourses], [1, 1]);
  });

  it('an added course whose owner is not in the library goes to the active profile', () => {
    const cur = minimalState();
    const file = minimalState({ profiles: [{ id: 'p9', name: 'Z' }], courses: [{ ...questionLess('new'), owner: 'p9' }] });
    const r = restore(cur, built(file));
    assert.equal(r.state.courses[0].owner, 'p9'); // the owner is added as a profile, so it stays
    const lost = minimalState({ courses: [{ ...questionLess('new'), owner: 'nobody' }] });
    assert.equal(restore(cur, built(lost)).state.courses[0].owner, 'p1');
  });

  describe('progress: per profile and course, keep the whole record with more completed modules', () => {
    const one = (local, remote) => {
      const cur = minimalState({ prog: { p1: { c: record(local) } } });
      const file = built(minimalState({ prog: { p1: { c: record(remote) } } }));
      const r = restore(cur, file);
      return { r, rec: P(r.state.prog.p1.c) };
    };
    it('the file wins with more completed modules (and the local record is replaced as a whole)', () => {
      const { r, rec } = one({ done: { m1: 1 }, att: [{ t: 1, got: 1, max: 1 }] }, { done: { m1: 1, m2: 1 } });
      assert.deepEqual(Object.keys(rec.done), ['m1', 'm2']);
      assert.equal(rec.att.length, 0);
      assert.equal(r.report.progressReplaced, 1);
    });
    it('the local record wins with more completed modules', () => {
      const { r, rec } = one({ done: { m1: 1, m2: 1 } }, { done: { m1: 1 }, att: [{ t: 1, got: 1, max: 1 }] });
      assert.deepEqual(Object.keys(rec.done), ['m1', 'm2']);
      assert.equal(r.report.progressKept, 1);
    });
    it('tie: more recap tries wins, then more attempts, then the local record', () => {
      assert.equal(one({ done: { m1: 1 }, rec: { m1: { best: 50, tries: 1 } } }, { done: { m1: 1 }, rec: { m1: { best: 50, tries: 3 } } }).rec.rec.m1.tries, 3);
      assert.equal(one({ done: { m1: 1 }, rec: { m1: { best: 50, tries: 3 } } }, { done: { m1: 1 }, rec: { m1: { best: 50, tries: 1 } } }).rec.rec.m1.tries, 3);
      assert.equal(one({ done: { m1: 1 }, att: [] }, { done: { m1: 1 }, att: [{ t: 1, got: 1, max: 1 }] }).rec.att.length, 1);
      assert.equal(one({ done: { m1: 1 }, run: 5 }, { done: { m1: 1 }, run: 9 }).rec.run, 5);
    });
    it('progress for a course that is not in the library is kept, and new profiles\' progress is added', () => {
      const cur = minimalState({ prog: { p1: { a: record({ done: { m1: 1 } }) } } });
      const file = built(minimalState({ profiles: [{ id: 'p1', name: 'Me' }, { id: 'p2', name: 'Sam' }], prog: { p1: { b: record({ done: { m1: 1 } }) }, p2: { a: record({ done: { m1: 1 } }) } } }));
      const r = restore(cur, file);
      assert.deepEqual(Object.keys(r.state.prog.p1).sort(), ['a', 'b']);
      assert.deepEqual(Object.keys(r.state.prog.p2), ['a']);
      assert.equal(r.report.progressAdded, 2);
    });
  });

  it('categories and roadmaps are merged by id (local wins); unlock lists and removed-course notes are unions', () => {
    const cur = minimalState({ cats: [{ id: 'k', name: 'Local', parent: '', desc: '' }], roads: [{ id: 'r', title: 'Local', meta: {}, levels: [] }], gone: { g1: { title: 'one', t: 1 } }, unl: { p1: ['a', 'c'] } });
    const file = minimalState({
      cats: [{ id: 'k', name: 'File', parent: '', desc: '' }, { id: 'k2', name: 'Two', parent: '', desc: '' }],
      roads: [{ id: 'r', title: 'File', meta: {}, levels: [] }, { id: 'r2', title: 'Two', meta: {}, levels: [] }],
      gone: { g1: { title: 'file one', t: 2 }, g2: { title: 'two', t: 2 } }, unl: { p1: ['a', 'b'] },
    });
    const s = restore(cur, built(file)).state;
    assert.deepEqual(P([s.cats.map(c => c.name), s.roads.map(r => r.title)]), [['Local', 'Two'], ['Local', 'Two']]);
    assert.deepEqual(P([s.gone.g1.title, Object.keys(s.gone)]), ['one', ['g1', 'g2']]);
    assert.deepEqual(P(s.unl), { p1: ['a', 'c', 'b'] });
  });

  it('settings and the active profile stay local', () => {
    const cur = minimalState({ profiles: [{ id: 'p1', name: 'Me' }, { id: 'p2', name: 'Sam' }], active: 'p2', cfg: { lock: false } });
    const s = restore(cur, built(minimalState({ cfg: { lock: true } }))).state;
    assert.equal(s.cfg.lock, false);
    assert.equal(s.active, 'p2');
  });

  it('does not change the state or the validated file it is given', () => {
    const cur = minimalState({ prog: { p1: { c: record({ done: { m1: 1 } }) } }, courses: [questionLess('c')] });
    const clean = ok(validateBackup(JSON.stringify(built(fullState())))).clean;
    const before = [P(cur), P(clean)];
    restoreBackup(cur, clean, { mode: 'merge', poolOf, now: NOW });
    restoreBackup(cur, clean, { mode: 'replace', poolOf, now: NOW });
    assert.deepEqual([P(cur), P(clean)], before);
  });

  it('refuses to run without poolOf (it is needed to repair progress), and without a validated file', () => {
    const clean = ok(validateBackup(JSON.stringify(built(fullState())))).clean;
    assert.match(restoreBackup(minimalState(), clean, { mode: 'merge', now: NOW }).err, /poolOf is required/);
    assert.equal(restoreBackup(minimalState(), null, { poolOf, now: NOW }).ok, false);
    assert.equal(restoreBackup(minimalState(), { state: {} }, { poolOf, now: NOW }).ok, false);
  });
});

describe('restoreBackup: replace', () => {
  const clean = state => ok(validateBackup(JSON.stringify(built(state)))).clean;

  it('takes everything from a full backup: profiles, courses, progress, settings, active profile', () => {
    const cur = minimalState({ profiles: [{ id: 'old', name: 'Old' }], active: 'old', courses: [questionLess('local')], cfg: { lock: false } });
    const s = fullState();
    const r = ok(restoreBackup(cur, clean(s), { mode: 'replace', poolOf, now: NOW }));
    assert.deepEqual(P(r.state.profiles), s.profiles);
    assert.deepEqual(P(r.state.courses.map(c => c.id)), s.courses.map(c => c.id));
    assert.equal(r.state.active, 'p2');
    assert.equal(r.state.cfg.lock, true);
    assert.deepEqual(P(r.state.prog), s.prog);
    assert.equal(r.report.mode, 'replace');
  });

  it('works when there is no current state at all (a fresh device)', () => {
    const r = ok(restoreBackup(undefined, clean(fullState()), { mode: 'replace', poolOf, now: NOW }));
    assert.equal(r.state.profiles.length, 2);
  });

  it('gives settings their defaults when the file has none, and moves a course whose owner is gone to the first profile', () => {
    const s = minimalState({ courses: [{ ...questionLess('c'), owner: 'nobody' }], cfg: {} });
    const r = ok(restoreBackup(undefined, clean(s), { mode: 'replace', poolOf, now: NOW }));
    assert.equal(r.state.cfg.lock, true);
    assert.equal(r.state.courses[0].owner, 'p1');
  });

  it('is refused for an old progress-only file (it would wipe the library)', () => {
    const old = ok(validateBackup(JSON.stringify({ v: 1, profile: { id: 'p1', name: 'Me' }, prog: { p1: { c: record() } } }))).clean;
    const r = restoreBackup(minimalState(), old, { mode: 'replace', poolOf, now: NOW });
    assert.equal(r.ok, false);
    assert.match(r.err, /Replace everything needs a full backup/);
  });

  it('export, "clear site data", restore gives back the same state, including the migration record', () => {
    const s = fullState();
    const r = ok(restoreBackup(undefined, clean(s), { mode: 'replace', poolOf, now: NOW }));
    assert.deepEqual(P(r.state), s);
  });
});

describe('restoreBackup: the migration runs on restored progress (owner decision for T1.9a)', () => {
  // A backup made before T1.2b: Module 3 done, Modules 1 and 2 have no scored questions and were never marked.
  const preFix = P({ v: 1, t: NOW, profile: { id: 'p1', name: 'Me' }, prog: { p1: { a: record({ done: { m3: 1 } }) } } });
  const library = () => minimalState({ courses: [questionLess('a')] });
  const merge = (cur, file, opts) => ok(restoreBackup(cur, ok(validateBackup(JSON.stringify(file))).clean, { mode: 'merge', poolOf, now: NOW, ...opts }));

  it('an old backup restored into a library that has the course gets its earlier modules marked', () => {
    const r = merge(library(), preFix);
    assert.deepEqual(Object.keys(r.state.prog.p1.a.done).sort(), ['m1', 'm2', 'm3']);
    assert.equal(r.report.marked, 2);
    assert.deepEqual(P(r.state.migEmptyPool2), { t: NOW, marked: [['p1', 'a', 'm1'], ['p1', 'a', 'm2']] });
  });

  it('the marks are appended to an existing migration record, which keeps its time', () => {
    const cur = library();
    cur.migEmptyPool2 = { t: 5, marked: [['p1', 'z', 'm1']] };
    const r = merge(cur, preFix);
    assert.deepEqual(P(r.state.migEmptyPool2), { t: 5, marked: [['p1', 'z', 'm1'], ['p1', 'a', 'm1'], ['p1', 'a', 'm2']] });
  });

  it('a full backup made before the fix and restored with "replace" is repaired too', () => {
    const file = built(minimalState({ courses: [questionLess('a')], prog: { p1: { a: record({ done: { m3: 1 } }) } } }));
    const r = ok(restoreBackup(undefined, ok(validateBackup(JSON.stringify(file))).clean, { mode: 'replace', poolOf, now: NOW }));
    assert.deepEqual(Object.keys(r.state.prog.p1.a.done).sort(), ['m1', 'm2', 'm3']);
    assert.equal(r.state.migEmptyPool2.marked.length, 2);
  });

  it('restoring the same file again adds nothing and changes nothing', () => {
    const once = merge(library(), preFix);
    const twice = merge(once.state, preFix);
    assert.equal(twice.report.marked, 0);
    assert.deepEqual(P(twice.state.prog), P(once.state.prog));
    assert.deepEqual(P(twice.state.migEmptyPool2), P(once.state.migEmptyPool2));
  });

  it('never marks a module that has scored questions, and does nothing for a course that is not in the library', () => {
    const withQs = questionLess('a');
    withQs.qs = [{ n: 1, scored: true, mod: 'm1' }];
    const r = merge(minimalState({ courses: [withQs] }), preFix);
    assert.deepEqual(Object.keys(r.state.prog.p1.a.done).sort(), ['m2', 'm3']);
    const absent = merge(minimalState(), preFix);
    assert.deepEqual(Object.keys(absent.state.prog.p1.a.done), ['m3']);
    assert.equal(absent.report.marked, 0);
  });

  it('uses the courses given in opts.courses when the library does not have them yet', () => {
    const r = merge(minimalState(), preFix, { courses: [questionLess('a')] });
    assert.deepEqual(Object.keys(r.state.prog.p1.a.done).sort(), ['m1', 'm2', 'm3']);
  });
});

describe('progressCount, noteBackup and backupNotice', () => {
  const prog = { p1: { a: record({ done: { m1: 1, m2: 1 }, att: [{}, {}], rec: { m1: { best: 1, tries: 3 } } }) }, p2: { a: record({ done: { m1: 1 } }) } };

  it('progressCount adds done modules, attempts and recap tries over all profiles, and survives junk', () => {
    assert.equal(progressCount(prog), 2 + 2 + 3 + 1);
    for (const junk of [null, undefined, 5, 'x', [], { p: null }, { p: { c: 3 } }, { p: { c: { done: 3, att: 'x', rec: 7 } } }]) assert.equal(progressCount(junk), 0);
  });

  it('noteBackup gives what to store as cfg.lastBackup', () => {
    assert.deepEqual(P(noteBackup(NOW, prog)), { t: NOW, n: 8 });
  });

  it('no progress, no notice', () => {
    assert.deepEqual(P(backupNotice(undefined, {}, NOW, true)), { show: false, reason: '', days: null, n: 0 });
  });

  it('never backed up: the notice starts with 3 progress units', () => {
    const few = { p1: { a: record({ done: { m1: 1, m2: 1 } }) } };
    assert.equal(backupNotice(undefined, few, NOW, true).show, false); // 2 units
    const three = { p1: { a: record({ done: { m1: 1, m2: 1, m3: 1 } }) } };
    assert.deepEqual(P(backupNotice(undefined, three, NOW, true)), { show: true, reason: 'never', days: null, n: 3 }); // exactly 3 units
    const r = backupNotice(undefined, prog, NOW, true);
    assert.deepEqual([r.show, r.reason, r.days], [true, 'never', null]);
    assert.equal(backupNotice({}, prog, NOW, true).reason, 'never');
    assert.equal(backupNotice({ t: 0, n: 0 }, prog, NOW, true).reason, 'never');
  });

  it('the last backup is 14 days old, or 7 when storage is not persistent', () => {
    const last = d => ({ t: NOW - d * DAY, n: progressCount(prog) });
    assert.equal(backupNotice(last(13), prog, NOW, true).show, false);
    assert.deepEqual(P(backupNotice(last(14), prog, NOW, true)), { show: true, reason: 'age', days: 14, n: 8 });
    assert.equal(backupNotice(last(6), prog, NOW, false).show, false);
    assert.equal(backupNotice(last(7), prog, NOW, false).reason, 'age');
    assert.equal(backupNotice(last(7), prog, NOW, null).show, false);
    assert.equal(backupNotice(last(7), prog, NOW, undefined).show, false);
  });

  it('10 or more new progress units since the last backup show the notice', () => {
    assert.equal(backupNotice({ t: NOW - DAY, n: 0 }, { p1: { a: record({ done: Object.fromEntries(Array.from({ length: 9 }, (_, i) => ['m' + i, 1])) }) } }, NOW, true).show, false);
    const r = backupNotice({ t: NOW - DAY, n: 0 }, { p1: { a: record({ done: Object.fromEntries(Array.from({ length: 10 }, (_, i) => ['m' + i, 1])) }) } }, NOW, true);
    assert.deepEqual([r.show, r.reason, r.days], [true, 'progress', 1]);
  });

  it('a clock that runs backwards, and bad stored values, do not break it', () => {
    assert.equal(backupNotice({ t: NOW + 5 * DAY, n: 1 }, prog, NOW, true).days, 0);
    assert.doesNotThrow(() => backupNotice({ t: 'x', n: {} }, prog, NaN, true));
    assert.doesNotThrow(() => backupNotice(7, prog, NOW));
  });
});

describe('validateBackup and restoreBackup: seeded fuzzing (never throws, always stable)', () => {
  // A small seeded random generator, so a failure can be repeated: the message says which round failed.
  const rng = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // Fresh values every time (shared objects could end up inside themselves).
  const JUNK = [() => null, () => undefined, () => true, () => false, () => 0, () => -1, () => 1e308, () => NaN, () => Infinity, () => '', () => 'x', () => 'x'.repeat(300), () => '__proto__', () => [], () => ({}), () => [1, 2], () => ({ a: 1 }), () => [[]], () => ({ done: 1 })];
  const isObj = x => x !== null && typeof x === 'object';

  function mutate(root, rnd) {
    const pick = a => a[Math.floor(rnd() * a.length)];
    let parent = root, key = null, node = root;
    for (let depth = 1 + Math.floor(rnd() * 7); depth > 0 && isObj(node) && Object.keys(node).length; depth--) { parent = node; key = pick(Object.keys(node)); node = parent[key]; }
    if (key === null) return;
    const op = pick(['delete', 'junk', 'junk', 'proto', 'swap']);
    if (op === 'delete') delete parent[key];
    else if (op === 'junk') parent[key] = pick(JUNK)();
    else if (op === 'proto') Object.defineProperty(parent, pick(['__proto__', 'constructor', 'prototype']), { value: { polluted: 1 }, enumerable: true, configurable: true, writable: true });
    else if (op === 'swap' && isObj(node)) parent[key] = Array.isArray(node) ? { ...node } : Object.values(node);
  }

  const valid = () => P({ format: 'olib-backup', schema: 1, appVersion: 'f', exportedAt: NOW, state: fullState() });

  it('600 randomly damaged backups: no exception, a clear refusal or a stable clean result, no pollution', () => {
    for (let round = 0; round < 600; round++) {
      const rnd = rng(1000 + round);
      const file = valid();
      for (let n = 1 + Math.floor(rnd() * 4); n > 0; n--) mutate(file, rnd);
      let input = file;
      if (rnd() < 0.5) { input = JSON.stringify(file); if (rnd() < 0.15) input = input.slice(0, Math.floor(rnd() * input.length)); }
      let v;
      assert.doesNotThrow(() => { v = validateBackup(input); }, 'validateBackup threw in round ' + round);
      assert.equal(typeof v.ok, 'boolean', 'round ' + round);
      assert.equal(Object.keys(Object.prototype).length, 0, 'Object.prototype was changed in round ' + round);
      assert.equal(({}).polluted, undefined, 'pollution in round ' + round);
      if (!v.ok) { assert.ok(typeof v.err === 'string' && v.err.length > 5, 'no message in round ' + round); continue; }
      const st = P(v.clean.state);
      assert.ok(st.profiles.length >= 1, 'no profile in round ' + round);
      assert.equal(new Set(st.profiles.map(p => p.id)).size, st.profiles.length, 'duplicate profile ids in round ' + round);
      for (const pid of Object.keys(st.prog)) assert.ok(st.profiles.some(p => p.id === pid), 'orphan progress in round ' + round);
      assert.ok(st.profiles.some(p => p.id === st.active), 'bad active profile in round ' + round);
      // stable: backing the clean state up and validating it again gives the same state
      const again = validateBackup(JSON.stringify(ok(buildBackup(st, { now: NOW })).backup));
      assert.equal(again.ok, true, 'second pass failed in round ' + round + ': ' + again.err);
      assert.deepEqual(P(again.clean.state), st, 'not stable in round ' + round);
      // and it can be restored, merged and replaced, without an exception
      for (const mode of ['merge', 'replace']) {
        let r;
        assert.doesNotThrow(() => { r = restoreBackup(minimalState({ courses: [questionLess('a')] }), v.clean, { mode, poolOf, now: NOW }); }, 'restoreBackup (' + mode + ') threw in round ' + round);
        assert.equal(r.ok, true, 'restore failed in round ' + round + ': ' + r.err);
        assert.ok(Array.isArray(r.state.profiles) && r.state.profiles.length >= 1 && r.state.profiles.some(p => p.id === r.state.active), 'bad restored state in round ' + round);
      }
    }
  });
});
