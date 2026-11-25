// T1.3a: selfItems picks the questions that are not scored by rules, for the self-check section.
// Same harness as core.test.js: run the /*CORE*/ block of index.html in a vm context.
import { describe, it, before } from 'node:test';
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
runInContext(indexHtml.slice(coreStart + 8, coreEnd).trim() + '\n;globalThis.__CORE__ = {parseCourse, selfItems};', ctx);
const { parseCourse, selfItems } = ctx.__CORE__;

const sample = readFileSync(join(repoRoot, 'examples', 'sample-course.md'), 'utf8');
const nums = list => Array.from(list, q => q.n);
const q = (n, o = {}) => ({ n, scored: false, stem: 'S' + n, ans: '', why: '', dom: '', ...o });

describe('T1.3a: selfItems on the sample course', () => {
  let course, mods;
  before(() => { course = parseCourse(sample).course; mods = course.secs.filter(s => s.kind === 'module'); });

  it('the sample course has two modules and one unscored question (Q4)', () => {
    assert.equal(mods.length, 2);
    assert.deepEqual(nums(course.qs.filter(x => !x.scored)), [4]);
  });

  it('whole course: Q4 with its model answer and explanation', () => {
    const r = selfItems(course.qs);
    assert.deepEqual(nums(r), [4]);
    assert.equal(r[0].ans, 'model answer');
    assert.equal(r[0].why, 'Printers use CMYK because ink subtracts light.');
    assert.match(r[0].stem, /print shop/);
  });

  it('Module 2 gets Q4; Module 1 gets nothing', () => {
    assert.deepEqual(nums(selfItems(course.qs, mods[1])), [4]);
    assert.deepEqual(nums(selfItems(course.qs, mods[0])), []);
  });

  it('returns the question objects themselves, and does not change the input', () => {
    const before = JSON.stringify(course.qs);
    const r = selfItems(course.qs);
    assert.equal(r[0], course.qs.find(x => x.n === 4));
    assert.equal(JSON.stringify(course.qs), before);
  });
});

describe('T1.3a: selfItems rules', () => {
  it('never returns a scored question', () => {
    const qs = [q(1, { scored: true }), q(2), q(3, { scored: true }), q(4)];
    assert.deepEqual(nums(selfItems(qs)), [2, 4]);
  });

  it('a course with no unscored questions gives an empty list', () => {
    assert.deepEqual(nums(selfItems([q(1, { scored: true })])), []);
    assert.deepEqual(nums(selfItems([])), []);
  });

  it('no list at all gives an empty list', () => {
    assert.deepEqual(nums(selfItems(undefined)), []);
  });

  it('questions with no answer-key row (empty ans) are still returned', () => {
    const r = selfItems([q(1), q(2, { ans: 'x' })]);
    assert.deepEqual(nums(r), [1, 2]);
    assert.equal(r[0].ans, '');
  });

  it('keeps course order', () => {
    assert.deepEqual(nums(selfItems([q(3), q(1), q(2)])), [3, 1, 2]);
  });

  it('module match by q.mod when it is set (even if the domain differs)', () => {
    const m = { id: 'm1', dom: 'D1' };
    const qs = [q(1, { mod: 'm1', dom: 'D9' }), q(2, { mod: 'm2', dom: 'D1' }), q(3, { dom: 'D1' }), q(4, { dom: 'D2' }), q(5, { dom: '' })];
    assert.deepEqual(nums(selfItems(qs, m)), [1, 3]);
  });

  it('a module with no domain matches only by q.mod, never an empty domain', () => {
    const m = { id: 'm1', dom: '' };
    assert.deepEqual(nums(selfItems([q(1, { dom: '' }), q(2, { mod: 'm1' })], m)), [2]);
  });

  it('unseen questions come first, then seen ones; order kept inside each group', () => {
    const qs = [q(1), q(2), q(3), q(4)];
    assert.deepEqual(nums(selfItems(qs, null, null, [1, 3])), [2, 4, 1, 3]);
  });

  it('the seen key is uid when present, else n', () => {
    const qs = [q(1, { uid: 'a' }), q(2, { uid: 'b' }), q(3)];
    assert.deepEqual(nums(selfItems(qs, null, null, ['a', 3])), [2, 1, 3]);
  });

  it('n limits the list after the seen ordering', () => {
    const qs = [q(1), q(2), q(3), q(4)];
    assert.deepEqual(nums(selfItems(qs, null, 2, [1])), [2, 3]);
    assert.deepEqual(nums(selfItems(qs, null, 10)), [1, 2, 3, 4]);
    assert.deepEqual(nums(selfItems(qs, null, 0)), []);
  });

  it('is deterministic: same input gives the same list every time', () => {
    const qs = [q(1), q(2), q(3), q(4), q(5)];
    const first = nums(selfItems(qs, null, 3, [2]));
    for (let i = 0; i < 20; i++) assert.deepEqual(nums(selfItems(qs, null, 3, [2])), first);
  });

  it('works with every unscored question type, because it only looks at scored', () => {
    const qs = ['short', 'rubric', 'code', 'mcq', 'numeric'].map((t, i) => q(i + 1, { type: t }));
    assert.deepEqual(nums(selfItems(qs)), [1, 2, 3, 4, 5]);
  });
});
