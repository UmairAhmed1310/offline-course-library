// T1.4c: end-to-end check of the T1.4 fix (F-04). When a course has a usable
// diagnostic, its text (questions, options, the "Answers:" line and the advice)
// must be kept out of the reader, out of find-in-course and out of every file
// the app exports. The diagnostic itself must still work, because it is kept as
// data. When the diagnostic is NOT usable, T1.4 leaves its text alone, and a
// control below pins that.
//
// Courses are built in memory, apart from examples/sample-course.md, which is
// read from the repo. A "source guard" fails loudly if a marker string is no
// longer in the course text, so the test can never pass because a marker went
// stale.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const SAMPLE = fs.readFileSync(fileURLToPath(new URL('../../examples/sample-course.md', import.meta.url)), 'utf8');

// A course whose diagnostic sits in the front matter (the "About" page).
const FRONT = `# Leak Check Course

Welcome text that must stay on the front page.

### 0.6 Diagnostic

Answer before you start.

**D1.** Which animal gives milk? A. Cow · B. Duck · C. Snake · D. Eagle

**D2.** Which planet has famous rings? A. Saturn · B. Mars · C. Venus · D. Mercury

**D3.** Which gas do plants take in? A. Carbon dioxide · B. Helium · C. Neon · D. Argon

Answers: D1 A, D2 A, D3 A. Zebra-secret advice: revise farm animals first.

## Module 1 · First steps

**link:** D1

Cows eat grass all day. Marker for module one: blue-sky-one.

## Module 2 · Next steps

**link:** D2

Saturn is a gas giant. Marker for module two: green-hill-two.
`;

// Diagnostic present but not usable: items without a key, and prose only.
const NOKEY = `# No Key Course

Intro line stays.

### 0.6 Diagnostic

**D1.** Which animal gives milk? A. Cow · B. Duck · C. Snake · D. Eagle

**D2.** Which planet has famous rings? A. Saturn · B. Mars · C. Venus · D. Mercury

## Module 1 · Only module

Module text: plain-module-marker.
`;
const PROSE = `# Prose Diagnostic Course

Intro line stays.

### 0.6 Diagnostic

Some notes about a diagnostic that was never written as questions: orphan-diagnostic-note.

## Module 1 · Only module

Module text: plain-module-marker.
`;

// All strings are lower case (the page text is lower-cased before comparing).
const COURSES = [
  {
    label: 'sample course (diagnostic inside Module 2)',
    file: 'sample-course.md', text: SAMPLE, title: 'Bits, Bytes and Colour',
    leak: ['answers: d1 b, d2 a, d3 a', 'spend extra time on units', 'pantone', 'screen brightness', 'answer before module 1', 'which model is additive'],
    findLeak: ['pantone', 'screen brightness', 'spend extra time', 'answer before module 1', 'd1 b, d2 a'],
    // search term -> exact number of matches in the whole course after the strip
    findKeep: [['nibble', 1], ['hex colour code', 1], ['printers use']],
    keep: ['is one binary digit', 'rgb is additive and used by screens', 'cmyk for print, rgb for screens', 'which model do printers use?'],
    diag: { pick: { D1: 'B', D2: 'A', D3: 'A' }, wrong: ['D1', 'A'], correct: 'Correct: B', advice: 'Spend extra time on units' },
  },
  {
    label: 'front-matter course (diagnostic on the About page)',
    file: 'front.md', text: FRONT, title: 'Leak Check Course',
    leak: ['answers: d1 a, d2 a, d3 a', 'zebra-secret', 'which planet has famous rings', 'argon', 'answer before you start'],
    findLeak: ['zebra-secret', 'argon', 'famous rings', 'answer before you start', 'd1 a, d2 a'],
    findKeep: [['blue-sky-one', 1], ['green-hill-two', 1]],
    keep: ['welcome text that must stay', 'blue-sky-one', 'green-hill-two'],
    diag: { pick: { D1: 'A', D2: 'A', D3: 'A' }, wrong: ['D1', 'B'], correct: 'Correct: A', advice: 'Zebra-secret advice' },
  },
];

