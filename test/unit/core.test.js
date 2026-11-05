import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const indexHtml = readFileSync(join(repoRoot, 'index.html'), 'utf8');

// Extract the CORE block (between /*CORE*/ and /*ENDCORE*/)
const coreStart = indexHtml.indexOf('/*CORE*/');
const coreEnd = indexHtml.indexOf('/*ENDCORE*/');
assert.ok(coreStart !== -1, '/*CORE*/ marker not found');
assert.ok(coreEnd !== -1, '/*ENDCORE*/ marker not found');
const coreCode = indexHtml.slice(coreStart + 8, coreEnd).trim();

// Run the core code in a vm context to export functions
import { createContext, runInContext } from 'node:vm';
const ctx = createContext({});
runInContext(coreCode + '\n;globalThis.__CORE__ = {parseCourse,grade,splitOptions,md,slug,recallCards,parseDiag,applyLib,pick,diffOf,nextRv,shuf,hi,stars,coverMods,roadStat,parseCats,parseRoads,cells};', ctx);
const { parseCourse, grade, splitOptions, md, slug, recallCards, parseDiag, applyLib, pick, diffOf, nextRv, shuf, hi, stars, coverMods, roadStat, parseCats, parseRoads, cells } = ctx.__CORE__;

// Test fixtures
const sampleCourse = readFileSync(join(repoRoot, 'examples', 'sample-course.md'), 'utf8');
const sampleCategories = readFileSync(join(repoRoot, 'examples', 'sample-categories.md'), 'utf8');
const sampleRoadmap = readFileSync(join(repoRoot, 'examples', 'sample-roadmap.md'), 'utf8');

