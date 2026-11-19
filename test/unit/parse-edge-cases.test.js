// T0.5b: edge-case fixtures for the course parser and the Markdown renderer (CORE block only).
//
// What this covers: parseCourse, md, inl, esc, slug, grade on hostile, malformed, empty and very large input.
// What it does NOT cover: the DOM templates outside CORE (they need the e2e suite), and anything in a browser.
//
// Design rules, so later tasks do not break these tests by accident:
//  - Warnings and errors are matched by substring. The exact list is never asserted (T1.7, T1.15 add to it).
//  - Section text and the exact "info" lines are never asserted (T1.4, T1.15 change them).
//  - Behaviour that is a known defect is pinned in the last block, labelled KNOWN DEFECT or KNOWN LIMIT.
//    The task that fixes it must flip that test on purpose.
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
runInContext(
  indexHtml.slice(coreStart + 8, coreEnd) + '\n;globalThis.__CORE__ = {parseCourse,md,inl,esc,slug,grade,splitOptions};',
  ctx,
);
const { parseCourse, md, inl, esc, slug, grade, splitOptions } = ctx.__CORE__;

// Objects built inside the vm context have other prototypes, so compare plain JSON copies.
const plain = x => JSON.parse(JSON.stringify(x));
const fixture = name => readFileSync(join(repoRoot, 'test', 'fixtures', name), 'utf8');
const modulesOf = course => course.secs.filter(s => s.kind === 'module');
const qWarns = (rep, n) => rep.warns.filter(w => w.startsWith(`Q${n}:`));
const anyQWarn = rep => rep.warns.some(w => /^Q\d+:/.test(w));
const has = (list, re) => list.some(x => re.test(x));

// The only tags md() and inl() may produce, written without attributes.
const SAFE_TAG = /<\/?(?:h[3-6]|p|table|tr|th|td|ul|ol|li|pre|code|b|i)>/g;
// After removing every safe tag, no "<" may be left: any other tag, comment or attribute would show up here.
function assertInert(html, label) {
  const rest = html.replace(SAFE_TAG, '');
  assert.ok(!rest.includes('<'), `${label}: unexpected markup left in the output: ${rest.slice(Math.max(0, rest.indexOf('<') - 20), rest.indexOf('<') + 60)}`);
}

// Course generators (used instead of committing large files).
function bigCourse(mods, perMod) {
  let s = '# Big Generated Course (about 40 hours)\n\n';
  for (let m = 1; m <= mods; m++) s += `## Module ${m} · Topic ${m}\n\n**link:** D${(m % 9) + 1}\n\n${'Lorem ipsum dolor sit amet. '.repeat(10)}\n\n`;
  s += '## Practice Lab\n\n';
  const keys = [], lib = [];
  let n = 0;
  for (let m = 1; m <= mods; m++) {
    for (let k = 0; k < perMod; k++) {
      n++;
      s += `**Q${n}.** Question ${n}? (mcq) A. one · B. two · C. three · D. four\n\n`;
      keys.push(`| ${n} | ${'ABCD'[n % 4]} | D${(m % 9) + 1} | because ${n} |`);
      lib.push(`| big-q-${n} | question | Q${n} | big-mod-${m} | ${['remember', 'understand', 'apply', 'analyze'][n % 4]} |`);
    }
  }
  s += '## Answer Key\n\n| Q | Answer | Domain | Why |\n| --- | --- | --- | --- |\n' + keys.join('\n') + '\n\n';
  s += '## Library Data\n\n| ID | Kind | Label | Parent | Bloom |\n| --- | --- | --- | --- | --- |\n';
  for (let m = 1; m <= mods; m++) s += `| big-mod-${m} | module | Module ${m} | | |\n`;
  return s + lib.join('\n') + '\n';
}
const padTo = len => {
  const head = '# T\n\n## Module 1 · A\n\ntext\n\n';
  return head + 'x'.repeat(len - head.length);
};

