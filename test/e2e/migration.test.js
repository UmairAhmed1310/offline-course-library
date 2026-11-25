// T1.2c: end-to-end test of the T1.2b migration (sor T1.2b; index.html: migrateEmptyPoolDone and the startup block).
//
// T1.2 made a module without scored questions need an explicit "Mark as done" before the next module opens.
// Devices that already had progress could be locked out of modules they had passed, so T1.2b marks those
// earlier modules as done, once, at startup, for every profile. The pure function is covered by
// test/unit/migrate-empty-pool.test.js. This file checks the whole thing in a real browser:
// the real import screen, the real IndexedDB record, the real startup code, and what the learner sees.
//
// How it works: import two small courses and add a second profile through the UI, then rewrite the stored
// state into the shape an older build left behind (old flag set, new flag missing, progress only in a later
// module), reload, and look at the stored state and at the course page.
//
// It reads and writes the app's own storage: database "olib", object store "kv", key "s" (the whole state).
// If the storage layer changes (T1.11, T1.12), change the three helpers below on purpose.
//
// What it depends on in the page (change these here if the markup changes on purpose): the ids and data attributes
// #file, #np, #pf, [data-a="nav|commit|open|addp|done"] and [data-id]; the course reader's nav buttons (".nav", class "lk"
// when a module is locked, a leading tick when it is done) and #mdc; and the import report saying "3 modules".
// It does not depend on button wording or on help text.
import { test, expect } from '@playwright/test';

const COURSE_A_TITLE = 'Migration Course A';
const COURSE_B_TITLE = 'Migration Course B';

// Course A: three modules, none with scored questions.
const COURSE_A = `# ${COURSE_A_TITLE} (about 1 hours)

A course whose modules have no scored questions (T1.2c test).

## Module 1 · First

**link:** D1

Text of the first module.

## Module 2 · Second

**link:** D2

Text of the second module.

## Module 3 · Third

**link:** D3

Text of the third module.
`;

// Course B: Module 1 and Module 3 have scored questions, Module 2 has none.
const COURSE_B = `# ${COURSE_B_TITLE} (about 1 hours)

A course with one module in the middle that has no scored questions (T1.2c test).

## Module 1 · Scored one

**link:** D1

Text of the first module.

## Module 2 · No questions

**link:** D2

Text of the second module.

## Module 3 · Scored three

**link:** D3

Text of the third module.

## Practice Lab

**Q1.** First question? (mcq) A. alpha · B. beta · C. gamma · D. delta

**Q2.** Second question? (mcq) A. alpha · B. beta · C. gamma · D. delta

**Q3.** Third question? (mcq) A. alpha · B. beta · C. gamma · D. delta

**Q4.** Fourth question? (mcq) A. alpha · B. beta · C. gamma · D. delta

## Answer Key

| Q | Answer | Domain | Why |
| --- | --- | --- | --- |
| 1 | A | D1 | Alpha. |
| 2 | B | D1 | Beta. |
| 3 | C | D3 | Gamma. |
| 4 | D | D3 | Delta. |
`;

// ---- storage helpers (the app's own record) ----
const readState = page =>
  page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('olib', 1);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const get = db.transaction('kv').objectStore('kv').get('s');
          get.onsuccess = () => { db.close(); resolve(get.result || null); };
          get.onerror = () => { db.close(); reject(get.error); };
        };
      }),
  );

const writeState = (page, state) =>
  page.evaluate(
    s =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('olib', 1);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('kv', 'readwrite');
          tx.objectStore('kv').put(s, 's');
          tx.oncomplete = () => { db.close(); resolve(true); };
          tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
        };
      }),
    state,
  );

// ---- UI helpers ----
async function boot(page) {
  await page.goto('/');
  await page.waitForSelector('#app');
  await expect(page.locator('#app')).toContainText(/library is empty|Search the library|Migration Course/);
}

async function importCourse(page, fileName, markdown, title) {
  await page.click('[data-a="nav"][data-id="imp"]');
  await page.locator('#file').setInputFiles({ name: fileName, mimeType: 'text/markdown', buffer: Buffer.from(markdown, 'utf8') });
  await expect(page.locator('#app')).toContainText('3 modules');
  await page.click('[data-a="commit"]');
  await expect(page.locator('[data-a="open"]', { hasText: title })).toBeVisible();
}

