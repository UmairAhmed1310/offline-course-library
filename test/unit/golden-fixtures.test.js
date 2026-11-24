// T7.20c: what the app's importer makes of the generator skill's four golden fixtures
// (mastery-course-builder V5, tests/fixtures/: good_bank.md, legacy_course.md, quick_course.md, v1_course.md).
// The four files are copied unchanged to test/fixtures/golden/. Their SHA-256 is pinned, so a changed fixture is noticed.
// Pins named "KNOWN LIMIT" record what the app does today and is not wanted; each one says which task changes it.
// Same harness as core.test.js: run the /*CORE*/ block of index.html in a vm context.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
runInContext(indexHtml.slice(coreStart + 8, coreEnd).trim() + '\n;globalThis.__CORE__ = {parseCourse, grade};', ctx);
const { parseCourse, grade } = ctx.__CORE__;

const dir = join(repoRoot, 'test', 'fixtures', 'golden');
const SHA = {
  'good_bank.md': '0c6ba0f886a99e1d',
  'legacy_course.md': '55fb90f2b2c34773',
  'quick_course.md': 'a190d0aa5960dad2',
  'v1_course.md': '7ee46dcf580e21ff',
};
// vm arrays belong to another realm: compare as plain JSON
const J = x => JSON.parse(JSON.stringify(x));
const same = (a, b) => assert.deepStrictEqual(J(a), J(b));
const text = f => readFileSync(join(dir, f), 'utf8');
const parse = f => parseCourse(text(f));
const has = (list, re) => Array.from(list).some(x => re.test(x));
const kinds = c => Array.from(c.secs, s => `${s.id}:${s.kind}`);
const row = q => [q.n, q.type, q.scored ? 'scored' : 'self', q.dom];

describe('T7.20c: the golden fixtures are the files this test was written against', () => {
  for (const [f, sha] of Object.entries(SHA))
    it(f, () => assert.equal(createHash('sha256').update(readFileSync(join(dir, f))).digest('hex').slice(0, 16), sha));
});

describe('T7.20c: v1_course.md (Course Schema v1 with Library Data; the full course)', () => {
  const r = parse('v1_course.md'), c = r.course;

  it('imports with no error; the only warnings are the two small-recap-pool warnings of T1.7 (two scored questions per module)', () => {
    assert.equal(r.rep.errors.length, 0);
    assert.equal(r.rep.warns.length, 2);
    assert.ok(Array.from(r.rep.warns).every(w => /only 2 scored questions for its recap test/.test(w)));
  });

  it('title, id, hours', () => {
    assert.equal(c.title, 'Safe Browsing Basics Mastery Course');
    assert.equal(c.id, 'safe-browsing-basics-mastery-course');
    assert.equal(c.hours, 4);
  });

  it('two modules, with the ids from the Library Data and the domains from the link lines', () => {
    const m = c.secs.filter(s => s.kind === 'module');
    same(m.map(s => [s.id, s.uid, s.dom]), [['m1', 'mod-foundations', 'D1'], ['m2', 'mod-attacks', 'D2']]);
    assert.ok(has(r.rep.info, /Library Data \(Schema v1\) read: 7 questions matched/));
  });

  it('seven questions with the ids q-001 to q-007, the right types and keys', () => {
    same(Array.from(c.qs, q => q.uid), ['q-001', 'q-002', 'q-003', 'q-004', 'q-005', 'q-006', 'q-007']);
    same(c.qs.map(row), [
      [1, 'mcq', 'scored', 'D1'], [2, 'select-two', 'scored', 'D1'], [3, 'mcq', 'scored', 'D2'], [4, 'numeric', 'scored', 'D2'],
      [5, 'rubric', 'self', 'D2'], [6, 'short-answer', 'self', 'D1'], [7, 'code', 'self', 'D2']]);
    same([Array.from(c.qs[0].key), Array.from(c.qs[1].key), Array.from(c.qs[2].key)], [['B'], ['B', 'D'], ['C']]);
    same([c.qs[3].val, c.qs[3].tol, c.qs[3].unit], [12.5, 0.1, '%']);
    assert.ok(c.qs.every(q => q.ans && q.why), 'every question has a key row with a model answer and a reason');
  });

  it('the unscored questions keep their model answer and criteria (what the self-check section will show)', () => {
    assert.equal(c.qs[4].ans, 'Rubric');
    assert.match(c.qs[4].why, /Criteria: \(C1\)/);
    assert.equal(c.qs[5].ans, 'Model answer');
    assert.equal(c.qs[6].ans, 'Tests');
  });

  it('grading the scored questions works on the fixture keys', () => {
    assert.equal(grade(c.qs[0], ['B']), true);
    assert.equal(grade(c.qs[1], ['D', 'B']), true);
    assert.equal(grade(c.qs[3], '12.55'), true);
    assert.equal(grade(c.qs[3], '13'), false);
  });

  it('KNOWN LIMIT (F2): every question has an empty module (the skill leaves Parent empty), so modules get their questions by domain only', () => {
    assert.ok(c.qs.every(q => q.mod === ''));
  });

  it('KNOWN LIMIT: the Bloom tags ([M1-CAC] ...) are in the question text, not read as data: no question has a Bloom level and the tag shows in the stem', () => {
    assert.ok(c.qs.every(q => q.bloom === ''));
    assert.ok(has(r.rep.info, /no Bloom tags yet/));
    assert.ok(c.qs.every(q => /\[M\d-[A-Z]+\]/.test(q.stem)));
  });

  it('KNOWN LIMIT (T7.1): the diagnostic key is read from an "Answers:" line, which this fixture does not have (it has the | P | Ans | Domain | table), so no diagnostic item is usable', () => {
    assert.equal(c.diag.items.length, 0);
    assert.equal(c.diag.bad, 3);
    assert.ok(has(r.rep.info, /Diagnostic: 0 items read, 3 without a key/));
  });
});