describe('fixture: legacy format (no Library Data)', () => {
  const r = parseCourse(fixture('no-library-data.md'));

  it('imports without errors or per-question warnings', () => {
    assert.equal(r.rep.errors.length, 0);
    assert.ok(!anyQWarn(r.rep));
  });

  it('says it is the legacy format', () => {
    assert.ok(has(r.rep.info, /Legacy format/));
  });

  it('reads 2 modules and 4 questions, 3 of them scored', () => {
    assert.deepEqual(plain(modulesOf(r.course).map(s => s.id)), ['m1', 'm2']);
    assert.equal(r.course.qs.length, 4);
    assert.deepEqual(plain(r.course.qs.filter(q => q.scored).map(q => q.n)), [1, 2, 3]);
    assert.equal(r.course.qs.find(q => q.n === 4).scored, false);
  });

  it('attaches no Bloom tags without Library Data', () => {
    for (const q of r.course.qs) assert.equal(q.bloom, undefined);
  });

  it('derives the course id from the title', () => {
    assert.equal(r.course.id, 'legacy-format-course-about-1-hours');
  });

  it('grades the scored questions', () => {
    const q = n => r.course.qs.find(x => x.n === n);
    assert.equal(grade(q(1), ['A']), true);
    assert.equal(grade(q(1), ['B']), false);
    assert.equal(grade(q(2), ['A', 'C']), true);
    assert.equal(grade(q(2), ['A']), false);
    assert.equal(grade(q(3), '4'), true);
    assert.equal(grade(q(3), '5'), false);
  });
});

describe('fixture: no answer key', () => {
  const r = parseCourse(fixture('no-answer-key.md'));

  it('imports without errors', () => {
    assert.equal(r.rep.errors.length, 0);
  });

  it('warns for every question and scores none', () => {
    for (let n = 1; n <= 4; n++) {
      const w = qWarns(r.rep, n);
      assert.equal(w.length, 1, `Q${n} should have exactly one warning`);
      assert.match(w[0], /no answer-key row/);
      assert.match(w[0], /not scored/);
    }
    assert.equal(r.course.qs.length, 4);
    assert.equal(r.course.qs.filter(q => q.scored).length, 0);
  });

  it('still attaches Library Data IDs and Bloom tags to the questions', () => {
    const q1 = r.course.qs.find(q => q.n === 1);
    assert.equal(q1.uid, 'nokey-q-1');
    assert.equal(q1.bloom, 'remember');
  });

  it('keeps the options of the mcq even though it is not scored', () => {
    const q1 = r.course.qs.find(q => q.n === 1);
    assert.deepEqual(Object.keys(q1.opts), ['A', 'B', 'C', 'D']);
    assert.equal(q1.key, undefined);
  });
});

describe('fixture: malformed options and keys', () => {
  const r = parseCourse(fixture('malformed-options.md'));
  const q = n => r.course.qs.find(x => x.n === n);

  it('imports without errors (problems are warnings, never a crash)', () => {
    assert.equal(r.rep.errors.length, 0);
    assert.equal(r.course.qs.length, 11);
  });

  it('warns that options could not be read: separate lines, three options, skipped letter, lower case', () => {
    for (const n of [1, 2, 6, 7]) {
      const w = qWarns(r.rep, n);
      assert.equal(w.length, 1, `Q${n}`);
      assert.match(w[0], /options could not be read/);
      assert.match(w[0], /not scored/);
    }
  });

  it('warns that the key does not match: letter not an option, two letters for mcq, one letter for select-two', () => {
    for (const n of [3, 4, 5]) {
      const w = qWarns(r.rep, n);
      assert.equal(w.length, 1, `Q${n}`);
      assert.match(w[0], /key does not match the options/);
      assert.match(w[0], /not scored/);
    }
  });

  it('splitOptions needs four options by default, and accepts three only when asked', () => {
    const three = 'Stem? A. alpha · B. beta · C. gamma';
    assert.deepEqual(Object.keys(splitOptions(three).opts), []);
    assert.deepEqual(Object.keys(splitOptions(three, 3).opts), ['A', 'B', 'C']);
    assert.deepEqual(Object.keys(splitOptions(three + ' · D. delta').opts), ['A', 'B', 'C', 'D']);
  });

  it('warns that a numeric key made of words could not be read', () => {
    const w = qWarns(r.rep, 8);
    assert.equal(w.length, 1);
    assert.match(w[0], /numeric key could not be read/);
  });

  it('warns that a numeric key without a tolerance only counts an exact match, and still scores it', () => {
    const w = qWarns(r.rep, 9);
    assert.equal(w.length, 1);
    assert.match(w[0], /no tolerance/);
    assert.equal(q(9).scored, true);
    assert.equal(q(9).val, 42);
    assert.equal(q(9).tol, 0);
  });

  it('gives the two well-formed controls no warning and scores them', () => {
    assert.equal(qWarns(r.rep, 10).length, 0);
    assert.equal(qWarns(r.rep, 11).length, 0);
    assert.deepEqual(plain(q(10).key), ['B']);
    assert.deepEqual(Object.keys(q(11).opts), ['A', 'B', 'C', 'D', 'E']);
    assert.deepEqual(plain(q(11).key), ['E']);
  });

  it('scores exactly Q9, Q10 and Q11', () => {
    assert.deepEqual(plain(r.course.qs.filter(x => x.scored).map(x => x.n)), [9, 10, 11]);
  });

  it('never gives an unscored mcq a key', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7]) assert.equal(q(n).key, undefined, `Q${n}`);
  });

  it('warns about a key row that has no question', () => {
    assert.equal(r.rep.warns.filter(w => /Key row 99 has no matching question/.test(w)).length, 1);
  });
});

