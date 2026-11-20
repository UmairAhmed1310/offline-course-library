// T1.23: parser hardening. A numeric key may have an exponent; two modules with the same number give a warning;
// one very long line of option markers no longer takes quadratic time; "(about 1 hour)" is accepted.
// Same harness as core.test.js: run the /*CORE*/ block of index.html in a vm context.
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
runInContext(indexHtml.slice(coreStart + 8, coreEnd).trim() + '\n;globalThis.__CORE__ = {parseCourse, splitOptions, grade};', ctx);
const { parseCourse, splitOptions, grade } = ctx.__CORE__;
const has = (list, re) => Array.from(list).some(x => re.test(x));

// A one-question course whose numeric key is `ans`.
const numeric = ans => parseCourse(
  '# T (about 1 hours)\n\n## Module 1 · A\n\ntext\n\n## Practice Lab\n\n**Q1.** How many? (numeric) Enter a number.\n\n## Answer Key\n\n| Q | Answer | Domain | Why |\n| --- | --- | --- | --- |\n| 1 | ' + ans + ' | D1 | w |\n');
const q1 = ans => numeric(ans).course.qs[0];

describe('T1.23: numeric keys with an exponent', () => {
  it('1e3 ± 1 is 1000 with tolerance 1, and is scored', () => {
    const q = q1('1e3 ± 1');
    assert.equal(q.scored, true);
    assert.equal(q.val, 1000);
    assert.equal(q.tol, 1);
  });

  it('capital E, a sign and a decimal point: 2.5E-4 and 6.02e+23', () => {
    assert.equal(q1('2.5E-4 ± 0').val, 0.00025);
    assert.equal(q1('6.02e+23 ± 0').val, 6.02e23);
    assert.equal(q1('-1.5e2 ± 1').val, -150);
  });

  it('the tolerance may have an exponent too', () => {
    const q = q1('5 ± 1e-3');
    assert.equal(q.val, 5);
    assert.equal(q.tol, 0.001);
  });

  it('a unit after the number is kept, also after an exponent', () => {
    const a = q1('3e8 ± 1e5 m/s'), b = q1('12 ± 1 e');
    assert.equal(a.val, 3e8);
    assert.equal(a.unit, 'm/s');
    assert.equal(b.val, 12);
    assert.equal(b.unit, 'e', 'an "e" with no digits after it is a unit, not an exponent');
  });

  it('thousands separators still work, and an exponent key without tolerance still warns', () => {
    assert.equal(q1('10,000 ± 5').val, 10000);
    const r = numeric('1e3');
    assert.equal(r.course.qs[0].val, 1000);
    assert.ok(has(r.rep.warns, /Q1: numeric key has no tolerance/));
  });

  it('a value that is not a finite number is not scored, with the usual warning', () => {
    for (const k of ['1e999 ± 1', '5 ± 1e999', 'abc', '1.2.3 ± 1']) {
      const r = numeric(k);
      assert.equal(r.course.qs[0].scored, false, k);
      assert.ok(has(r.rep.warns, /Q1: numeric key could not be read/), k);
    }
  });

  it('keys without an exponent read exactly as before', () => {
    const a = q1('32 ± 0'), b = q1('11.25 ± 0.1 pts'), c = q1('-4 ± 0.5');
    assert.deepEqual([a.val, a.tol, a.unit], [32, 0, '']);
    assert.deepEqual([b.val, b.tol, b.unit], [11.25, 0.1, 'pts']);
    assert.deepEqual([c.val, c.tol], [-4, 0.5]);
  });

  it('grading works on the exponent value', () => {
    const q = q1('1e3 ± 1');
    assert.equal(grade(q, '1000'), true);
    assert.equal(grade(q, '1,000.5'), true);
    assert.equal(grade(q, '1'), false);
    assert.equal(grade(q, '1e3'), true, 'a learner may type an exponent too (parseFloat reads it)');
  });
});