// Source guard: every marker must really be in the course text.
function assertMarkersInSource(spec) {
  const src = spec.text.replace(/\r\n?/g, '\n').toLowerCase();
  for (const m of [...spec.leak, ...spec.findLeak]) {
    expect(src, `marker "${m}" is not in the source of ${spec.label}; update the test`).toContain(m);
  }
  for (const m of spec.keep) expect(src, `keep text "${m}" is not in the source of ${spec.label}`).toContain(m);
}

async function boot(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:8080/');
  await page.waitForSelector('#app');
  await expect(page.locator('#app')).toContainText('library is empty', { timeout: 10000 });
  return errors;
}

async function importCourse(page, name, text) {
  await page.click('[data-a="nav"][data-id="imp"]');
  await page.locator('#file').setInputFiles({ name, mimeType: 'text/markdown', buffer: Buffer.from(text, 'utf8') });
  await expect(page.locator('[data-a="commit"]')).toBeVisible();
  await page.click('[data-a="commit"]');
  await expect(page.locator('[data-a="open"]')).toBeVisible();
}

async function openCourse(page, title) {
  await page.click(`[data-a="open"]:has-text("${title}")`);
  await expect(page.locator('article')).toBeVisible();
}

// The learning-path lock hides later modules from the reader and from find.
// A leak test with the lock on could pass only because the module is locked.
async function lockOff(page) {
  await page.click('[data-a="nav"][data-id="help"]');
  await page.locator('#lk').uncheck();
  await page.click('[data-a="nav"][data-id="lib"]');
}

async function setup(page, spec) {
  const errors = await boot(page);
  await lockOff(page);
  await importCourse(page, spec.file, spec.text);
  await openCourse(page, spec.title);
  return errors;
}

const flat = s => s.replace(/\s+/g, ' ').toLowerCase();
const noTags = s => flat(s.replace(/<[^>]*>/g, ' '));
// Exports are HTML or Markdown or JSON: check the raw text and the text without tags.
const expectClean = (text, spec, where) => {
  for (const t of [flat(text), noTags(text)]) {
    for (const m of spec.leak) expect(t, `${where} leaks the diagnostic text "${m}"`).not.toContain(m);
  }
};
const expectKept = (text, spec, where) => {
  const t = noTags(text);
  for (const m of spec.keep) expect(t, `${where} lost the course text "${m}"`).toContain(m);
};

async function readEveryPage(page) {
  const n = await page.locator('nav .nav').count();
  expect(n).toBeGreaterThanOrEqual(2); // at least the About page and one module
  const texts = [];
  for (let i = 0; i < n; i++) {
    await page.locator('nav .nav').nth(i).click();
    await expect(page.locator('nav .nav').nth(i)).toHaveClass(/\bon\b/);
    texts.push(await page.locator('article').innerText());
  }
  return texts;
}

async function download(page, click) {
  const [dl] = await Promise.all([page.waitForEvent('download'), click()]);
  return { name: dl.suggestedFilename(), text: fs.readFileSync(await dl.path(), 'utf8') };
}