describe('fixture: hostile strings are inert when rendered', () => {
  const r = parseCourse(fixture('xss-strings.md'));
  const course = r.course;
  const q1 = course.qs.find(q => q.n === 1);

  it('imports without errors and scores both questions', () => {
    assert.equal(r.rep.errors.length, 0);
    assert.ok(!anyQWarn(r.rep));
    assert.deepEqual(plain(course.qs.filter(q => q.scored).map(q => q.n)), [1, 2]);
  });

  it('keeps the text as typed: the parser returns raw text, so rendering must escape it', () => {
    assert.ok(course.title.startsWith('<script>'));
    assert.ok(q1.opts.A.includes('<script>'));
    assert.ok(q1.opts.B.includes('onerror'));
    assert.ok(q1.why.includes('<iframe'));
  });

  it('keeps a hostile Library Data id as typed (ids are data; the app only uses them as keys)', () => {
    const q2 = course.qs.find(q => q.n === 2);
    assert.ok(q2.uid.includes('onerror'));
  });

  it('md() output of every section contains only the app\'s own tags, with no attributes', () => {
    for (const s of course.secs) assertInert(md(s.md), `section ${s.id}`);
  });

  it('the hostile section really went through the table, list and code paths (the test is not vacuous)', () => {
    const html = md(modulesOf(course)[0].md);
    assert.ok(html.includes('<table>'));
    assert.ok(html.includes('<ul>'));
    assert.ok(html.includes('<pre><code>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

  it('inl() of the title, stem, options and why leaves only the app\'s own tags', () => {
    assertInert(inl(course.title), 'title');
    assertInert(inl(q1.stem), 'stem');
    for (const o of Object.values(q1.opts)) assertInert(inl(o), 'option');
    assertInert(inl(q1.why), 'why');
  });

  it('esc() removes every character that could open a tag or close an attribute', () => {
    for (const text of [course.title, q1.stem, ...Object.values(q1.opts), q1.why]) assert.ok(!/[<>"']/.test(esc(text)));
  });
});

describe('structure edge cases', () => {
  it('an empty file has errors but does not throw', () => {
    const r = parseCourse('');
    assert.ok(has(r.rep.errors, /No course title/));
    assert.ok(has(r.rep.errors, /No .Module N. sections were found/));
    assert.equal(modulesOf(r.course).length, 0);
  });

  it('a file with only whitespace behaves like an empty file', () => {
    const r = parseCourse('  \n\n  \n');
    assert.ok(has(r.rep.errors, /No course title/));
  });

  it('a title but no module is an error', () => {
    const r = parseCourse('# Only a title\n');
    assert.ok(!has(r.rep.errors, /No course title/));
    assert.ok(has(r.rep.errors, /No .Module N. sections were found/));
  });

  it('a module but no title is an error', () => {
    const r = parseCourse('## Module 1 · A\n\ntext\n');
    assert.ok(has(r.rep.errors, /No course title/));
  });

  it('a missing hours estimate is a warning, not an error', () => {
    const r = parseCourse('# T\n\n## Module 1 · A\n\ntext\n');
    assert.equal(r.rep.errors.length, 0);
    assert.ok(has(r.rep.warns, /about N hours/));
    assert.equal(r.course.hours, null);
  });

  it('a course with no practice questions is a warning, not an error', () => {
    const r = parseCourse('# T (about 1 hours)\n\n## Module 1 · A\n\ntext\n');
    assert.equal(r.rep.errors.length, 0);
    assert.ok(has(r.rep.warns, /No practice questions/));
  });

  it('a page without a module number is kept as a page, and a module keeps its number as id', () => {
    const r = parseCourse('# T (about 1 hours)\n\n## Intro\n\nhello\n\n## Module 7 · Seven\n\ntext\n');
    assert.deepEqual(plain(r.course.secs.map(s => s.kind)), ['page', 'page', 'module']);
    assert.equal(r.course.secs[2].id, 'm7');
  });

  const nasty = [
    '', ' ', '\n\n', '#', '# ', '## ', '##', '## Module', '## Module 1', '## Module 1 ·', '## Module 99999999999999999999 · big',
    '**Q1.**', '**Q1.** ', '**Q0.** x', '|', '| 1 | B |', '|||||', '| 1 | B | D1 |',
    '## Practice Lab\n**Q1.** x (mcq) A. a · B. b · C. c · D. d\n## Answer Key\n| 1 | B | D1 | w |',
    '## Answer Key\n| 1 | 5 ± | D1 | w |', '## Library Data\n| ID | Kind |\n| x | question |',
    '\u0000', '\uFEFF# Title', '\uD800', '# 😀\n## Module 1 · 😀\nx', '# עברית\n## Module 1 · עברית\nטקסט',
    '\r', '\r\n\r\n', '# T\r\n## Module 1\r\nx\r\n', '`', '```', '**', '*', '\\', '[', ']',
    'x'.repeat(100000), '*'.repeat(100000), '| x '.repeat(20000), '# T\n' + '## Module 1\nx\n'.repeat(500),
  ];
  it(`parseCourse and md never throw on ${nasty.length} odd inputs`, () => {
    for (const t of nasty) {
      const r = parseCourse(t);
      assert.ok(Array.isArray(r.rep.errors) && Array.isArray(r.rep.warns) && Array.isArray(r.rep.info), JSON.stringify(t.slice(0, 30)));
      assert.equal(typeof md(t), 'string');
    }
  });
});

describe('size limits and large courses (generated here, nothing large is committed)', () => {
  it('accepts a file of exactly 5,000,000 characters', () => {
    const r = parseCourse(padTo(5e6));
    assert.ok(!has(r.rep.errors, /5 MB/));
    assert.ok(r.course);
  });

  it('rejects a file of 5,000,001 characters, with no course and nothing else in the report', () => {
    const r = parseCourse(padTo(5e6 + 1));
    assert.deepEqual([...r.rep.errors], ['File is larger than 5 MB.']);
    assert.equal(r.course, undefined);
    assert.equal(r.rep.warns.length, 0);
  });

  it('parses a large valid course (100 modules, 1000 questions) with exact counts, quickly', () => {
    const t0 = performance.now();
    const r = parseCourse(bigCourse(100, 10));
    const ms = performance.now() - t0;
    assert.equal(r.rep.errors.length, 0);
    assert.ok(!anyQWarn(r.rep));
    assert.equal(modulesOf(r.course).length, 100);
    assert.equal(r.course.qs.length, 1000);
    assert.equal(r.course.qs.filter(q => q.scored).length, 1000);
    assert.ok(has(r.rep.info, /1000 questions matched/));
    assert.equal(r.course.qs[999].uid, 'big-q-1000');
    assert.ok(ms < 10000, `parse took ${Math.round(ms)} ms (about 50 ms when this test was written)`);
  });

  it('renders a very long text with md() quickly', () => {
    const t0 = performance.now();
    const html = md('some text line\n'.repeat(200000));
    const ms = performance.now() - t0;
    assert.ok(html.length > 0);
    assert.ok(ms < 10000, `md took ${Math.round(ms)} ms (about 170 ms when this test was written)`);
  });
});

// Everything below pins what the code does TODAY and is wrong or surprising.
// Each test says which change would fix it. When that change lands, update the test in the same PR.
describe('KNOWN DEFECTS and limits (pinned on purpose; flip each when it is fixed)', () => {
  it('FIXED in T1.4b: a course with Windows (CRLF) line endings is read like the same course with LF line endings', () => {
    const lf = fixture('no-library-data.md');
    const a = parseCourse(lf), b = parseCourse(lf.replace(/\n/g, '\r\n'));
    assert.equal(b.rep.errors.length, 0);
    assert.ok(modulesOf(b.course).length > 0);
    assert.equal(modulesOf(b.course).length, modulesOf(a.course).length);
    assert.equal(b.course.qs.length, a.course.qs.length);
    assert.ok(b.course.qs.length > 0);
  });

  it('KNOWN DEFECT: a title with no Latin letters gives an empty course id, so such courses share one id and replace each other on import (fix = a fallback id)', () => {
    for (const title of ['دورة الحاسوب', '课程介绍']) {
      const r = parseCourse(`# ${title}\n\nAbout 1 hours: (about 1 hours)\n\n## Module 1 · A\n\ntext\n`);
      assert.equal(r.rep.errors.length, 0, title);
      assert.equal(r.course.id, '', title);
    }
    assert.equal(slug('دورة'), '');
  });

  it('KNOWN LIMIT: the id is the title cut to 60 characters, so long titles with the same start collide', () => {
    const a = parseCourse(`# ${'A'.repeat(70)} one (about 1 hours)\n\n## Module 1 · A\n\ntext\n`).course;
    const b = parseCourse(`# ${'A'.repeat(70)} two (about 1 hours)\n\n## Module 1 · A\n\ntext\n`).course;
    assert.notEqual(a.title, b.title);
    assert.equal(a.id, b.id);
    assert.equal(a.id.length, 60);
  });

  it('KNOWN LIMIT: accented letters are dropped from the id, not transliterated', () => {
    assert.equal(slug('Intro à la sécurité'), 'intro-la-s-curit');
  });

  it('KNOWN DEFECT: a numeric key in scientific notation is silently read as its first digits (1e3 becomes 1) and still scored', () => {
    const t = '# T (about 1 hours)\n\n## Module 1 · A\n\ntext\n\n## Practice Lab\n\n**Q1.** How many? (numeric) Enter a number.\n\n## Answer Key\n\n| Q | Answer | Domain | Why |\n| --- | --- | --- | --- |\n| 1 | 1e3 ± 1 | D1 | w |\n';
    const q = parseCourse(t).course.qs[0];
    assert.equal(q.scored, true);
    assert.equal(q.val, 1);
    assert.notEqual(q.val, 1000);
  });

  it('KNOWN LIMIT: two modules with the same number give two sections with the same id, and no warning', () => {
    const t = '# T (about 1 hours)\n\n## Module 1 · First\n\none\n\n## Module 1 · Again\n\ntwo\n';
    const r = parseCourse(t);
    assert.deepEqual(plain(modulesOf(r.course).map(s => s.id)), ['m1', 'm1']);
    assert.equal(r.rep.errors.length, 0);
    assert.ok(!has(r.rep.warns, /dup|same|twice|already/i));
  });

  it('KNOWN LIMIT: the 5 MB limit counts characters, not bytes (2,500,000 emoji are 10 MB of UTF-8 and are accepted)', () => {
    const head = '# T\n\n## Module 1 · A\n\ntext\n\n';
    const t = head + '😀'.repeat(2.5e6 - Math.ceil(head.length / 2));
    assert.ok(t.length <= 5e6);
    assert.ok(Buffer.byteLength(t, 'utf8') > 5e6);
    assert.ok(!has(parseCourse(t).rep.errors, /5 MB/));
  });
});
