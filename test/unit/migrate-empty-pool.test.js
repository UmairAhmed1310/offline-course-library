// T1.2b: unit tests for migrateEmptyPoolDone (CORE, pure).
// The app's startup block that calls it is outside CORE and is NOT covered here (see the T1.2b submitted entry).
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
assert.ok(coreStart !== -1, '/*CORE*/ marker not found');
assert.ok(coreEnd !== -1, '/*ENDCORE*/ marker not found');
const ctx = createContext({});
runInContext(indexHtml.slice(coreStart + 8, coreEnd) + '\n;globalThis.__CORE__ = {migrateEmptyPoolDone};', ctx);
const { migrateEmptyPoolDone } = ctx.__CORE__;

// Objects built inside the vm context have other prototypes, so compare plain JSON copies.
const plain = x => JSON.parse(JSON.stringify(x));

// Fixture helpers
const mod = id => ({ kind: 'module', id, title: id, md: 'text' });
const page = id => ({ kind: 'page', id, title: id, md: 'text' });
const sq = (n, m) => ({ n, scored: true, mod: m, dom: '' });
// Replica of the app's pool(c,m) (it lives outside CORE, so the app passes the real one in).
const poolOf = (c, m) => c.qs.filter(q => q.scored && (q.mod ? q.mod === m.id : q.dom && q.dom === m.dom));

// "noq": three modules, no scored questions at all (the Release manager's reproduction).
const noq = { id: 'noq', secs: [page('p0'), mod('m1'), mod('m2'), mod('m3')], qs: [] };
// "mix": m1 has scored questions; m2, m3 and m4 have none.
const mix = { id: 'mix', secs: [mod('m1'), mod('m2'), mod('m3'), mod('m4')], qs: [sq(1, 'm1'), sq(2, 'm1')] };
const NOW = 1700000000000;

