// T1.22: the course id. A title with no Latin letters or digits gets a stable fallback id; every other id stays as it was.
// The import screen says when a file will replace a course that is already in the library.
// Same harness as core.test.js: run the /*CORE*/ block of index.html in a vm context.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
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
const core = indexHtml.slice(coreStart + 8, coreEnd).trim();
const ctx = createContext({});
runInContext(core + '\n;globalThis.__CORE__ = {parseCourse, courseId, slug};', ctx);
const { parseCourse, courseId, slug } = ctx.__CORE__;

const course = title => `# ${title}\n\nAbout (about 1 hours)\n\n## Module 1 · A\n\ntext\n`;

describe('T1.22: courseId', () => {
  it('is exactly slug(title) when the title has Latin letters or digits (no existing id changes)', () => {
    for (const t of ['Bits, Bytes and Colour (sample course)', 'CompTIA Security+ V8 (SY0-801)', 'Intro à la sécurité', 'Course 101', '101', 'A'.repeat(80), 'Intro 课程'])
      assert.equal(courseId(t), slug(t), t);
  });

  it('gives a fallback id to titles without Latin letters or digits', () => {
    for (const t of ['دورة الحاسوب', '课程介绍', 'Курс', '!!!', '— · —', '😀😀'])
      assert.match(courseId(t), /^course-[0-9a-z]+$/, t);
  });

  it('the fallback id is a valid id: lowercase letters, digits and hyphens, at most 60 characters', () => {
    for (const t of ['دورة الحاسوب', '课程介绍', 'ж'.repeat(500)]) {
      const id = courseId(t);
      assert.match(id, /^[a-z0-9-]{3,60}$/, t);
      assert.equal(slug(id), id, 'the id is unchanged by slug (a roadmap step that names it keeps working)');
    }
  });

  it('is deterministic: the same title gives the same id every time', () => {
    assert.equal(courseId('课程介绍'), courseId('课程介绍'));
    assert.equal(courseId('课程介绍'), 'course-' + courseId('课程介绍').slice(7));
  });

  it('different titles give different ids', () => {
    const ts = ['دورة الحاسوب', '课程介绍', 'Курс', 'مقدمة', '入門', '😀😀', '😀'];
    assert.equal(new Set(ts.map(courseId)).size, ts.length);
  });

  it('ignores spaces around the title', () => {
    assert.equal(courseId('  课程介绍  '), courseId('课程介绍'));
  });

  it('an empty or blank title still gives an empty id (parseCourse reports the missing title)', () => {
    assert.equal(courseId(''), '');
    assert.equal(courseId('   '), '');
  });

  it('pinned values, so a change to the fallback is noticed (the id is stored in saved progress)', () => {
    assert.equal(courseId('دورة الحاسوب'), 'course-xsilmk');
    assert.equal(courseId('课程介绍'), 'course-sbqdie');
  });
});

describe('T1.22: parseCourse ids', () => {
  it('a course with a non-Latin title gets the fallback id; two such courses no longer share an id', () => {
    const a = parseCourse(course('دورة الحاسوب')), b = parseCourse(course('课程介绍'));
    assert.equal(a.rep.errors.length, 0);
    assert.equal(a.course.id, courseId('دورة الحاسوب'));
    assert.notEqual(a.course.id, b.course.id);
    assert.notEqual(a.course.id, '');
  });

  it('the same file imported twice gets the same id (so the second import replaces the first)', () => {
    assert.equal(parseCourse(course('课程介绍')).course.id, parseCourse(course('课程介绍')).course.id);
  });

  it('the sample course keeps its id', () => {
    const t = readFileSync(join(repoRoot, 'examples', 'sample-course.md'), 'utf8');
    assert.equal(parseCourse(t).course.id, 'bits-bytes-and-colour-sample-course');
  });

  it('every test fixture course keeps the id slug(title) gave it', () => {
    const dir = join(repoRoot, 'test', 'fixtures');
    const files = readdirSync(dir).filter(f => f.endsWith('.md'));
    assert.ok(files.length > 0);
    let n = 0;
    for (const f of files) {
      const r = parseCourse(readFileSync(join(dir, f), 'utf8'));
      if (!r.course) continue;
      n++;
      assert.equal(r.course.id, slug(r.course.title), f);
    }
    assert.ok(n > 0);
  });

  it('a file with no title still has an empty id and an error', () => {
    const r = parseCourse('## Module 1 · A\n\ntext\n');
    assert.ok(r.rep.errors.length > 0);
    assert.equal(r.course ? r.course.id : '', '');
  });
});

describe('T1.22: import screen line "will replace it"', () => {
  const i = indexHtml.indexOf('function impNew(){');
  const j = indexHtml.indexOf('\nfunction roadHTML(){', i);
  assert.ok(i !== -1 && j !== -1, 'impNew source not found');
  const src = indexHtml.slice(i, j);
  const render = (parsed, library, kind = 'course') => {
    const env = createContext({});
    runInContext(core + '\n;globalThis.__X__ = 1;', env);
    env.IK = { course: 'Course', cats: 'Categories', road: 'Roadmaps', backup: 'Backup' };
    env.S = { courses: library, cats: [] };
    env.V = { imp: { name: 'f.md', kind, r: parsed }, ik: kind };
    runInContext(src + '\n;globalThis.out = impNew();', env);
    return env.out;
  };
  const WORD = /will replace it/;

  it('shows the line, with the title of the existing course, when the id is already in the library', () => {
    const p = parseCourse(course('课程介绍'));
    const html = render(p, [{ id: p.course.id, title: 'Old title' }]);
    assert.match(html, WORD);
    assert.match(html, /same ID as “Old title” in your library/);
  });

  it('does not show the line when the id is new', () => {
    const p = parseCourse(course('课程介绍'));
    assert.doesNotMatch(render(p, [{ id: 'other', title: 'Other' }]), WORD);
    assert.doesNotMatch(render(p, []), WORD);
  });

  it('does not show the line when the file has errors', () => {
    const p = parseCourse('## Module 1 · A\n\ntext\n');
    assert.ok(p.rep.errors.length > 0);
    assert.doesNotMatch(render(p, [{ id: '', title: 'Old' }]), WORD);
  });

  it('writes the existing title as text, not as markup', () => {
    const p = parseCourse(course('课程介绍'));
    const html = render(p, [{ id: p.course.id, title: '<b>x</b>' }]);
    assert.match(html, /same ID as “&lt;b&gt;x&lt;\/b&gt;” in your library/);
    assert.doesNotMatch(html, /<b>x<\/b>/);
  });

  it('two different non-Latin courses do not trigger the line for each other', () => {
    const a = parseCourse(course('دورة الحاسوب')), b = parseCourse(course('课程介绍'));
    assert.doesNotMatch(render(b, [{ id: a.course.id, title: 'A' }]), WORD);
  });
});