test.describe('T1.4c: diagnostic answers stay out of the reader, find and exports', () => {
  for (const spec of COURSES) {
    test.describe(spec.label, () => {
      test('the markers are really in the course source', () => {
        assertMarkersInSource(spec);
      });

      test('reader: no page shows the diagnostic, ordinary text is still there', async ({ page }) => {
        const errors = await setup(page, spec);
        const pages = await readEveryPage(page);
        expectClean(pages.join('\n'), spec, 'the reader');
        expectKept(pages.join('\n'), spec, 'the reader'); // positive control
        expect(errors).toEqual([]);
      });

      test('find-in-course: diagnostic text finds nothing, module text is found', async ({ page }) => {
        await setup(page, spec);
        for (const term of spec.findLeak) {
          await page.fill('#f', term);
          await expect(page.locator('#fc'), `searching "${term}"`).toHaveText(/^0 found in the course/);
        }
        for (const [term, n] of spec.findKeep) {
          await page.fill('#f', term);
          if (n === undefined) await expect(page.locator('#fc'), `searching "${term}"`).toHaveText(/^[1-9]\d* found in the course/);
          else await expect(page.locator('#fc'), `searching "${term}"`).toHaveText(new RegExp(`^${n} found in the course`));
        }
      });

      test('course exports (Word file, print view) hold no diagnostic text', async ({ page }) => {
        await setup(page, spec);
        const word = await download(page, () => page.click('[data-a="doc"]'));
        expect(word.name).toMatch(/\.doc$/);
        expectClean(word.text, spec, 'the Word export');
        expectKept(word.text, spec, 'the Word export');

        // "Save as PDF" fills #pv and calls window.print(); stub print and read #pv.
        await page.evaluate(() => { window.print = () => {}; });
        await page.click('[data-a="pdf"]');
        const pv = await page.$eval('#pv', e => e.textContent);
        expectClean(pv, spec, 'the print view');
        expectKept(pv, spec, 'the print view');
      });

      test('export screen: every file holds no diagnostic text', async ({ page }) => {
        await setup(page, spec);
        // take the diagnostic once so the progress files hold a diagnostic result
        await page.click('[data-a="tab"][data-id="diag"]');
        await page.click('[data-a="dstart"]');
        for (const [id, v] of Object.entries(spec.diag.pick)) await page.check(`[name="dg${id}"][value="${v}"]`);
        await page.click('[data-a="dsub"]');
        await expect(page.locator('#app')).toContainText('Diagnostic: 3 / 3');

        await page.click('[data-a="nav"][data-id="exp"]');
        const ids = await page.locator('[data-a="exp"]:not([disabled])').evaluateAll(els => els.map(e => e.dataset.id));
        for (const must of ['prog', 'lib', 'backup']) expect(ids, 'export button missing or disabled').toContain(must);
        for (const id of ids) {
          const f = await download(page, () => page.click(`[data-a="exp"][data-id="${id}"]`));
          expect(f.text.length, `export ${id} is empty`).toBeGreaterThan(20);
          expectClean(f.text, spec, `export "${id}" (${f.name})`);
        }
      });

      test('the diagnostic itself still works (it is kept as data)', async ({ page }) => {
        await setup(page, spec);
        await page.click('[data-a="tab"][data-id="diag"]');
        await expect(page.locator('#app')).toContainText('3 short questions');
        await page.click('[data-a="dstart"]');
        for (const [id, v] of Object.entries(spec.diag.pick)) {
          const pick = id === spec.diag.wrong[0] ? spec.diag.wrong[1] : v;
          await page.check(`[name="dg${id}"][value="${pick}"]`);
        }
        await page.click('[data-a="dsub"]');
        await expect(page.locator('#app')).toContainText('Diagnostic: 2 / 3');
        await expect(page.locator('#app')).toContainText(spec.diag.correct); // the key survived
        await expect(page.locator('#app')).toContainText(spec.diag.advice);  // so did the advice
      });
    });
  }

  test.describe('negative controls: an unusable diagnostic is left alone (T1.4 strips only a usable one)', () => {
    test('questions without a key stay visible in the reader', async ({ page }) => {
      await boot(page);
      await lockOff(page);
      await importCourse(page, 'nokey.md', NOKEY);
      await openCourse(page, 'No Key Course');
      const pages = await readEveryPage(page);
      const all = flat(pages.join('\n'));
      expect(all).toContain('which planet has famous rings');
      expect(all).toContain('plain-module-marker');
    });

    test('a prose-only diagnostic section stays visible in the reader', async ({ page }) => {
      await boot(page);
      await lockOff(page);
      await importCourse(page, 'prose.md', PROSE);
      await openCourse(page, 'Prose Diagnostic Course');
      const pages = await readEveryPage(page);
      const all = flat(pages.join('\n'));
      expect(all).toContain('orphan-diagnostic-note');
      expect(all).toContain('plain-module-marker');
    });
  });
});