describe('migrateEmptyPoolDone (T1.2b)', () => {
  it('marks the question-less module before a done module (the T1.2 defect case)', () => {
    const prog = { p1: { noq: { done: { m3: 1 }, rec: {}, dt: {} } } };
    const out = migrateEmptyPoolDone(prog, [noq], poolOf, NOW);
    assert.deepEqual(plain(out), [['p1', 'noq', 'm1'], ['p1', 'noq', 'm2']]);
    assert.equal(prog.p1.noq.done.m1, 1);
    assert.equal(prog.p1.noq.done.m2, 1);
    assert.equal(prog.p1.noq.done.m3, 1);
    assert.equal(prog.p1.noq.dt.m2, NOW);
  });

  it('cascades: marks every earlier question-less module, not only the one before', () => {
    const prog = { p1: { noq: { done: { m3: 1 } } } };
    migrateEmptyPoolDone(prog, [noq], poolOf, NOW);
    assert.deepEqual(plain(Object.keys(prog.p1.noq.done).sort()), ['m1', 'm2', 'm3']);
  });

  it('counts a recap record (even a failed one) in a later module as progress', () => {
    const prog = { p1: { mix: { done: {}, rec: { m4: { best: 0, tries: 1 } } } } };
    const out = migrateEmptyPoolDone(prog, [mix], poolOf, NOW);
    assert.deepEqual(plain(out), [['p1', 'mix', 'm2'], ['p1', 'mix', 'm3']]);
  });

  it('never marks a module that has scored questions', () => {
    const prog = { p1: { mix: { done: { m4: 1 } } } };
    migrateEmptyPoolDone(prog, [mix], poolOf, NOW);
    assert.equal(prog.p1.mix.done.m1, undefined);
    assert.equal(prog.p1.mix.done.m2, 1);
    assert.equal(prog.p1.mix.done.m3, 1);
  });

  it('does nothing when no module has progress', () => {
    const prog = { p1: { noq: { done: {}, rec: {} } } };
    assert.deepEqual(plain(migrateEmptyPoolDone(prog, [noq], poolOf, NOW)), []);
    assert.deepEqual(plain(prog.p1.noq.done), {});
  });

  it('does not mark the module that has progress, or any module after it', () => {
    const prog = { p1: { mix: { done: { m3: 1 } } } };
    migrateEmptyPoolDone(prog, [mix], poolOf, NOW);
    assert.equal(prog.p1.mix.done.m4, undefined);
    assert.equal(prog.p1.mix.done.m3, 1);
  });

  it('migrates every profile, not only the active one', () => {
    const prog = {
      p1: { noq: { done: { m3: 1 } } },
      p2: { noq: { done: { m2: 1 } } },
      p3: { noq: { done: {} } },
    };
    const out = migrateEmptyPoolDone(prog, [noq], poolOf, NOW);
    assert.deepEqual(plain(out), [['p1', 'noq', 'm1'], ['p1', 'noq', 'm2'], ['p2', 'noq', 'm1']]);
    assert.deepEqual(plain(prog.p3.noq.done), {});
  });

  it('skips progress for a course that is not in the library, and leaves it unchanged', () => {
    const prog = { p1: { gone: { done: { m3: 1 } }, noq: { done: { m3: 1 } } } };
    const before = plain(prog.p1.gone);
    const out = migrateEmptyPoolDone(prog, [noq], poolOf, NOW);
    assert.deepEqual(plain(prog.p1.gone), before);
    assert.equal(out.length, 2);
  });

  it('is idempotent: a second run adds nothing and changes nothing', () => {
    const prog = { p1: { noq: { done: { m3: 1 } } } };
    migrateEmptyPoolDone(prog, [noq], poolOf, NOW);
    const after = plain(prog);
    assert.deepEqual(plain(migrateEmptyPoolDone(prog, [noq], poolOf, NOW + 1000)), []);
    assert.deepEqual(plain(prog), after);
  });

  it('keeps an earlier completion time', () => {
    const prog = { p1: { noq: { done: { m3: 1 }, dt: { m1: 111 } } } };
    migrateEmptyPoolDone(prog, [noq], poolOf, NOW);
    assert.equal(prog.p1.noq.dt.m1, 111);
    assert.equal(prog.p1.noq.dt.m2, NOW);
  });

  it('tolerates progress records that lack done, rec or dt', () => {
    const prog = { p1: { noq: { rec: { m3: { best: 50, tries: 1 } } }, mix: { done: { m4: 1 } } } };
    migrateEmptyPoolDone(prog, [noq, mix], poolOf, NOW);
    assert.equal(prog.p1.noq.done.m2, 1);
    assert.equal(prog.p1.noq.dt.m2, NOW);
    assert.equal(prog.p1.mix.done.m3, 1);
  });

  it('returns [] and does not throw on bad input', () => {
    assert.deepEqual(plain(migrateEmptyPoolDone(null, [noq], poolOf, NOW)), []);
    assert.deepEqual(plain(migrateEmptyPoolDone({}, [noq], poolOf, NOW)), []);
    assert.deepEqual(plain(migrateEmptyPoolDone({ p1: { noq: { done: { m3: 1 } } } }, null, poolOf, NOW)), []);
    assert.deepEqual(plain(migrateEmptyPoolDone({ p1: { noq: { done: { m3: 1 } } } }, [noq], null, NOW)), []);
    assert.deepEqual(plain(migrateEmptyPoolDone({ p1: null, p2: { noq: null, x: 5 } }, [noq], poolOf, NOW)), []);
    assert.deepEqual(plain(migrateEmptyPoolDone({ p1: { noq: { done: { m3: 1 } } } }, [null, { id: 'noq' }], poolOf, NOW)), []);
  });

  it('old-state fixture: a device that already ran the PR #5 build is repaired, and a locked learner is let in', () => {
    // Shape of a stored state after PR #5: the old flag is already true, so only a NEW flag can trigger the fix.
    const S = {
      profiles: [{ id: 'p1', name: 'Me' }, { id: 'p2', name: 'Sam' }], active: 'p1',
      courses: [noq, mix], cfg: { lock: true }, migratedEmptyPool: true,
      prog: {
        p1: { noq: { done: { m3: 1 }, att: [], rec: {}, seen: [], rv: {}, dt: {}, run: 1, ach: [] } },
        p2: { mix: { done: { m1: 1 }, att: [], rec: { m1: { best: 85, tries: 1 }, m3: { best: 40, tries: 2 } }, seen: [], rv: {}, dt: {}, run: 1, ach: [] } },
      },
    };
    // Replica of the T1.2 rule in recOK (outside CORE): no scored questions => needs an explicit "done".
    const recOK = (p, c, m) => { const cp = S.prog[p][c.id]; return poolOf(c, m).length ? ((cp.rec[m.id] || {}).best || 0) >= 80 : !!cp.done[m.id]; };
    assert.equal(recOK('p1', noq, noq.secs[2]), false, 'before: m2 is not done, so the learner is locked out');
    assert.equal(recOK('p2', mix, mix.secs[1]), false, 'before: the other profile is locked out too');
    const marked = migrateEmptyPoolDone(S.prog, S.courses, poolOf, NOW);
    assert.equal(marked.length, 3);
    assert.equal(recOK('p1', noq, noq.secs[2]), true, 'after: m2 counts as done');
    assert.equal(recOK('p2', mix, mix.secs[1]), true, 'after: the other profile is repaired too');
    assert.equal(S.prog.p2.mix.done.m1, 1, 'existing marks are kept');
    assert.equal(S.prog.p2.mix.rec.m3.best, 40, 'recap records are untouched');
  });
});
