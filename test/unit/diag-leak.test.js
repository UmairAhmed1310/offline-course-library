// T1.4 (F-04): the diagnostic block must not leak into module text.
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
runInContext(indexHtml.slice(coreStart + 8, coreEnd).trim() + '\n;globalThis.__CORE__ = {parseCourse,parseDiag,md};', ctx);
const { parseCourse, parseDiag, md } = ctx.__CORE__;

const sampleCourse = readFileSync(join(repoRoot, 'examples', 'sample-course.md'), 'utf8');

// Everything a reader, the PDF/Word export or find-in-course can show comes from s.md.
const allText = c => c.secs.map(s => s.title + '\n' + s.md).join('\n');
// What tnodes() counts in find-in-course: text nodes of md(s.md), lowercased. Approximated by stripping tags.
const findText = c => c.secs.map(s => md(s.md).replace(/<[^>]*>/g, ' ')).join('\n').toLowerCase();
const sec = (c, id) => c.secs.find(s => s.id === id);
// Arrays made inside the vm context have another Array prototype; convert before deepEqual against host arrays.
const arr = a => Array.from(a);

// A small course for edge cases. The diagnostic block goes in `inModule`, or in its own page via `page`.
const GOOD_DIAG = [
  '### 0.6 Diagnostic', '',
  '**D1.** Question one? A. a · B. b · C. c · D. d', '',
  '**D2.** Question two? A. a · B. b · C. c · D. d', '',
  'Answers: D1 B, D2 C. Revise unit one.'
].join('\n');
const mini = ({ page = '', inModule = '' } = {}) => [
  '# Mini course (about 1 hours)', '',
  page,
  '## Module 1 · One', '',
  'Intro text.', '',
  inModule, '',
  '## Practice Lab', '',
  '**Q1.** Pick one? (mcq) A. a · B. b · C. c · D. d', '',
  '## Answer Key', '',
  '| Q | Answer | Domain | Why |',
  '| --- | --- | --- | --- |',
  '| 1 | B | D1 | because |', ''
].join('\n');

