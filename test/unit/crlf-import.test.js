// T1.4b: a course file with Windows (CRLF) or old Mac (CR) line endings imports like the same file with LF endings.
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
runInContext(indexHtml.slice(coreStart + 8, coreEnd).trim() + '\n;globalThis.__CORE__ = {parseCourse};', ctx);
const { parseCourse } = ctx.__CORE__;

const lf = readFileSync(join(repoRoot, 'examples', 'sample-course.md'), 'utf8');
assert.ok(!lf.includes('\r'), 'the sample course must use LF line endings');
const toCRLF = s => s.replace(/\n/g, '\r\n');
const toCR = s => s.replace(/\n/g, '\r');
// Line endings in rotation: CRLF, CR, LF. A lone CR before an empty line that ends in LF would read as one CRLF, so use LF there.
const mixed = s => { const L = s.split('\n'); return L.map((l, i) => { if (i === L.length - 1) return l; const e = ['\r\n', '\r', '\n'][i % 3]; return l + (e === '\r' && L[i + 1] === '' ? '\n' : e); }).join(''); };
const has = (list, re) => list.some(x => re.test(x));

describe('T1.4b: line endings at import', () => {
  let ref;
  before(() => { ref = parseCourse(lf); });

  it('the LF sample imports cleanly (reference for the tests below)', () => {
    assert.equal(ref.rep.errors.length, 0);
    assert.equal(ref.rep.warns.length, 0);
    assert.equal(ref.course.secs.filter(s => s.kind === 'module').length, 2);
    assert.equal(ref.course.qs.length, 5);
    assert.equal(ref.course.diag.items.length, 3);
  });

  it('CRLF gives exactly the result of the LF file (report and course)', () => {
    assert.deepEqual(parseCourse(toCRLF(lf)), ref);
  });

  it('lone CR (old Mac) gives exactly the result of the LF file', () => {
    assert.deepEqual(parseCourse(toCR(lf)), ref);
  });

  it('a file that mixes CRLF, CR and LF gives exactly the result of the LF file', () => {
    assert.deepEqual(parseCourse(mixed(lf)), ref);
  });

  it('no carriage return is left in the title, section text or questions', () => {
    const r = parseCourse(toCRLF(lf));
    assert.equal(r.course.title, 'Bits, Bytes and Colour (sample course)');
    assert.ok(!JSON.stringify(r).includes('\\r'));
    assert.ok(r.course.secs.every(s => !s.md.includes('\r') && !s.title.includes('\r')));
  });

  it('the diagnostic is read and its block stays out of the module text (T1.4 with CRLF)', () => {
    const r = parseCourse(toCRLF(lf));
    assert.equal(r.course.diag.items.length, 3);
    assert.equal(r.course.diag.bad, 0);
    assert.ok(r.course.secs.every(s => !/Answers:/.test(s.md)));
  });

  it('a file that ends with several CRLF blank lines imports the same', () => {
    assert.deepEqual(parseCourse(toCRLF(lf) + '\r\n\r\n\r\n'), parseCourse(lf + '\n\n\n'));
  });

  it('a CR inside a line of module text is treated as a line break, not kept', () => {
    const src = ['# T (about 1 hours)', '', '## Module 1 · One', '', 'First\rSecond', ''].join('\n');
    const m = parseCourse(src).course.secs.find(s => s.kind === 'module');
    assert.equal(m.md, 'First\nSecond');
  });

  it('a course that really has no module still reports it, with CRLF too', () => {
    const r = parseCourse('# T\r\n\r\nJust text.\r\n');
    assert.ok(has(r.rep.errors, /No .Module N. sections were found/));
  });
});

describe('T1.4b: the 5 MB limit still looks at the file as it was picked', () => {
  it('rejects a CRLF file longer than 5,000,000 characters even if it would be shorter after normalising', () => {
    const r = parseCourse('\r\n'.repeat(2500001)); // 5,000,002 characters, 2,500,001 after normalising
    assert.ok(has(r.rep.errors, /File is larger than 5 MB/));
    assert.equal(r.course, undefined);
  });

  it('accepts a CRLF file of exactly 5,000,000 characters (no size error)', () => {
    const r = parseCourse('\r\n'.repeat(2500000));
    assert.ok(!has(r.rep.errors, /File is larger than 5 MB/));
  });
});
