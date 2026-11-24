// T1.7 (F-07): a recap prefers questions the learner has not seen, and a module whose recap pool is tiny is warned about at import.
// Same harness as core.test.js: run the /*CORE*/ block of index.html in a vm context.
// The recap click branch is outside CORE, so one test checks its source text.
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
runInContext(indexHtml.slice(coreStart + 8, coreEnd).trim() + '\n;globalThis.__CORE__ = {parseCourse, pick};', ctx);
const { parseCourse, pick } = ctx.__CORE__;
const warnsOf = r => Array.from(r.rep.warns);
const recapWarns = r => warnsOf(r).filter(w => /recap test/.test(w));

const qs = n => Array.from({ length: n }, (_, i) => ({ n: i + 1, scored: true }));

describe('T1.7: pick() and the seen list (what the recap now passes)', () => {
  it('questions not seen come first: 12 questions, 10 seen, a 10-question recap contains both unseen ones, every time', () => {
    const pool = qs(12), seen = pool.slice(0, 10).map(q => q.n);
    for (let i = 0; i < 50; i++) {
      const got = Array.from(pick(pool, 10, seen, null), q => q.n);
      assert.equal(got.length, 10);
      assert.ok(got.includes(11) && got.includes(12), 'unseen questions must be in the recap');
    }
  });

  it('the seen list is matched by uid when a question has one', () => {
    const pool = Array.from({ length: 4 }, (_, i) => ({ n: i + 1, uid: 'q-00' + (i + 1), scored: true }));
    for (let i = 0; i < 30; i++) {
      const got = Array.from(pick(pool, 2, ['q-001', 'q-002'], null), q => q.uid).sort();
      assert.deepEqual(got, ['q-003', 'q-004']);
    }
  });

  it('with an empty seen list (the old behaviour) any questions may come back; with all seen, still a full recap', () => {
    const pool = qs(5);
    assert.equal(pick(pool, 5, [], null).length, 5);
    assert.equal(pick(pool, 5, pool.map(q => q.n), null).length, 5);
  });

  it('a pool smaller than n gives the whole pool (a recap of 1 question stays 1 question)', () => {
    assert.equal(pick(qs(1), 1, [], null).length, 1);
    assert.equal(pick(qs(2), 2, [1], null).length, 2);
  });
});

describe('T1.7: the recap click branch passes the profile seen list', () => {
  it('index.html: the recap branch calls pick(..., CP(c.id).seen, null), not an empty list', () => {
    const line = indexHtml.split('\n').find(l => l.includes("a==='recap'"));
    assert.ok(line, "the a==='recap' branch was not found");
    assert.match(line, /pick\(p,Math\.min\(10,p\.length\),CP\(c\.id\)\.seen,null\)/);
    assert.doesNotMatch(line, /pick\([^)]*\[\]/);
  });
});

// A course with the given number of scored mcq questions in each module (domain D<i>).
const course = sizes => {
  let n = 0, mods = '', lab = '', key = '';
  sizes.forEach((k, i) => {
    mods += `## Module ${i + 1} · Part ${i + 1}\n\n**link:** D${i + 1}\n\ntext\n\n`;
    for (let j = 0; j < k; j++) {
      n++;
      lab += `**Q${n}.** Pick one. (mcq) A. a · B. b · C. c · D. d\n\n`;
      key += `| ${n} | B | D${i + 1} | because |\n`;
    }
  });
  return parseCourse(`# T (about 2 hours)\n\n${mods}## Practice Lab\n\n${lab}## Answer Key\n\n| Q | Answer | Domain | Why |\n| --- | --- | --- | --- |\n${key}`);
};

describe('T1.7: warning for a module with a tiny recap pool', () => {
  it('1 scored question: warns, names the module, says the same question comes back', () => {
    const w = recapWarns(course([1, 5]));
    assert.equal(w.length, 1);
    assert.match(w[0], /^Module 1 · Part 1: only 1 scored question for its recap test, so the same question comes back every time\.$/);
  });

  it('2 scored questions: warns with plural wording', () => {
    const w = recapWarns(course([5, 2]));
    assert.equal(w.length, 1);
    assert.match(w[0], /^Module 2 · Part 2: only 2 scored questions for its recap test, so the same questions come back every time\.$/);
  });

  it('3 or more: no warning (the line is at 3)', () => {
    assert.equal(recapWarns(course([3, 4])).length, 0);
  });

  it('0 scored questions: no recap warning (such a module is finished with "Mark as done")', () => {
    assert.equal(recapWarns(course([0, 4])).length, 0);
  });

  it('one warning per small module, in module order', () => {
    const w = recapWarns(course([1, 2, 6]));
    assert.equal(w.length, 2);
    assert.match(w[0], /^Module 1/);
    assert.match(w[1], /^Module 2/);
  });

  it('the course is still imported (a warning, not an error)', () => {
    const r = course([1, 1]);
    assert.equal(r.rep.errors.length, 0);
    assert.equal(r.course.secs.filter(s => s.kind === 'module').length, 2);
  });

  it('unscored questions do not count: 2 scored + 3 self-check is still 2', () => {
    const t = '# T (about 2 hours)\n\n## Module 1 · A\n\n**link:** D1\n\ntext\n\n## Practice Lab\n\n**Q1.** x (mcq) A. a · B. b · C. c · D. d\n\n**Q2.** x (mcq) A. a · B. b · C. c · D. d\n\n**Q3.** x (short answer) Write.\n\n**Q4.** x (short answer) Write.\n\n**Q5.** x (short answer) Write.\n\n## Answer Key\n\n| Q | Answer | Domain | Why |\n| --- | --- | --- | --- |\n| 1 | B | D1 | w |\n| 2 | B | D1 | w |\n| 3 | Model | D1 | w |\n| 4 | Model | D1 | w |\n| 5 | Model | D1 | w |\n';
    const w = recapWarns(parseCourse(t));
    assert.equal(w.length, 1);
    assert.match(w[0], /only 2 scored questions/);
  });

  it('the module is matched by q.mod when the Library Data sets it (a question of another module does not count)', () => {
    const t = '# T (about 2 hours)\n\n## Module 1 · A\n\n**link:** D1\n\ntext\n\n## Module 2 · B\n\n**link:** D1\n\ntext\n\n## Practice Lab\n\n' +
      [1, 2, 3, 4].map(n => `**Q${n}.** x (mcq) A. a · B. b · C. c · D. d\n\n`).join('') +
      '## Answer Key\n\n| Q | Answer | Domain | Why |\n| --- | --- | --- | --- |\n' + [1, 2, 3, 4].map(n => `| ${n} | B | D1 | w |\n`).join('') +
      '\n## Library Data\n\n| ID | Kind | Label | Parent | Bloom |\n| --- | --- | --- | --- | --- |\n| mod-a | module | Module 1 | | |\n| mod-b | module | Module 2 | | |\n' +
      [1, 2, 3, 4].map(n => `| q-00${n} | question | Q${n} | ${n < 4 ? 'mod-a' : 'mod-b'} | remember |\n`).join('');
    const w = recapWarns(parseCourse(t));
    assert.equal(w.length, 1, w.join(' | '));
    assert.match(w[0], /^Module 2 · B: only 1 scored question /);
  });
});