describe('T1.4: the diagnostic block does not leak into module text', () => {
  describe('examples/sample-course.md', () => {
    let c;
    before(() => { c = parseCourse(sampleCourse).course; });

    it('no section text contains the Answers line', () => {
      assert.doesNotMatch(allText(c), /Answers:/);
      assert.doesNotMatch(allText(c), /D1 B, D2 A, D3 A/);
    });

    it('no section text contains the diagnostic heading or its items', () => {
      assert.doesNotMatch(allText(c), /### 0[.]6/);
      assert.doesNotMatch(allText(c), /\*\*D[0-9]+[.]\*\*/);
    });

    it('find-in-course text has zero hits for "answers"', () => {
      assert.equal(findText(c).split('answers').length - 1, 0);
    });

    it('Module 2 keeps its own text and loses only the block', () => {
      const m2 = sec(c, 'm2').md;
      assert.ok(m2.startsWith('**link:** D2'));
      assert.ok(m2.includes('### Recall check'));
      assert.ok(m2.includes('### Remember'));
      assert.ok(m2.endsWith('CMYK for print, RGB for screens.'));
    });

    it('Module 1 is unchanged', () => {
      const m1 = sec(c, 'm1').md;
      assert.ok(m1.startsWith('**link:** D1'));
      assert.ok(m1.includes('### Recall check'));
      assert.ok(m1.endsWith('A byte is eight bits; a nibble is four.'));
    });

    it('the diagnostic itself still works', () => {
      assert.ok(c.diag);
      assert.equal(c.diag.items.length, 3);
      assert.equal(c.diag.bad, 0);
      assert.deepEqual(arr(c.diag.items.map(i => i.id + i.key[0])), ['D1B', 'D2A', 'D3A']);
      assert.ok(c.diag.advice.includes('additive'));
      assert.deepEqual(c.diag, parseDiag(sampleCourse));
    });

    it('nothing else about the parse changed', () => {
      const r = parseCourse(sampleCourse);
      assert.equal(r.rep.errors.length, 0);
      assert.equal(r.rep.warns.length, 0);
      assert.deepEqual(arr(c.secs.map(s => s.id)), ['p0', 'm1', 'm2']);
      assert.equal(c.qs.length, 5);
      assert.equal(c.qs.filter(q => q.scored).length, 4);
      assert.equal(sec(c, 'm2').dom, 'D2');
    });
  });

  describe('edge cases', () => {
    it('removes the block at the end of a module', () => {
      const c = parseCourse(mini({ inModule: GOOD_DIAG })).course;
      assert.equal(c.diag.items.length, 2);
      assert.equal(sec(c, 'm1').md, 'Intro text.');
    });

    it('keeps text that follows the block under the next ### heading', () => {
      const c = parseCourse(mini({ inModule: GOOD_DIAG + '\n\n### Remember\n\nKept after the block.' })).course;
      assert.equal(sec(c, 'm1').md, 'Intro text.\n\n### Remember\n\nKept after the block.');
      assert.equal(c.diag.items.length, 2);
    });

    it('keeps the text before the block and other numbered headings', () => {
      const c = parseCourse(mini({ inModule: '### 0.5 Study tips\n\nKeep me.\n\n' + GOOD_DIAG })).course;
      assert.equal(sec(c, 'm1').md, 'Intro text.\n\n### 0.5 Study tips\n\nKeep me.');
    });

    it('works when the block sits in a page before Module 1', () => {
      const c = parseCourse(mini({ page: '## Part 0 · About\n\nAbout text.\n\n' + GOOD_DIAG + '\n' })).course;
      const page = c.secs.find(s => s.kind === 'page' && s.title === 'Part 0 · About');
      assert.equal(page.md, 'About text.');
      assert.equal(c.diag.items.length, 2);
    });

    it('drops a page that held nothing but the block', () => {
      const c = parseCourse(mini({ page: '## Part 0 · Diagnostic\n\n' + GOOD_DIAG + '\n' })).course;
      assert.equal(c.secs.some(s => s.title === 'Part 0 · Diagnostic'), false);
      assert.deepEqual(arr(c.secs.filter(s => s.kind === 'module').map(s => s.id)), ['m1']);
      assert.equal(c.diag.items.length, 2);
    });

    it('never drops a module, even if the block was all of its text', () => {
      const src = mini().replace('Intro text.\n', '');
      const c = parseCourse(src.replace('## Module 1 · One\n', '## Module 1 · One\n\n' + GOOD_DIAG + '\n')).course;
      assert.deepEqual(arr(c.secs.filter(s => s.kind === 'module').map(s => s.id)), ['m1']);
      assert.equal(sec(c, 'm1').md, '');
      assert.equal(c.diag.items.length, 2);
    });

    it('keeps the block when no answer key is found (nothing is hidden unless the diagnostic is usable)', () => {
      const src = mini({ inModule: GOOD_DIAG.replace(/^Answers:.*$/m, '') });
      assert.equal(parseDiag(src).items.length, 0);
      const c = parseCourse(src).course;
      assert.equal(c.diag.items.length, 0);
      assert.match(sec(c, 'm1').md, /### 0[.]6/);
      assert.match(sec(c, 'm1').md, /\*\*D1[.]\*\*/);
    });

    it('keeps the block when its items cannot be read at all', () => {
      const src = mini({ inModule: '### 0.6 Diagnostic\n\n**D1.** Only two options? A. a · B. b\n\nAnswers: D1 B.' });
      assert.equal(parseDiag(src), null);
      const c = parseCourse(src).course;
      assert.equal(c.diag, null);
      assert.match(sec(c, 'm1').md, /Answers: D1 B/);
    });

    it('leaves a course without a diagnostic untouched', () => {
      const c = parseCourse(mini({ inModule: '### Remember\n\nJust a note.' })).course;
      assert.equal(c.diag, null);
      assert.equal(sec(c, 'm1').md, 'Intro text.\n\n### Remember\n\nJust a note.');
    });
  });
});
