import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// T1.17: a bad file never leaves a blank screen and never changes the library;
// an unexpected error shows a small banner instead of failing silently.

const KINDS = ['course', 'cats', 'road', 'backup'];
// The function each kind of file goes through (all are plain global functions on the page)
const PARSER = { course: 'parseCourse', cats: 'checkCats', road: 'checkRoads', backup: 'restoreProg' };
const SAMPLE = readFileSync('examples/sample-course.md', 'utf8');

async function chooseFile(page, kind, name, content) {
  await page.click('[data-a="nav"][data-id="imp"]');
  await page.selectOption('#ik', kind);
  await page.locator('#file').setInputFiles({ name, mimeType: 'text/plain', buffer: Buffer.from(content, 'utf8') });
}

test.describe('Import errors and the error banner (T1.17)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForSelector('#app');
    await expect(page.locator('#app')).toContainText('library is empty');
  });

  test('a file that cannot be read shows a message and leaves the library untouched', async ({ page }) => {
    // One course in the library first
    await page.click('[data-a="nav"][data-id="imp"]');
    await page.locator('#file').setInputFiles('examples/sample-course.md');
    await page.waitForTimeout(300);
    await page.click('[data-a="commit"]');
    await page.waitForTimeout(200);
    await expect(page.locator('[data-a="open"]')).toHaveCount(1);

    await page.evaluate(() => { Blob.prototype.text = () => Promise.reject(new Error('disk on fire')); });
    await chooseFile(page, 'course', 'x.md', '# Anything');
    await expect(page.locator('#app')).toContainText('This file could not be read: disk on fire');
    await expect(page.locator('#app')).toContainText('Nothing was added to the library');
    await expect(page.locator('#file')).toBeVisible();

    await page.click('[data-a="nav"][data-id="lib"]');
    await expect(page.locator('[data-a="open"]')).toHaveCount(1);
  });

  for (const kind of KINDS) {
    test(`a ${kind} parser that throws is caught (${PARSER[kind]})`, async ({ page }) => {
      await page.evaluate(fn => { window[fn] = () => { throw new Error('boom ' + fn); }; }, PARSER[kind]);
      await chooseFile(page, kind, 'x.txt', 'anything');
      await expect(page.locator('#app')).toContainText('This file could not be read: boom ' + PARSER[kind]);
      await expect(page.locator('#app')).toContainText('Nothing was added to the library');
      await expect(page.locator('#file')).toBeVisible();
    });
  }

  test('a result that the preview cannot show is caught too', async ({ page }) => {
    await page.evaluate(() => { window.parseCourse = () => ({}); }); // no report: the preview itself would throw
    await chooseFile(page, 'course', 'x.md', 'anything');
    await expect(page.locator('#app')).toContainText('This file could not be read:');
    await expect(page.locator('#file')).toBeVisible();
  });

  const CRAFTED = [
    ['empty file', ''],
    ['white space only', ' \n\t\r\n  \n'],
    ['binary-looking bytes', String.fromCharCode(...Array.from({ length: 300 }, (_, i) => (i * 37) % 256))],
    ['markup and script', '<script>alert(1)</script>\n## <img src=x onerror=alert(1)>\n| a | b |\n'],
    ['lone surrogates and right-to-left override', 'Title \ud800\udfff \u202e\n\n## Module 1 \u0000 x\n'],
    ['one very long line', 'x'.repeat(200000)],
    ['pipes only', '|'.repeat(5000)],
    ['hundreds of headings', Array.from({ length: 300 }, (_, i) => '#'.repeat(1 + (i % 6)) + ' h' + i).join('\n')],
    ['prototype keys in JSON', '{"__proto__":{"polluted":1},"v":1,"prog":{"__proto__":{"done":1}}}'],
    ['deeply nested JSON', '['.repeat(300) + ']'.repeat(300)],
    ['sample course with a mangled answer key', SAMPLE.replace(/Answers:.*/, 'Answers: ???')],
    ['sample course cut in half', SAMPLE.slice(0, Math.floor(SAMPLE.length / 2))],
  ];

  test('crafted files never leave a blank page or cause a script error', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const kind of KINDS) {
      for (const [label, content] of CRAFTED) {
        await chooseFile(page, kind, 'crafted.txt', content);
        await expect(page.locator('#app')).toContainText('Check result for crafted.txt');
        await expect(page.locator('#file')).toBeVisible();
      }
    }
    expect(errors.join(' | ')).toBe('');
  });

  test('crafted courses that are accepted can still be added, opened and read', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const courses = [
      SAMPLE.replace('## Module 1 · Bits and bytes', '## Module 1 · <b>Bits</b> & "bytes" \u202e'),
      SAMPLE.replace(/\*\*Q3\.\*\*.*/, '**Q3.** <img src=x onerror=alert(1)> (numeric) Enter a whole number.'),
      SAMPLE + '\n\n## Module 3 · ' + 'Long '.repeat(2000) + '\n\n' + 'word '.repeat(20000),
    ];
    for (const md of courses) {
      await chooseFile(page, 'course', 'c.md', md);
      await expect(page.locator('#app')).toContainText('Check result for c.md');
      if (await page.locator('[data-a="commit"]').count()) {
        await page.click('[data-a="commit"]');
        await page.waitForTimeout(200);
        await page.locator('[data-a="open"]').last().click();
        await expect(page.locator('#f')).toBeVisible();
        // Locked modules are aria-disabled (T1.21), which Playwright will not click; they are still reachable by keyboard
        const navs = page.locator('#app nav .nav:not([aria-disabled="true"])');
        const n = await navs.count();
        for (let i = 0; i < Math.min(n, 4); i++) await navs.nth(i).click();
        await page.click('[data-a="tab"][data-id="test"]');
        await expect(page.locator('#app')).toContainText('Practice test');
        await page.click('[data-a="nav"][data-id="lib"]');
      }
    }
    expect(errors.join(' | ')).toBe('');
  });

  test('an unexpected error shows a non-blocking banner with Reload and Dismiss', async ({ page }) => {
    await page.evaluate(() => { setTimeout(() => { throw new Error('late boom'); }, 0); });
    await expect(page.locator('#err')).toBeVisible();
    await expect(page.locator('#err')).toContainText('Something went wrong');
    await expect(page.locator('#err')).toContainText('late boom');
    await expect(page.locator('#err [data-a="reload"]')).toBeVisible();

    // The app keeps working while the banner is up
    await page.click('[data-a="nav"][data-id="imp"]');
    await expect(page.locator('#app')).toContainText('Import');
    await expect(page.locator('#err')).toBeVisible();

    await page.click('#err [data-a="errx"]');
    await expect(page.locator('#err')).toHaveCount(0);
  });

  test('an unhandled promise rejection shows the banner, and a second error updates the same banner', async ({ page }) => {
    await page.evaluate(() => { Promise.reject(new Error('async boom')); });
    await expect(page.locator('#err')).toContainText('async boom');
    await page.evaluate(() => { setTimeout(() => { throw new Error('second boom'); }, 0); });
    await expect(page.locator('#err')).toContainText('second boom');
    await expect(page.locator('#err')).toHaveCount(1);
  });

  test('Reload reloads the page and the banner is gone afterwards', async ({ page }) => {
    await page.evaluate(() => { window.__marker = 1; setTimeout(() => { throw new Error('x'); }, 0); });
    await expect(page.locator('#err')).toBeVisible();
    await page.click('#err [data-a="reload"]');
    await page.waitForFunction(() => window.__marker === undefined);
    await expect(page.locator('#app')).toContainText('library is empty');
    await expect(page.locator('#err')).toHaveCount(0);
  });

  test('harmless browser noise does not show the banner', async ({ page }) => {
    await page.evaluate(() => {
      window.dispatchEvent(new ErrorEvent('error', { message: 'ResizeObserver loop completed with undelivered notifications.' }));
      window.dispatchEvent(new ErrorEvent('error', { message: 'Script error.' }));
    });
    await page.waitForTimeout(300);
    await expect(page.locator('#err')).toHaveCount(0);
  });
});