describe('T7.20c: legacy_course.md (the same course in the old format, no Library Data)', () => {
  const r = parse('legacy_course.md'), c = r.course;

  it('imports with no error; the legacy note is shown', () => {
    assert.equal(r.rep.errors.length, 0);
    assert.ok(has(r.rep.info, /Legacy format/));
  });

  it('same title and id as v1_course.md (so importing one replaces the other), 4 hours, two modules without uids', () => {
    assert.equal(c.id, parse('v1_course.md').course.id);
    assert.equal(c.hours, 4);
    same(c.secs.filter(s => s.kind === 'module').map(s => [s.id, s.uid || '', s.dom]), [['m1', '', 'D1'], ['m2', '', 'D2']]);
  });

  it('seven questions; Q1 is not scored because its options are on the following lines (warning), the numeric key has no tolerance (warning)', () => {
    same(c.qs.map(row), [
      [1, 'mcq', 'self', 'D1'], [2, 'select-two', 'scored', 'D1'], [3, 'mcq', 'scored', 'D2'], [4, 'numeric', 'scored', 'D2'],
      [5, 'rubric', 'self', 'D2'], [6, 'short-answer', 'self', 'D1'], [7, 'code', 'self', 'D2']]);
    assert.ok(has(r.rep.warns, /Q1: options could not be read/));
    assert.ok(has(r.rep.warns, /Q4: numeric key has no tolerance/));
    assert.ok(has(r.rep.warns, /Module 1.*only 1 scored question for its recap test/));
    assert.ok(has(r.rep.warns, /Module 2.*only 2 scored questions for its recap test/));
    assert.equal(r.rep.warns.length, 4);
  });

  it('the diagnostic is read: three items with keys (this fixture has an Answers line)', () => {
    assert.equal(c.diag.items.length, 3);
    assert.equal(c.diag.bad, 0);
    assert.ok(c.diag.items.every(i => i.key && i.key.length === 1));
  });

  it('questions have no uid (legacy), only a module-less domain', () => {
    assert.ok(c.qs.every(q => !q.uid));
  });
});

describe('T7.20c: quick_course.md (a Quick course: Library Data, questions, no modules)', () => {
  const r = parse('quick_course.md'), c = r.course;

  it('KNOWN LIMIT: it cannot be imported: "No Module N sections were found." is an error (the skill\'s Quick mode has no modules)', () => {
    assert.equal(r.rep.errors.length, 1);
    assert.match(r.rep.errors[0], /No “Module N” sections were found/);
  });

  it('what is read anyway: title and id, three questions with the Library Data ids, two scored', () => {
    assert.equal(c.title, 'Password Hygiene Quick Guide');
    assert.equal(c.id, 'password-hygiene-quick-guide');
    same(Array.from(c.qs, q => q.uid), ['q-001', 'q-002', 'q-003']);
    same(c.qs.map(row), [[1, 'mcq', 'scored', 'D1'], [2, 'numeric', 'scored', 'D1'], [3, 'rubric', 'self', 'D1']]);
    same([c.qs[1].val, c.qs[1].tol], [22, 0]);
    assert.equal(c.hours, null);
    assert.ok(has(r.rep.warns, /about N hours/));
    assert.equal(c.secs.filter(s => s.kind === 'module').length, 0);
  });
});

describe('T7.20c: good_bank.md (a question bank: five questions, no course around them)', () => {
  const r = parse('good_bank.md'), c = r.course;

  it('KNOWN LIMIT: it cannot be imported either ("No Module N sections were found.")', () => {
    assert.equal(r.rep.errors.length, 1);
    assert.match(r.rep.errors[0], /No “Module N” sections were found/);
  });

  it('what is read anyway: title "Sample", five questions (four scored, the rubric one is self-check), no Library Data (legacy ids), no diagnostic', () => {
    assert.equal(c.title, 'Sample');
    assert.equal(c.id, 'sample');
    same(c.qs.map(row), [
      [1, 'mcq', 'scored', 'D1'], [2, 'select-two', 'scored', 'D1'], [3, 'mcq', 'scored', 'D2'], [4, 'numeric', 'scored', 'D2'], [5, 'rubric', 'self', 'D2']]);
    assert.ok(c.qs.every(q => !q.uid));
    assert.equal(c.diag, null);
    assert.ok(has(r.rep.info, /No diagnostic section was found/));
  });
});

describe('T7.20c: what the importer says for each fixture (count of errors and warnings)', () => {
  it('errors / warnings: v1 0/2; legacy 0/4; quick 1/1; bank 1/1', () => {
    const n = f => { const r = parse(f); return [r.rep.errors.length, r.rep.warns.length]; };
    same(n('v1_course.md'), [0, 2]);
    same(n('legacy_course.md'), [0, 4]);
    same(n('quick_course.md'), [1, 1]);
    same(n('good_bank.md'), [1, 1]);
  });
});
