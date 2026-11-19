// T1.1b: roadmap course counts ("N of M courses are in your library") and the Help text.
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
runInContext(indexHtml.slice(coreStart + 8, coreEnd).trim() + '\n;globalThis.__CORE__ = {parseRoads,roadStat};', ctx);
const { parseRoads, roadStat } = ctx.__CORE__;

// A roadmap with the given steps: [courseId, required ('yes'|'no')].
const road = steps => parseRoads([
  '# Roadmap: Test Path', '',
  '| Field | Value |', '| --- | --- |', '| id | test-path |', '',
  '## Level 1', '',
  '| Step | Course ID | Required | Covers | Note |', '| --- | --- | --- | --- | --- |',
  ...steps.map(([id, req], i) => `| ${i + 1} | ${id} | ${req} | all | |`), ''
].join('\n')).roads[0];

const course = n => ({ secs: Array.from({ length: n }, (_, i) => ({ kind: 'module', id: 'm' + (i + 1) })) });
const library = ids => id => ids.includes(id) ? course(2) : null;
const allDone = () => ({ m1: true, m2: true });
const noneDone = () => ({});

describe('T1.1b: roadStat course counts', () => {
  it('counts the courses on the roadmap and the ones that are in the library', () => {
    const r = road([['a', 'yes'], ['b', 'yes'], ['c', 'no']]);
    const st = roadStat(r, library(['a']), allDone);
    assert.equal(st.total, 3);
    assert.equal(st.have, 1);
  });

  it('counts optional courses too', () => {
    const r = road([['a', 'yes'], ['b', 'no']]);
    const st = roadStat(r, library(['a', 'b']), noneDone);
    assert.equal(st.total, 2);
    assert.equal(st.have, 2);
  });

  it('counts a course that is listed in two steps once', () => {
    const r = road([['a', 'yes'], ['a', 'no'], ['b', 'yes']]);
    const st = roadStat(r, library(['a']), noneDone);
    assert.equal(st.total, 2);
    assert.equal(st.have, 1);
  });

  it('reports have equal to total when every course is in the library', () => {
    const r = road([['a', 'yes'], ['b', 'yes']]);
    const st = roadStat(r, library(['a', 'b']), allDone);
    assert.equal(st.have, st.total);
    assert.equal(st.blocked, 0);
    assert.equal(st.pct, 100);
  });

  it('reports have 0 when the library holds none of them', () => {
    const r = road([['a', 'yes'], ['b', 'no']]);
    const st = roadStat(r, () => null, noneDone);
    assert.equal(st.total, 2);
    assert.equal(st.have, 0);
  });

  it('reports 0 of 0 for a roadmap with no steps', () => {
    const st = roadStat({ levels: [] }, () => null, noneDone);
    assert.equal(st.total, 0);
    assert.equal(st.have, 0);
  });

  it('leaves the existing fields as they were (pct, miss, blocked, req, levels)', () => {
    // a: present, 2 modules, both done. b: required but missing (counts as 1 module not done). c: optional, missing.
    const r = road([['a', 'yes'], ['b', 'yes'], ['c', 'no']]);
    const st = roadStat(r, library(['a']), allDone);
    assert.equal(st.pct, 67);
    assert.equal(st.miss, 1);
    assert.equal(st.blocked, 1);
    assert.equal(st.req, 3);
    assert.equal(st.levels.length, 1);
    assert.equal(st.levels[0].steps.length, 3);
    assert.equal(st.levels[0].steps[0].n, 2);
    assert.equal(st.levels[0].steps[1].missing, true);
  });
});

describe('T1.1b: Help text for roadmaps', () => {
  const line = indexHtml.split('\n').find(l => l.startsWith("roadmaps:['Roadmap file format'"));
  it('is found in the HELP object', () => assert.ok(line));
  it('no longer says that a missing course is not counted in the percentage', () => {
    assert.doesNotMatch(line, /is not counted in the percentage/);
  });
  it('explains that a missing required course keeps the roadmap Incomplete', () => {
    assert.match(line, /Incomplete/);
    assert.match(line, /below 100%/);
  });
  it('mentions the count of courses in your library', () => {
    assert.match(line, /how many of its courses are in your library/);
  });
  it('still holds the template and the download button', () => {
    assert.match(line, /TPL\.road/);
    assert.match(line, /data-a='tpl' data-id='road'/);
  });
});

// T1.1c: the percentage label says what roadStat counts. roadHTML is outside CORE, so run its source with small stand-ins.
describe('T1.1c: roadmap percentage label', () => {
  const i = indexHtml.indexOf('function roadHTML(){');
  const j = indexHtml.indexOf('\nconst progMd=', i);
  assert.ok(i !== -1 && j !== -1, 'roadHTML source not found');
  const src = indexHtml.slice(i, j);
  const render = (steps, have) => {
    const r = road(steps);
    const env = createContext({});
    runInContext(indexHtml.slice(coreStart + 8, coreEnd).trim() + '\n;globalThis.roadStat = roadStat;', env);
    env.S = { roads: [r], courses: have.map(id => ({ id, ...course(2) })) };
    env.vis = () => true;
    env.CP = () => ({ done: { m1: true, m2: true } });
    env.esc = x => String(x);
    runInContext(src + '\n;globalThis.out = roadHTML();', env);
    const html = env.out;
    return html.slice(html.indexOf("<span class='mut'>") + 18, html.indexOf('</span>'));
  };

  it('with a required course missing: counts the missing course as one module, and does not say "available"', () => {
    const t = render([['a', 'yes'], ['b', 'yes']], ['a']);
    assert.match(t, /67% of required modules done \(each missing course counts as one\)/);
    assert.doesNotMatch(t, /available/);
    assert.match(t, /Incomplete/);
    assert.match(t, /1 required course not in the library/);
  });

  it('with every required course present: the plain label, no note', () => {
    const t = render([['a', 'yes'], ['b', 'yes']], ['a', 'b']);
    assert.match(t, /100% of required modules done/);
    assert.doesNotMatch(t, /each missing course/);
  });

  it('a missing optional course does not add the note', () => {
    const t = render([['a', 'yes'], ['b', 'no']], ['a']);
    assert.match(t, /100% of required modules done/);
    assert.doesNotMatch(t, /each missing course/);
  });

  it('the label agrees with the number: 2 done of 3 (a has 2 modules, b missing counts 1) is 67%', () => {
    const st = roadStat(road([['a', 'yes'], ['b', 'yes']]), library(['a']), allDone);
    assert.equal(st.req, 3);
    assert.equal(st.pct, 67);
  });
});