async function openCourse(page, title) {
  await page.click('[data-a="nav"][data-id="lib"]');
  await page.click(`[data-a="open"]:has-text("${title}")`);
  await expect(page.locator('nav .nav').first()).toBeVisible();
}

const navButton = (page, n) => page.locator(`nav .nav:has-text("Module ${n}")`);

// Two courses and a second profile, all made through the UI. Returns the ids the app generated.
async function setup(page) {
  await boot(page);
  await importCourse(page, 'migration-a.md', COURSE_A, COURSE_A_TITLE);
  await importCourse(page, 'migration-b.md', COURSE_B, COURSE_B_TITLE);
  await page.fill('#np', 'Sam');
  await page.click('[data-a="addp"]');
  await expect.poll(async () => (await readState(page))?.profiles?.length).toBe(2);
  const s = await readState(page);
  const [p1, p2] = s.profiles.map(p => p.id);
  const a = s.courses.find(c => c.title.startsWith(COURSE_A_TITLE)).id;
  const b = s.courses.find(c => c.title.startsWith(COURSE_B_TITLE)).id;
  return { p1, p2, a, b };
}

// Rewrite the stored state into the shape an older build left behind, and check that it really was written.
async function seedOldState(page, ids, prog) {
  const s = await readState(page);
  s.prog = prog;
  s.active = ids.p1;
  s.migratedEmptyPool = true; // what the PR #5 build stored
  delete s.migEmptyPool2; // the T1.2b flag does not exist yet
  await writeState(page, s);
  const check = await readState(page);
  expect(check.migEmptyPool2).toBeUndefined();
  expect(check.migratedEmptyPool).toBe(true);
}

// After a reload the library lists the courses once the app has started.
const waitForLibrary = page => expect(page.locator('[data-a="open"]').first()).toBeVisible();

async function reloadAndWaitForMigration(page) {
  await page.reload();
  await waitForLibrary(page);
  await expect.poll(async () => (await readState(page))?.migEmptyPool2 !== undefined).toBe(true);
}

const markKey = m => m.join('|');

