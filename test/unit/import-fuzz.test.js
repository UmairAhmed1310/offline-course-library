import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

// T1.17: fuzz-style guard. No importer entry point in CORE may throw on a crafted file,
// whatever its content. (The page also wraps every import in try/catch; this keeps the parsers themselves honest.)
const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const html = readFileSync(join(repoRoot, 'index.html'), 'utf8');
const coreStart = html.indexOf('/*CORE*/');
const coreEnd = html.indexOf('/*ENDCORE*/');
assert.ok(coreStart !== -1 && coreEnd !== -1, 'CORE markers not found');

const ctx = createContext({});
runInContext(html.slice(coreStart + 8, coreEnd) + '\n;globalThis.__API__={parseCourse,parseCats,parseRoads,parseDiag,restoreProg}', ctx);
const { parseCourse, parseCats, parseRoads, parseDiag, restoreProg } = ctx.__API__;

// Small deterministic generator, so a failure can be reproduced
let seed = 20261117;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const pick = a => a[Math.floor(rnd() * a.length)];
const TOKENS = ['# ', '## ', '### ', '| ', '|', ' | ', '---', '| --- | --- |', '**Q1.** ', '(mcq)', '(select two)', '(numeric)', ' A. ', ' B. ', ' · ',
  'Answers: ', 'D1 ', '\n', '\n\n', '\r\n', '\r', '\t', '1', '0', '-1', '1e3', 'NaN', 'Infinity', 'é', '中', '😀', '\u0000', '\u202e', '\ud800', '\udfff',
  '`', '**', '[', '](', '<script>', '&amp;', '{', '}', '"', '\\', 'Library Data', '0.6 Diagnostic', 'link:', 'Module 1', 'Level 1 ·', 'Roadmap:',
  'pack_type', 'category', 'roadmap', 'ID', 'Name', 'Parent', 'Step', 'Course ID', 'Required', 'Covers', '__proto__', 'constructor', 'toString'];
const GENERATORS = [
  () => Array.from({ length: 1 + Math.floor(rnd() * 60) }, () => pick(TOKENS)).join(''),
  () => Array.from({ length: Math.floor(rnd() * 400) }, () => String.fromCharCode(Math.floor(rnd() * 65536))).join(''),
  () => Array.from({ length: Math.floor(rnd() * 1500) }, () => pick(TOKENS) + (rnd() < 0.3 ? '\n' : '')).join(''),
  () => pick(TOKENS).repeat(1 + Math.floor(rnd() * 5000)),
  () => '## Module 1 · x\n\n' + Array.from({ length: Math.floor(rnd() * 200) }, (_, i) => `**Q${i}.** ${pick(TOKENS)} ${pick(['(mcq)', '(numeric)', '(select two)', ''])} A. ${pick(TOKENS)} · B. ${pick(TOKENS)}\n`).join(''),
  () => '# ' + pick(TOKENS) + '\n\n| ID | Name | Parent | Description |\n| --- | --- | --- | --- |\n' + Array.from({ length: Math.floor(rnd() * 60) }, () => `| ${pick(TOKENS)} | ${pick(TOKENS)} | ${pick(TOKENS)} | ${pick(TOKENS)} |`).join('\n'),
  () => '# Roadmap: ' + pick(TOKENS) + '\n\n| Field | Value |\n| --- | --- |\n| id | ' + pick(TOKENS) + ' |\n\n## Level 1 · ' + pick(TOKENS) + '\n\n| Step | Course ID | Required | Covers | Note |\n| --- | --- | --- | --- | --- |\n' + Array.from({ length: Math.floor(rnd() * 50) }, () => `| ${pick(TOKENS)} | ${pick(TOKENS)} | ${pick(TOKENS)} | ${pick(TOKENS)} | ${pick(TOKENS)} |`).join('\n'),
];
const BIG = ['a'.repeat(1e6), '|'.repeat(2e5), '## M\n'.repeat(3e4), '**Q1.** x (mcq) ' + 'A. y · '.repeat(3e4), '\n'.repeat(3e5)];
const JSON_CASES = ['', 'null', '[]', '1', '"x"', '{}', '{"v":1}', '{"v":2}', '{"v":1,"profile":null}', '{"v":1,"profile":{"name":1},"prog":null}',
  '{"v":1,"profile":{"name":"A"},"prog":{"a":null}}', '{"__proto__":{"x":1}}', '{"v":1,"prog":{"__proto__":{"done":1}}}', '['.repeat(500) + ']'.repeat(500),
  '{"v":1,"profile":{"id":"p1","name":"X"},"prog":{"c":{"done":5,"rec":"x","att":3,"seen":{}}}}', '{"v":1,"prog":{"c":{"done":{},"rec":{},"att":[],"seen":[]}}}'];

function neverThrows(label, fn, inputs) {
  for (const input of inputs) {
    try { fn(input); } catch (e) {
      assert.fail(`${label} threw "${e && e.message}" on input starting ${JSON.stringify(String(input).slice(0, 120))}`);
    }
  }
}
const inputs = n => Array.from({ length: n }, () => pick(GENERATORS)());
const prof = [{ id: 'p1', name: 'Me' }];

describe('importer entry points never throw on crafted files (T1.17)', () => {
  it('parseCourse', () => neverThrows('parseCourse', t => { const r = parseCourse(t); assert.equal(typeof r, 'object'); assert.ok(r && r.rep, 'parseCourse returns a report'); }, inputs(1500)));
  it('parseCats', () => neverThrows('parseCats', t => { const r = parseCats(t); assert.ok(Array.isArray(r.cats) && Array.isArray(r.warns)); }, inputs(1500)));
  it('parseRoads', () => neverThrows('parseRoads', t => { const r = parseRoads(t); assert.ok(Array.isArray(r.roads) && Array.isArray(r.warns)); }, inputs(1500)));
  it('parseDiag', () => neverThrows('parseDiag', t => parseDiag(t), inputs(1000)));
  it('restoreProg on arbitrary text and on odd JSON', () => {
    neverThrows('restoreProg(text)', t => { const r = restoreProg(t, {}, prof, 'p1'); assert.equal(typeof r.ok, 'boolean'); }, inputs(1000));
    neverThrows('restoreProg(json)', t => { const r = restoreProg(t, {}, prof, 'p1'); assert.equal(typeof r.ok, 'boolean'); }, JSON_CASES);
  });
  it('very large and degenerate inputs', () => {
    for (const [name, fn] of [['parseCourse', parseCourse], ['parseCats', parseCats], ['parseRoads', parseRoads]]) neverThrows(name + '(big)', fn, BIG);
  });
});