describe('T1.23: two modules with the same number', () => {
  const course = mods => '# T (about 1 hours)\n\n' + mods.map(n => `## Module ${n} · Title ${n}\n\ntext ${n}\n`).join('\n');

  it('warns once per repeated number, with the number and the count', () => {
    const r = parseCourse(course([1, 2, 2, 2, 3, 3]));
    const w = Array.from(r.rep.warns).filter(x => /appears/.test(x));
    assert.equal(w.length, 2);
    assert.match(w[0], /Module 2 appears 3 times/);
    assert.match(w[1], /Module 3 appears 2 times/);
    assert.equal(r.rep.errors.length, 0, 'still imported: a warning, not an error');
  });

  it('no warning when every module number is different', () => {
    assert.ok(!has(parseCourse(course([1, 2, 3, 10])).rep.warns, /appears/));
  });

  it('the sample course gives no such warning', () => {
    const t = readFileSync(join(repoRoot, 'examples', 'sample-course.md'), 'utf8');
    assert.ok(!has(parseCourse(t).rep.warns, /appears/));
  });
});

describe('T1.23: "(about 1 hour)"', () => {
  const hours = h => parseCourse(`# T ${h}\n\n## Module 1 · A\n\ntext\n`);

  it('accepts the singular', () => {
    const r = hours('(about 1 hour)');
    assert.equal(r.course.hours, 1);
    assert.ok(!has(r.rep.warns, /about N hours/));
  });

  it('still accepts the plural and decimals', () => {
    assert.equal(hours('(about 40 hours)').course.hours, 40);
    assert.equal(hours('(about 1.5 hours)').course.hours, 1.5);
    assert.equal(hours('(About 2 HOURS)').course.hours, 2);
  });

  it('still warns when there is no estimate, or when it has no number', () => {
    for (const h of ['', '(about hours)', '(about 1 minute)']) {
      const r = hours(h);
      assert.equal(r.course.hours, null, h);
      assert.ok(has(r.rep.warns, /about N hours/), h);
    }
  });
});

describe('T1.23: splitOptions on very long lines', () => {
  const options = ' A. one · B. two · C. three · D. four';

  it('a very long line of option markers is split quickly (it took quadratic time)', () => {
    const t0 = performance.now();
    splitOptions('A. B. '.repeat(200000) + options.trim());
    const ms = performance.now() - t0;
    assert.ok(ms < 5000, `took ${Math.round(ms)} ms`);
  });

  it('real options at the end of a stem full of markers are still found', () => {
    const r = splitOptions('Pick one. ' + 'A. B. C. '.repeat(500) + 'Which?' + options);
    assert.deepEqual(Object.keys(r.opts), ['A', 'B', 'C', 'D']);
    assert.equal(r.opts.A, 'one');
    assert.equal(r.opts.D, 'four');
    assert.match(r.stem, /Which\?$/);
  });

  it('ordinary lines read exactly as before: four options, five options, three options when asked', () => {
    assert.deepEqual(Object.keys(splitOptions('Q?' + options).opts), ['A', 'B', 'C', 'D']);
    assert.deepEqual(Object.keys(splitOptions('Q?' + options + ' · E. five').opts), ['A', 'B', 'C', 'D', 'E']);
    assert.deepEqual(Object.keys(splitOptions('Q? A. a · B. b · C. c', 3).opts), ['A', 'B', 'C']);
    assert.deepEqual(Object.keys(splitOptions('No options here').opts), []);
  });

  it('a whole course with one huge question line imports without hanging', () => {
    const line = '**Q1.** ' + 'A. B. '.repeat(100000) + options.trim();
    const t = '# T (about 1 hours)\n\n## Module 1 · A\n\ntext\n\n## Practice Lab\n\n' + line + '\n\n## Answer Key\n\n| Q | Answer | Domain | Why |\n| --- | --- | --- | --- |\n| 1 | A | D1 | w |\n';
    const t0 = performance.now();
    const r = parseCourse(t);
    const ms = performance.now() - t0;
    assert.ok(r.course);
    assert.ok(ms < 5000, `took ${Math.round(ms)} ms`);
  });
});
