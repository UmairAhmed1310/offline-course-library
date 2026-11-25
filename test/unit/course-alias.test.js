// T1.22b: the course_id of the Library Data is kept as an alias; a roadmap step finds a course by its own id or its alias; a roadmap with a non-Latin title and no id gets the courseId fallback.
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
const sample = readFileSync(join(repoRoot, 'examples', 'sample-course.md'), 'utf8').replace(/\r\n?/g, '\n');

const coreStart = indexHtml.indexOf('/*CORE*/');
const coreEnd = indexHtml.indexOf('/*ENDCORE*/');
assert.ok(coreStart !== -1, '/*CORE*/ marker not found');
assert.ok(coreEnd !== -1, '/*ENDCORE*/ marker not found');
const ctx = createContext({});
runInContext(indexHtml.slice(coreStart + 8, coreEnd).trim() + '\n;globalThis.__CORE__ = {parseCourse, parseRoads, roadStat, findCourse, courseId, buildBackup, validateBackup};', ctx);
const { parseCourse, parseRoads, roadStat, findCourse, courseId, buildBackup, validateBackup } = ctx.__CORE__;

// The sample with a "Course metadata" table in front of its Library Data records (the shape the generator writes).
const withMeta = id => sample.replace('## Library Data\n', `## Library Data\n\n### Course metadata\n\n| Field | Value |\n| --- | --- |\n| schema_version | 1 |\n| course_id | ${id} |\n| title | Bits, Bytes and Colour |\n\n### Records\n`);
const SAMPLE_ID = 'bits-bytes-and-colour-sample-course';

describe('T1.22b: the alias', () => {
  it('the sample course has no course_id row: no alias, same id as before', () => {
    const { course } = parseCourse(sample);
    assert.equal(course.id, SAMPLE_ID);
    assert.equal('alias' in course, false);
  });
  it('a course_id different from the id becomes the alias; the id does not change', () => {
    const { course, rep } = parseCourse(withMeta('bits-and-bytes'));
    assert.equal(course.id, SAMPLE_ID);
    assert.equal(course.alias, 'bits-and-bytes');
    assert.equal(rep.errors.length, 0);
  });
  it('the Library Data records are still read after a metadata table (questions matched)', () => {
    const { course } = parseCourse(withMeta('bits-and-bytes'));
    assert.equal(course.qs.filter(q => q.uid).length, 5);
  });
  it('a course_id equal to the id gives no alias', () => {
    assert.equal('alias' in parseCourse(withMeta(SAMPLE_ID)).course, false);
  });
  it('the alias is lower-cased; a value that is not a clean slug is ignored (no alias, no new warning)', () => {
    assert.equal(parseCourse(withMeta('Bits-And-Bytes')).course.alias, 'bits-and-bytes');
    const base = parseCourse(sample).rep.warns.length;
    for (const bad of ['has spaces', 'x/y', '', '-lead', 'ünï']) {
      const r = parseCourse(withMeta(bad));
      assert.equal('alias' in r.course, false, JSON.stringify(bad));
      assert.equal(r.rep.warns.length, base, JSON.stringify(bad));
    }
  });
  it('the first course_id row wins', () => {
    const t = withMeta('first-id').replace('| title | Bits, Bytes and Colour |', '| course_id | second-id |\n| title | Bits, Bytes and Colour |');
    assert.equal(parseCourse(t).course.alias, 'first-id');
  });
  it('the alias survives a backup round trip (T1.9a cleaner)', () => {
    const { course } = parseCourse(withMeta('bits-and-bytes'));
    const st = { profiles: [{ id: 'p1', name: 'A' }], active: 'p1', courses: [course], prog: {}, cats: [], roads: [], gone: {}, unl: {}, cfg: {} };
    const v = validateBackup(buildBackup(st).backup);
    assert.equal(v.ok, true);
    assert.equal(v.clean.state.courses[0].alias, 'bits-and-bytes');
    assert.equal(v.clean.state.courses[0].id, SAMPLE_ID);
  });
  it('a stored course without an alias stays without one after a backup round trip', () => {
    const { course } = parseCourse(sample);
    const st = { profiles: [{ id: 'p1', name: 'A' }], active: 'p1', courses: [course], prog: {}, cats: [], roads: [], gone: {}, unl: {}, cfg: {} };
    assert.equal('alias' in validateBackup(buildBackup(st).backup).clean.state.courses[0], false);
  });
});

describe('T1.22b: findCourse and the roadmap', () => {
  const a = { id: 'course-a', alias: 'alias-a' }, b = { id: 'alias-a', title: 'own id wins' }, c = { id: 'course-c' };
  it('finds by own id, then by alias; the own id wins over another course\'s alias', () => {
    assert.equal(findCourse([a, c], 'course-a'), a);
    assert.equal(findCourse([a, c], 'alias-a'), a);
    assert.equal(findCourse([a, c], 'nope'), undefined);
    assert.equal(findCourse([a, b, c], 'alias-a'), b);
  });
  it('the filter applies to both passes', () => {
    assert.equal(findCourse([a, c], 'alias-a', x => x.id !== 'course-a'), undefined);
    assert.equal(findCourse([b, a], 'alias-a', x => x.id !== 'alias-a'), a);
  });
  it('a roadmap step that names the alias finds the course, and a course named both ways counts once', () => {
    const r = { levels: [{ name: 'L', steps: [{ course: 'course-a', req: true, covers: 'all' }, { course: 'alias-a', req: true, covers: 'all' }] }] };
    const course = { id: 'course-a', alias: 'alias-a', secs: [{ id: 'm1', kind: 'module' }] };
    const st = roadStat(r, id => findCourse([course], id), () => ({ m1: 1 }));
    assert.equal(st.miss, 0);
    assert.equal(st.total, 1);
    assert.equal(st.have, 1);
    assert.equal(st.pct, 100);
  });
  it('without aliases roadStat counts exactly as before (two steps, two courses, one missing)', () => {
    const r = { levels: [{ name: 'L', steps: [{ course: 'course-a', req: true, covers: 'all' }, { course: 'gone', req: true, covers: 'all' }] }] };
    const course = { id: 'course-a', secs: [{ id: 'm1', kind: 'module' }] };
    const st = roadStat(r, id => findCourse([course], id), () => ({}));
    assert.deepEqual([st.total, st.have, st.miss, st.blocked], [2, 1, 1, 1]);
  });
});

describe('T1.22b: roadmap id fallback', () => {
  const road = (title, idRow) => `# Roadmap: ${title}\n\n| Field | Value |\n| --- | --- |\n${idRow ? `| id | ${idRow} |\n` : ''}\n## Level 1\n\n| Step | Course ID | Required | Covers | Note |\n| --- | --- | --- | --- | --- |\n| 1 | course-a | yes | all | |\n`;
  it('a Latin title or an id field gives the same id as before (slug)', () => {
    assert.equal(parseRoads(road('Data Analyst')).roads[0].id, 'data-analyst');
    assert.equal(parseRoads(road('Data Analyst', 'My-Road')).roads[0].id, 'my-road');
  });
  it('a non-Latin title with no id field gets the courseId fallback, not an empty id', () => {
    const t = 'مسار البيانات';
    const id = parseRoads(road(t)).roads[0].id;
    assert.match(id, /^course-[0-9a-z]+$/);
    assert.equal(id, courseId(t));
  });
  it('two different non-Latin roadmap titles get different ids', () => {
    assert.notEqual(parseRoads(road('مسار البيانات')).roads[0].id, parseRoads(road('数据分析路线')).roads[0].id);
  });
});