describe('CORE block functions', () => {
  describe('parseCourse', () => {
    let result;
    before(() => {
      result = parseCourse(sampleCourse);
    });

    it('parses without errors', () => {
      assert.equal(result.rep.errors.length, 0);
    });

    it('parses without warnings', () => {
      assert.equal(result.rep.warns.length, 0);
    });

    it('extracts 2 modules and 5 questions', () => {
      const c = result.course;
      const modules = c.secs.filter(s => s.kind === 'module');
      assert.equal(modules.length, 2);
      assert.equal(c.qs.length, 5);
    });

    it('marks 4 questions as scored', () => {
      const scored = result.course.qs.filter(q => q.scored);
      assert.equal(scored.length, 4);
    });

    it('extracts hours estimate', () => {
      assert.equal(result.course.hours, 2);
    });

    it('parses diagnostic with 3 items', () => {
      assert.ok(result.course.diag);
      assert.equal(result.course.diag.items.length, 3);
      assert.equal(result.course.diag.bad, 0);
    });

    it('extracts Bloom tags from Library Data', () => {
      const blooms = result.course.qs.map(q => q.bloom).filter(Boolean);
      assert.ok(blooms.includes('remember'));
      assert.ok(blooms.includes('analyze'));
    });
  });

  describe('grade', () => {
    let course;
    before(() => {
      course = parseCourse(sampleCourse).course;
    });

    it('grades mcq correctly', () => {
      const q1 = course.qs.find(q => q.n === 1);
      assert.equal(grade(q1, ['B']), true);
      assert.equal(grade(q1, ['A']), false);
    });

    it('grades select-two correctly (both required)', () => {
      const q2 = course.qs.find(q => q.n === 2);
      assert.equal(grade(q2, ['A', 'B']), true);
      assert.equal(grade(q2, ['A']), false);
      assert.equal(grade(q2, ['B']), false);
    });

    it('grades numeric with tolerance', () => {
      const q3 = course.qs.find(q => q.n === 3);
      assert.equal(grade(q3, '32'), true);
      assert.equal(grade(q3, '321'), false);
    });

    it('returns null for unanswered', () => {
      const q1 = course.qs.find(q => q.n === 1);
      assert.equal(grade(q1, []), null);
      assert.equal(grade(q1, ''), null);
    });
  });

  describe('splitOptions', () => {
    it('splits A.-E. options on one line', () => {
      const line = 'Question? A. opt1 · B. opt2 · C. opt3 · D. opt4';
      const { stem, opts } = splitOptions(line);
      assert.equal(stem, 'Question?');
      assert.equal(opts.A, 'opt1');
      assert.equal(opts.B, 'opt2');
      assert.equal(opts.C, 'opt3');
      assert.equal(opts.D, 'opt4');
    });

    it('returns empty opts when fewer than 4 options', () => {
      const line = 'Question? A. opt1 · B. opt2';
      const { stem, opts } = splitOptions(line);
      assert.equal(Object.keys(opts).length, 0);
    });
  });

  describe('md (markdown renderer)', () => {
    it('renders headings', () => {
      const out = md('# Title\n## Sub');
      assert.ok(out.includes('<h3>Title</h3>'));
      assert.ok(out.includes('<h4>Sub</h4>'));
    });

    it('renders bold and italic', () => {
      const out = md('**bold** and *italic*');
      assert.ok(out.includes('<b>bold</b>'));
      assert.ok(out.includes('<i>italic</i>'));
    });

    it('renders code', () => {
      const out = md('`code`');
      assert.ok(out.includes('<code>code</code>'));
    });

    it('renders tables', () => {
      const out = md('| A | B |\n|---|---|\n| 1 | 2 |');
      assert.ok(out.includes('<table>'));
      assert.ok(out.includes('<th>A</th>'));
      assert.ok(out.includes('<td>1</td>'));
    });

    it('renders lists', () => {
      const out = md('- one\n- two');
      assert.ok(out.includes('<ul>'));
      assert.ok(out.includes('<li>one</li>'));
    });
  });

  describe('slug', () => {
    it('normalizes title to slug', () => {
      assert.equal(slug('Hello World!'), 'hello-world');
      assert.equal(slug('Module 1 · Test'), 'module-1-test');
    });
  });

  describe('recallCards', () => {
    it('splits numbered items from Recall check', () => {
      const mdText = '### Recall check\nWhat is it? (1) Answer one. (2) Answer two.';
      const cards = recallCards(mdText);
      assert.equal(cards.length, 2);
      assert.ok(cards[0].includes('Answer one'));
      assert.ok(cards[1].includes('Answer two'));
    });
  });

  describe('parseDiag', () => {
    it('parses diagnostic block from sample', () => {
      const diag = parseDiag(sampleCourse);
      assert.ok(diag);
      assert.equal(diag.items.length, 3);
      assert.ok(diag.advice.includes('additive'));
    });
  });

  describe('applyLib', () => {
    it('attaches stable IDs and Bloom from Library Data', () => {
      const result = parseCourse(sampleCourse);
      const q1 = result.course.qs.find(q => q.n === 1);
      assert.equal(q1.uid, 'sample-q-1');
      assert.equal(q1.bloom, 'remember');
      // Module ID stays m1 (from heading), Library Data assigns uid
      assert.equal(q1.mod, 'm1');
    });
  });

  describe('pick (question selection)', () => {
    let course;
    before(() => {
      course = parseCourse(sampleCourse).course;
    });

    it('prefers unseen questions', () => {
      const pool = course.qs.filter(q => q.scored);
      const picked = pick(pool, 3, ['sample-q-1'], null);
      assert.ok(!picked.some(q => q.uid === 'sample-q-1'));
    });

    it('respects Bloom ratio for difficulty levels', () => {
      const pool = course.qs.filter(q => q.scored);
      const hiRatio = 0.7; // Expert
      const picked = pick(pool, 4, [], hiRatio);
      const hiCount = picked.filter(hi).length;
      // Sample has 2 higher-order (analyze, evaluate) out of 4 scored
      // With 0.7 ratio and 4 picks, expect at least 1 higher-order
      assert.ok(hiCount >= 1);
    });
  });

  describe('diffOf', () => {
    it('returns difficulty rating from Bloom share', () => {
      const course = parseCourse(sampleCourse).course;
      const diff = diffOf(course.qs);
      assert.ok(diff);
      assert.ok(['Starter', 'Builder', 'Expert'].includes(diff.n));
    });
  });

  describe('nextRv (spaced repetition)', () => {
    it('advances stage on success', () => {
      const rv = { stage: 0 };
      const next = nextRv(rv, [], Date.now());
      assert.equal(next.stage, 1);
    });

    it('resets to stage 0 on "again"', () => {
      const rv = { stage: 3 };
      const next = nextRv(rv, ['again'], Date.now());
      assert.equal(next.stage, 0);
    });
  });

  describe('shuf (shuffle)', () => {
    it('returns permutation of input', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuf(arr);
      assert.deepEqual(shuffled.slice().sort(), arr);
      // Very unlikely but possible to get same order; just verify it's an array of same length
      assert.equal(shuffled.length, arr.length);
    });
  });

  describe('hi (higher-order Bloom)', () => {
    it('detects analyze/evaluate/create', () => {
      assert.equal(hi({ bloom: 'analyze' }), true);
      assert.equal(hi({ bloom: 'evaluate' }), true);
      assert.equal(hi({ bloom: 'create' }), true);
      assert.equal(hi({ bloom: 'remember' }), false);
      assert.equal(hi({ bloom: 'understand' }), false);
    });
  });

  describe('stars', () => {
    it('maps percentage to stars', () => {
      assert.equal(stars(100), 3);
      assert.equal(stars(95), 2);
      assert.equal(stars(85), 1);
      assert.equal(stars(79), 0);
    });
  });

  describe('coverMods', () => {
    it('matches modules by id, domain, or uid', () => {
      const course = parseCourse(sampleCourse).course;
      const mods = course.secs.filter(s => s.kind === 'module');
      const covered = coverMods(course, 'm1');
      assert.equal(covered.length, 1);
      assert.equal(covered[0].id, 'm1');
    });
  });

  describe('roadStat', () => {
    it('computes roadmap stats', () => {
      const { roads } = parseRoads(sampleRoadmap);
      assert.equal(roads.length, 1);
      assert.equal(roads[0].id, 'sample-career-path');
      assert.equal(roads[0].levels.length, 2);
    });

    it('shows < 100% when required course is missing', () => {
      const { roads } = parseRoads(sampleRoadmap);
      const r = roads[0];
      // Simulate: course is missing from library
      const find = () => null; // course not found
      const done = () => ({});
      const st = roadStat(r, find, done);
      // Should not be 100% when required course is missing
      assert.ok(st.pct < 100, `Expected < 100% when required course missing, got ${st.pct}%`);
      assert.equal(st.blocked, 1);
      assert.equal(st.miss, 1);
    });

    it('shows < 100% when some required courses done but others missing', () => {
      // Roadmap with 2 required steps: one present (done), one missing
      const roadmapMd = `# Roadmap: Test Path
| Field | Value |
| --- | --- |
| id | test-path |

## Level 1
| Step | Course ID | Required | Covers | Note |
| --- | --- | --- | --- | --- |
| 1 | course-present | yes | all | Present course |
| 2 | course-missing | yes | all | Missing course |`;
      const { roads } = parseRoads(roadmapMd);
      const r = roads[0];
      const course = { secs: [{kind:'module',id:'m1'},{kind:'module',id:'m2'}] };
      const find = (id) => id === 'course-present' ? course : null;
      const done = (c) => ({ m1: true, m2: true });
      const st = roadStat(r, find, done);
      // Should not be 100% because one required course is missing
      assert.ok(st.pct < 100, `Expected < 100% when required course missing, got ${st.pct}%`);
      assert.equal(st.blocked, 1);
      assert.equal(st.miss, 1);
    });

    it('shows 100% when all required courses present and done', () => {
      const { roads } = parseRoads(sampleRoadmap);
      const r = roads[0];
      // Simulate: course present with 2 modules, both done
      const course = { secs: [{kind:'module',id:'m1'},{kind:'module',id:'m2'}] };
      const find = (id) => id === 'bits-bytes-and-colour-sample-course' ? course : null;
      const done = (c) => ({ m1: true, m2: true });
      const st = roadStat(r, find, done);
      assert.equal(st.pct, 100);
      assert.equal(st.blocked, 0);
    });

    it('shows partial % when required course present but not all modules done', () => {
      const { roads } = parseRoads(sampleRoadmap);
      const r = roads[0];
      const course = { secs: [{kind:'module',id:'m1'},{kind:'module',id:'m2'}] };
      const find = (id) => id === 'bits-bytes-and-colour-sample-course' ? course : null;
      const done = (c) => ({ m1: true, m2: false });
      const st = roadStat(r, find, done);
      assert.equal(st.pct, 50); // 1 of 2 modules done
      assert.equal(st.blocked, 0);
    });
  });

  describe('parseCats', () => {
    it('parses category table', () => {
      const { cats } = parseCats(sampleCategories);
      assert.equal(cats.length, 4);
      assert.equal(cats.find(c => c.id === 'tech').name, 'Technology');
      assert.equal(cats.find(c => c.id === 'cyber').parent, 'tech');
    });
  });

  describe('parseRoads', () => {
    it('parses roadmap markdown', () => {
      const { roads } = parseRoads(sampleRoadmap);
      assert.equal(roads.length, 1);
      const r = roads[0];
      assert.equal(r.id, 'sample-career-path');
      assert.equal(r.levels[0].name, 'Level 1 · Foundations');
      assert.equal(r.levels[0].steps.length, 1);
      assert.equal(r.levels[0].steps[0].course, 'bits-bytes-and-colour-sample-course');
      assert.equal(r.levels[0].steps[0].req, true);
    });
  });
});