test.describe('T1.2b migration, end to end', () => {
  test('repairs every profile and every course of an old-shaped state, and nothing else', async ({ page }) => {
    const ids = await setup(page);
    const { p1, p2, a, b } = ids;
    await seedOldState(page, ids, {
      // p1, course A: only the last module has progress; Modules 1 and 2 have no scored questions
      [p1]: {
        [a]: { done: { m3: 1 }, att: [], rec: {} },
        // p1, course B: Module 1 passed its recap, Module 3 was attempted; Module 2 (no questions) was never marked
        [b]: { done: {}, att: [], rec: { m1: { best: 100, tries: 1 }, m3: { best: 60, tries: 1 } } },
      },
      // p2 (not the active profile), course A: progress in Module 2
      [p2]: { [a]: { done: { m2: 1 }, att: [], rec: {} } },
    });

    await reloadAndWaitForMigration(page);

    // stored state: the marks are exactly these, and they are listed so they can be undone by hand
    const after = await readState(page);
    expect(typeof after.migEmptyPool2.t).toBe('number');
    expect(after.migEmptyPool2.marked.map(markKey).sort()).toEqual(
      [[p1, a, 'm1'], [p1, a, 'm2'], [p1, b, 'm2'], [p2, a, 'm1']].map(markKey).sort(),
    );
    expect(Object.keys(after.prog[p1][a].done).sort()).toEqual(['m1', 'm2', 'm3']);
    expect(Object.keys(after.prog[p1][b].done)).toEqual(['m2']); // Module 1 has scored questions: not marked
    expect(Object.keys(after.prog[p2][a].done).sort()).toEqual(['m1', 'm2']);
    expect(after.prog[p1][b].rec).toEqual({ m1: { best: 100, tries: 1 }, m3: { best: 60, tries: 1 } }); // recap records untouched
    expect(after.migratedEmptyPool).toBe(true); // the old flag is left alone

    // what the learner sees, active profile, course A: every module is open and the marked ones show a tick
    await openCourse(page, COURSE_A_TITLE);
    for (const n of [1, 2, 3]) await expect(navButton(page, n)).not.toHaveClass(/lk/);
    await expect(navButton(page, 1)).toContainText('✔');
    await expect(navButton(page, 2)).toContainText('✔');
    await navButton(page, 2).click();
    await expect(page.locator('#mdc')).toContainText('Text of the second module');
    await expect(page.locator('#app')).not.toContainText('This module is locked');

    // course B: the module in the middle is open now, so Module 3 is open; Module 1 is not marked
    await openCourse(page, COURSE_B_TITLE);
    for (const n of [1, 2, 3]) await expect(navButton(page, n)).not.toHaveClass(/lk/);
    await expect(navButton(page, 1)).not.toContainText('✔');
    await expect(navButton(page, 2)).toContainText('✔');

    // the other profile (it was not active at startup) was repaired too
    await page.selectOption('#pf', p2);
    await openCourse(page, COURSE_A_TITLE);
    await expect(navButton(page, 1)).toContainText('✔');
    await expect(navButton(page, 2)).toContainText('✔');
    await expect(navButton(page, 3)).not.toHaveClass(/lk/);
    await expect(navButton(page, 3)).not.toContainText('✔');

    // and a profile without progress in course B is still locked behind the recap of Module 1
    await openCourse(page, COURSE_B_TITLE);
    await expect(navButton(page, 2)).toHaveClass(/lk/);
  });

  test('a learner with no progress is not changed: a module without questions still waits for Mark as done', async ({ page }) => {
    const ids = await setup(page);
    await seedOldState(page, ids, {});
    await reloadAndWaitForMigration(page);

    const after = await readState(page);
    expect(after.migEmptyPool2.marked).toEqual([]);

    await openCourse(page, COURSE_A_TITLE);
    await navButton(page, 1).click();
    await expect(page.locator('#mdc')).toContainText('Text of the first module');
    await expect(navButton(page, 2)).toHaveClass(/lk/);
    await expect(page.locator('[data-a="done"][data-id="m1"]')).toBeVisible(); // the explicit "done" button is there
    await page.click('[data-a="done"][data-id="m1"]');
    await expect(navButton(page, 2)).not.toHaveClass(/lk/);
  });

  test('runs once: it does not run again on the next start, and "Mark as not done" is not undone', async ({ page }) => {
    const ids = await setup(page);
    const { p1, a } = ids;
    await seedOldState(page, ids, { [p1]: { [a]: { done: { m3: 1 }, att: [], rec: {} } } });
    await reloadAndWaitForMigration(page);
    const first = (await readState(page)).migEmptyPool2;
    expect(first.marked.map(markKey).sort()).toEqual([[p1, a, 'm1'], [p1, a, 'm2']].map(markKey).sort());

    // the learner deliberately clears Module 1
    await openCourse(page, COURSE_A_TITLE);
    await navButton(page, 1).click();
    await page.click('[data-a="done"][data-id="m1"]');
    await expect.poll(async () => (await readState(page)).prog[p1][a].done.m1).toBeUndefined();

    // two more starts: nothing is marked again and the record of the first run is unchanged
    for (let i = 0; i < 2; i++) {
      await page.reload();
      await waitForLibrary(page);
      await openCourse(page, COURSE_A_TITLE);
      await expect(navButton(page, 1)).not.toContainText('✔');
    }
    const later = await readState(page);
    expect(later.migEmptyPool2).toEqual(first);
    expect(later.prog[p1][a].done.m1).toBeUndefined();
    expect(later.prog[p1][a].done.m2).toBe(1);
  });

  test('a fresh device: the flag is stored and nothing is marked', async ({ page }) => {
    await boot(page);
    await expect.poll(async () => (await readState(page))?.migEmptyPool2 !== undefined).toBe(true);
    const s = await readState(page);
    expect(s.migEmptyPool2.marked).toEqual([]);
    expect(typeof s.migEmptyPool2.t).toBe('number');
    expect(s.migratedEmptyPool).toBeUndefined();
  });
});
