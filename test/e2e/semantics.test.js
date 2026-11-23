import { test, expect } from '@playwright/test';

// T1.21: roles, names and states for assistive technology (progress bars, current page,
// locked modules, path pills, skip link, named navigations).

async function openSample(page) {
  await page.click('[data-a="nav"][data-id="imp"]');
  await page.locator('#file').setInputFiles('examples/sample-course.md');
  await page.waitForTimeout(300);
  await page.click('[data-a="commit"]');
  await page.waitForTimeout(250);
}

test.describe('Semantics (T1.21)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/');
    await page.waitForSelector('#app');
    await expect(page.locator('#app')).toContainText('library is empty');
  });

  test('every progress bar is a named progressbar with a value and a text value', async ({ page }) => {
    await openSample(page);

    const check = async () => page.$$eval('#app .bar', bars => bars.map(b => ({
      role: b.getAttribute('role'), name: b.getAttribute('aria-label'),
      min: b.getAttribute('aria-valuemin'), max: b.getAttribute('aria-valuemax'),
      now: b.getAttribute('aria-valuenow'), text: b.getAttribute('aria-valuetext'),
    })));

    // Library card
    let bars = await check();
    expect(bars.length).toBeGreaterThan(0);
    for (const b of bars) {
      expect(b.role).toBe('progressbar');
      expect(b.name).toBe('Course progress');
      expect(b.min).toBe('0');
      expect(b.max).toBe('100');
      expect(Number(b.now)).toBeGreaterThanOrEqual(0);
      expect(Number(b.now)).toBeLessThanOrEqual(100);
      expect(b.text).toMatch(/^\d+% of modules done$/);
    }

    // Course page
    await page.click('[data-a="open"]');
    await expect(page.locator('#f')).toBeVisible();
    bars = await check();
    expect(bars.length).toBeGreaterThan(0);
    for (const b of bars) {
      expect(b.role).toBe('progressbar');
      expect(b.name).toBe('Course progress');
      expect(b.text).toMatch(/modules complete/);
    }
  });

  test('a roadmap progress bar is named and has a text value', async ({ page }) => {
    await openSample(page);
    await page.click('[data-a="nav"][data-id="imp"]');
    await page.selectOption('#ik', 'road');
    await page.locator('#file').setInputFiles('examples/sample-roadmap.md');
    await expect(page.locator('#app')).toContainText('Check result for sample-roadmap.md');
    await page.click('[data-a="commit"]');
    await page.waitForTimeout(250);
    const bar = page.locator('#app details .bar').first();
    await expect(bar).toHaveAttribute('role', 'progressbar');
    await expect(bar).toHaveAttribute('aria-label', 'Roadmap progress');
    expect(Number(await bar.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(0);
    expect(await bar.getAttribute('aria-valuetext')).toMatch(/\d+%/);
  });

  test('the header is a named navigation and marks the current page', async ({ page }) => {
    await expect(page.locator('#bar')).toHaveAttribute('role', 'navigation');
    await expect(page.locator('#bar')).toHaveAttribute('aria-label', 'Main');
    await expect(page.locator('#bar [aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('#bar [aria-current="page"]')).toContainText('Library');

    await page.click('[data-a="nav"][data-id="imp"]');
    await expect(page.locator('#bar [aria-current="page"]')).toHaveCount(1);
    await expect(page.locator('#bar [aria-current="page"]')).toContainText('Import');
    await expect(page.locator('[data-a="nav"][data-id="lib"]')).not.toHaveAttribute('aria-current', 'page');
  });

  test('the section navigation is named, marks the current section and keeps locked modules focusable', async ({ page }) => {
    await openSample(page);
    await page.click('[data-a="open"]');
    const sections = page.locator('nav[aria-label="Course sections"]');
    await expect(sections).toHaveCount(1);

    // The About page is the current section: a page, not a step
    await expect(sections.locator('[aria-current]')).toHaveCount(1);
    await expect(sections.locator('[aria-current="page"]')).toContainText('About this course');

    // A module is a step
    await page.click('nav .nav:has-text("Module 1")');
    await expect(sections.locator('[aria-current="step"]')).toContainText('Module 1');
    await expect(sections.locator('[aria-current]')).toHaveCount(1);

    // The locked module is marked, still focusable, and still shows its lock message
    const locked = sections.locator('.nav:has-text("Module 2")');
    await expect(locked).toHaveAttribute('aria-disabled', 'true');
    await expect(sections.locator('.nav:has-text("Module 1")')).not.toHaveAttribute('aria-disabled', 'true');
    await locked.focus();
    await expect(locked).toBeFocused();
    await locked.press('Enter');
    await expect(page.locator('#app article')).toContainText('This module is locked');

    // The two navigations have different names
    const names = await page.$$eval('nav, [role="navigation"]', els => els.map(e => e.getAttribute('aria-label')));
    expect(names.length).toBe(2);
    expect(new Set(names).size).toBe(2);
    expect(names.every(n => n && n.length > 0)).toBe(true);
  });

  test('the section navigation keeps its semantics when only that part of the page is replaced', async ({ page }) => {
    await openSample(page);
    await page.click('[data-a="open"]');
    await page.click('nav .nav:has-text("Module 1")');
    // Replace the navigation's buttons in place, as a partial update (such as find-in-course) does, without render()
    await page.evaluate(() => { const n = document.querySelector('#app .split > nav'); n.innerHTML = n.innerHTML; });
    const sections = page.locator('nav[aria-label="Course sections"]');
    await expect(sections.locator('[aria-current="step"]')).toContainText('Module 1');
    await expect(sections.locator('.nav:has-text("Module 2")')).toHaveAttribute('aria-disabled', 'true');
    await expect(sections.locator('[aria-current]')).toHaveCount(1);
  });

  test('the course tabs mark the current one', async ({ page }) => {
    await openSample(page);
    await page.click('[data-a="open"]');
    await expect(page.locator('#app [data-a="tab"][aria-current="true"]')).toHaveCount(1);
    await expect(page.locator('#app [data-a="tab"][aria-current="true"]')).toContainText('Read');
    await page.click('[data-a="tab"][data-id="test"]');
    await expect(page.locator('#app [data-a="tab"][aria-current="true"]')).toHaveCount(1);
    await expect(page.locator('#app [data-a="tab"][aria-current="true"]')).toContainText('Practice test');
  });

  test('path pills have text alternatives, and a finished module says how many stars', async ({ page }) => {
    await openSample(page);
    await page.click('[data-a="open"]');
    const pills = page.locator('#app .pill');
    await expect(pills).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      await expect(pills.nth(i)).toHaveAttribute('role', 'img');
    }
    await expect(pills.nth(0)).toHaveAttribute('aria-label', 'Module 1 · Bits and bytes: open');
    await expect(pills.nth(1)).toHaveAttribute('aria-label', 'Module 2 · Colour models: locked');

    // Pass the Module 1 recap with every answer right (3 stars)
    await page.click('nav .nav:has-text("Module 1")');
    await page.click('[data-a="recap"]');
    await page.check('input[name="q1"][value="B"]');
    await page.check('input[name="q2"][value="A"]');
    await page.check('input[name="q2"][value="B"]');
    await page.fill('input[name="q3"]', '32');
    await page.click('[data-a="submit"]');
    await expect(page.locator('#app')).toContainText('Passed with 100%');
    await expect(pills.nth(0)).toHaveAttribute('aria-label', 'Module 1 · Bits and bytes: done, 3 stars');
    await expect(pills.nth(1)).toHaveAttribute('aria-label', 'Module 2 · Colour models: open');
  });

  test('a skip link is the first stop, appears on focus, and moves focus to the content', async ({ page }) => {
    await page.keyboard.press('Tab');
    const skip = page.locator('a.skip');
    await expect(skip).toBeFocused();
    await expect(skip).toContainText('Skip to content');
    const box = await skip.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.width).toBeGreaterThan(40);

    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => document.activeElement && document.activeElement.id)).toBe('app');
    expect(await page.evaluate(() => location.hash)).toBe('');
  });

  test('in forced-colours mode the current item is underlined, not only filled', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'emulateMedia forcedColors is checked in Chromium only');
    await page.emulateMedia({ forcedColors: 'active' });
    const deco = await page.$eval('#bar [aria-current="page"]', e => getComputedStyle(e).textDecorationLine);
    expect(deco).toContain('underline');
  });
});
