import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.describe('Offline Course Library E2E', () => {
  test.beforeEach(async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        errors.push(text);
        console.log('Browser console error:', text, msg.location());
      }
    });
    page.on('pageerror', err => {
      errors.push(err.message);
      console.log('Page error:', err.message, err.stack);
    });
    
    await page.goto('http://localhost:8080/');
    // Wait for app to initialize and render
    await page.waitForSelector('#app');
    // Wait for the library content to render (either empty state or courses)
    try {
      await page.waitForFunction(() => document.querySelector('#app')?.textContent?.includes('library is empty') 
        || document.querySelector('#app')?.textContent?.includes('Bits, Bytes')
        || document.querySelector('#app')?.textContent?.includes('Search the library'), { timeout: 10000 });
    } catch (e) {
      console.log('All console errors:', errors);
      // Also check the page content
      const content = await page.locator('#app').textContent();
      console.log('#app content:', content);
      throw e;
    }
  });

  test('boots to empty library', async ({ page }) => {
    await expect(page.locator('#app')).toContainText('library is empty');
  });

  test('imports sample course', async ({ page }) => {
    // Navigate to Import
    await page.click('[data-a="nav"][data-id="imp"]');
    await expect(page.locator('#app')).toContainText('What are you importing');

    // Upload sample course
    const fileInput = page.locator('#file');
    await fileInput.setInputFiles('examples/sample-course.md');
    await page.waitForTimeout(300);

    // Check import report
    await expect(page.locator('#app')).toContainText('2 modules, 5 questions');
    await expect(page.locator('#app')).toContainText('Diagnostic: 3 items read');

    // Commit
    await page.click('[data-a="commit"]');
    await page.waitForTimeout(200);

    // Verify course appears in library
    await expect(page.locator('[data-a="open"]')).toContainText('Bits, Bytes and Colour');
  });

  test('opens course and reads module', async ({ page }) => {
    // Import first
    await page.click('[data-a="nav"][data-id="imp"]');
    await page.locator('#file').setInputFiles('examples/sample-course.md');
    await page.waitForTimeout(300);
    await page.click('[data-a="commit"]');
    await page.waitForTimeout(200);

    // Open course
    await page.click('[data-a="open"]:has-text("Bits, Bytes and Colour")');
    await page.waitForTimeout(200);

    // Should be on About page initially
    await expect(page.locator('#app')).toContainText('short sample used to check the importer');

    // Navigate to Module 1
    await page.click('nav .nav:has-text("Module 1")');
    await page.waitForTimeout(100);

    // Module 1 content renders
    await expect(page.locator('#mdc')).toContainText('bit is one binary digit');
    await expect(page.locator('#mdc table')).toBeVisible();
  });

  test('module 2 locked until recap passed', async ({ page }) => {
    // Import and open
    await page.click('[data-a="nav"][data-id="imp"]');
    await page.locator('#file').setInputFiles('examples/sample-course.md');
    await page.waitForTimeout(300);
    await page.click('[data-a="commit"]');
    await page.waitForTimeout(200);
    await page.click('[data-a="open"]:has-text("Bits, Bytes and Colour")');
    await page.waitForTimeout(200);

    // Navigate to Module 1 first (course opens on About page)
    await page.click('nav .nav:has-text("Module 1")');
    await page.waitForTimeout(100);

    // Module 2 should be locked in sidebar
    const mod2Nav = page.locator('nav .nav:has-text("Module 2")');
    await expect(mod2Nav).toHaveClass(/lk/);

    // Take recap for Module 1
    await page.click('[data-a="recap"]');
    await page.waitForTimeout(200);

    // Answer all 3 questions correctly
    await page.check('input[name="q1"][value="B"]');
    await page.check('input[name="q2"][value="A"]');
    await page.check('input[name="q2"][value="B"]');
    await page.fill('input[name="q3"]', '32');
    await page.click('[data-a="submit"]');
    await page.waitForTimeout(300);

    // Should pass and unlock next module
    await expect(page.locator('#app')).toContainText('Passed with 100%');

    // Click "Next module"
    await page.click('[data-a="sec"]:has-text("Next module")');
    await page.waitForTimeout(200);

    // Module 2 should now be open
    await expect(page.locator('#mdc')).toContainText('Colour models');
  });

  test('practice test runs', async ({ page }) => {
    // Import and open
    await page.click('[data-a="nav"][data-id="imp"]');
    await page.locator('#file').setInputFiles('examples/sample-course.md');
    await page.waitForTimeout(300);
    await page.click('[data-a="commit"]');
    await page.waitForTimeout(200);
    await page.click('[data-a="open"]:has-text("Bits, Bytes and Colour")');
    await page.waitForTimeout(200);

    // Go to Practice tab
    await page.click('[data-a="tab"][data-id="test"]');
    await page.waitForTimeout(100);

    // Should show difficulty options
    await expect(page.locator('#app')).toContainText('Mixed (all levels)');

    // Start mixed test
    await page.click('[data-a="start"][data-id="-1"]');
    await page.waitForTimeout(200);

    // Should render questions (4 questions in sample: 3 scored + 1 self-check)
    const fieldsets = page.locator('#app fieldset');
    await expect(fieldsets).toHaveCount(4);
  });

  test('diagnostic runs', async ({ page }) => {
    // Import and open
    await page.click('[data-a="nav"][data-id="imp"]');
    await page.locator('#file').setInputFiles('examples/sample-course.md');
    await page.waitForTimeout(300);
    await page.click('[data-a="commit"]');
    await page.waitForTimeout(200);
    await page.click('[data-a="open"]:has-text("Bits, Bytes and Colour")');
    await page.waitForTimeout(200);

    // Go to Diagnostic tab
    await page.click('[data-a="tab"][data-id="diag"]');
    await page.waitForTimeout(100);

    // Start diagnostic
    await page.click('[data-a="dstart"]');
    await page.waitForTimeout(100);

    // Answer 3 questions
    await page.check('input[name="dgD1"][value="B"]');
    await page.check('input[name="dgD2"][value="A"]');
    await page.check('input[name="dgD3"][value="A"]');
    await page.click('[data-a="dsub"]');
    await page.waitForTimeout(300);

    // Should show results
    await expect(page.locator('#app')).toContainText('Diagnostic:');
  });

  test('flashcards work', async ({ page }) => {
    // Import and open
    await page.click('[data-a="nav"][data-id="imp"]');
    await page.locator('#file').setInputFiles('examples/sample-course.md');
    await page.waitForTimeout(300);
    await page.click('[data-a="commit"]');
    await page.waitForTimeout(200);
    await page.click('[data-a="open"]:has-text("Bits, Bytes and Colour")');
    await page.waitForTimeout(200);

    // Navigate to Module 1 first
    await page.click('nav .nav:has-text("Module 1")');
    await page.waitForTimeout(100);

    // Go to Flashcards tab
    await page.click('[data-a="tab"][data-id="rev"]');
    await page.waitForTimeout(100);

    // Start flashcards for Module 1 - the button has data-a="fcs" and contains "Study"
    await page.click('[data-a="fcs"]:has-text("Study")');
    await page.waitForTimeout(100);

    // Should show card
    await expect(page.locator('#app fieldset')).toBeVisible();
    await expect(page.locator('#app')).toContainText('How many bits are in a byte');

    // Show answer
    await page.click('[data-a="fcshow"]');
    await page.waitForTimeout(100);
    await expect(page.locator('#app details')).toBeVisible();

    // Rate "Got it"
    await page.click('[data-a="fcr"][data-id="got"]');
    await page.waitForTimeout(100);
  });

  // --- T1.5 Find in course ---------------------------------------------------
  async function openSampleCourse(page, md) {
    await page.click('[data-a="nav"][data-id="imp"]');
    await page.locator('#file').setInputFiles(
      md ? { name: 'long.md', mimeType: 'text/markdown', buffer: Buffer.from(md) } : 'examples/sample-course.md');
    await page.waitForTimeout(300);
    await page.click('[data-a="commit"]');
    await page.waitForTimeout(200);
    await page.click('[data-a="open"]:has-text("Bits, Bytes and Colour")');
    await expect(page.locator('#f')).toBeVisible();
  }

  test('find in course keeps the input, the caret and the focus while typing', async ({ page }) => {
    await openSampleCourse(page);
    await page.focus('#f');
    await page.evaluate(() => { window.__findInput = document.querySelector('#f'); });
    await page.keyboard.type('byte');
    await expect(page.locator('#fc')).toContainText('found in the course');

    // Move the caret into the middle of the text and type again
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.type('X');
    await page.waitForTimeout(400); // debounce (about 150 ms) plus the update

    const st = await page.evaluate(() => {
      const f = document.querySelector('#f');
      return { value: f.value, caret: f.selectionStart, same: f === window.__findInput, focused: f === document.activeElement };
    });
    expect(st.value).toBe('byXte');
    expect(st.caret).toBe(3);
    expect(st.same).toBe(true);
    expect(st.focused).toBe(true);
  });

  test('find in course keeps the scroll position on a long page', async ({ page }) => {
    const filler = Array.from({ length: 200 }, (_, i) => `Filler paragraph ${i + 1} with some neutral words.`).join('\n\n');
    const md = readFileSync('examples/sample-course.md', 'utf8')
      .replace('### Recall check\n\nHow many bits', filler + '\n\n### Recall check\n\nHow many bits');
    await openSampleCourse(page, md);
    await page.click('nav .nav:has-text("Module 1")');
    await page.evaluate(() => window.scrollTo(0, 1500));
    const before = await page.evaluate(() => window.scrollY);
    expect(before).toBeGreaterThan(1000);

    // A search with no match anywhere must not move the page
    await page.evaluate(() => {
      const f = document.querySelector('#f');
      f.value = 'zzzz';
      f.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(400);
    await expect(page.locator('#fc')).toContainText('none on this page');
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('find in course updates the article, the nav counters and the match counter', async ({ page }) => {
    await openSampleCourse(page);
    await page.focus('#f');

    // "nibble" is only in Module 1, so the view moves there from the About section
    await page.keyboard.type('nibble');
    await expect(page.locator('nav .nav.on')).toContainText('Module 1');
    await expect(page.locator('nav .nav:has-text("Module 1") .cnt')).toBeVisible();
    await expect(page.locator('#fc')).toContainText('1 of 1 on this page');
    expect(await page.locator('#mdc mark').count()).toBe(1);

    // "bit" has several matches on the page; the Next button moves to the second one
    await page.keyboard.press('Control+A');
    await page.keyboard.type('bit');
    await page.waitForFunction(() => document.querySelectorAll('#mdc mark').length > 1);
    await expect(page.locator('#fc')).toContainText('1 of');
    await page.click('[data-a="fn"]');
    await expect(page.locator('#fc')).toContainText('2 of');

    // Clearing the field removes the marks and the counters
    await page.focus('#f');
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(400);
    expect(await page.locator('#mdc mark').count()).toBe(0);
    await expect(page.locator('nav .cnt')).toHaveCount(0);
    await expect(page.locator('#fc')).not.toContainText('found');
  });

  // --- T1.8 Safer submission -------------------------------------------------
  async function startModule1Recap(page) {
    await page.click('[data-a="nav"][data-id="imp"]');
    await page.locator('#file').setInputFiles('examples/sample-course.md');
    await page.waitForTimeout(300);
    await page.click('[data-a="commit"]');
    await page.waitForTimeout(200);
    await page.click('[data-a="open"]:has-text("Bits, Bytes and Colour")');
    await page.waitForTimeout(200);
    await page.click('nav .nav:has-text("Module 1")');
    await page.waitForTimeout(100);
    await page.click('[data-a="recap"]');
    await expect(page.locator('input[name="q1"]').first()).toBeVisible();
  }

  test('draft answers survive a re-render', async ({ page }) => {
    await startModule1Recap(page);
    await page.check('input[name="q1"][value="B"]');
    await page.check('input[name="q2"][value="A"]');
    await page.fill('input[name="q3"]', '32');

    // Opening and cancelling the "reset course" prompt re-renders the whole view
    await page.click('[data-a="cf"][data-id="reset"]');
    await expect(page.locator('#app')).toContainText('Start this course again');
    await page.click('[data-a="cfn"]');

    await expect(page.locator('input[name="q1"][value="B"]')).toBeChecked();
    await expect(page.locator('input[name="q2"][value="A"]')).toBeChecked();
    await expect(page.locator('input[name="q2"][value="B"]')).not.toBeChecked();
    await expect(page.locator('input[name="q3"]')).toHaveValue('32');
  });

  test('submit with an unanswered question asks first; Go back keeps the answers', async ({ page }) => {
    await startModule1Recap(page);
    await page.check('input[name="q1"][value="B"]');
    await page.fill('input[name="q3"]', '32');
    await page.click('[data-a="submit"]');

    await expect(page.locator('#app')).toContainText('1 unanswered. Submit anyway or go back?');
    await expect(page.locator('#app')).not.toContainText('Score:');

    await page.click('[data-a="sback"]');
    await expect(page.locator('#conf')).toHaveCount(0);
    await expect(page.locator('input[name="q2"]').first()).toBeFocused();
    await expect(page.locator('input[name="q1"][value="B"]')).toBeChecked();
    await expect(page.locator('input[name="q3"]')).toHaveValue('32');

    // With everything answered there is no prompt
    await page.check('input[name="q2"][value="A"]');
    await page.check('input[name="q2"][value="B"]');
    await page.click('[data-a="submit"]');
    await expect(page.locator('#app')).toContainText('Passed with 100%');
  });

  test('Submit anyway names the unanswered question as Not answered', async ({ page }) => {
    await startModule1Recap(page);
    await page.check('input[name="q1"][value="B"]');
    await page.fill('input[name="q3"]', '32');
    await page.click('[data-a="submit"]');
    await page.click('[data-a="submit"][data-id="force"]');

    await expect(page.locator('#app')).toContainText('Score: 2 / 3');
    await expect(page.locator('#app')).toContainText('Not answered');
    await expect(page.locator('#app')).toContainText('1 not answered (scored as incorrect).');
    await expect(page.locator('#app')).not.toContainText('your answer: none');
  });

  
  // --- T1.20 Help affordance -------------------------------------------------
  test('help buttons are visible, at least 44x44 px, and there is no floating "?"', async ({ page }) => {
    // Empty library: the search box and the unlock box each have a help topic
    await expect(page.locator('#app button.info').first()).toBeVisible();
    await expect(page.locator('.hb')).toHaveCount(0);

    // An open course shows more topics
    await page.click('[data-a="nav"][data-id="imp"]');
    await page.locator('#file').setInputFiles('examples/sample-course.md');
    await page.waitForTimeout(300);
    await page.click('[data-a="commit"]');
    await page.waitForTimeout(200);
    await page.click('[data-a="open"]:has-text("Bits, Bytes and Colour")');
    await page.waitForTimeout(200);

    const infos = page.locator('#app button.info');
    const n = await infos.count();
    expect(n).toBeGreaterThan(3);
    for (let i = 0; i < n; i++) {
      const box = await infos.nth(i).boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(await infos.nth(i).getAttribute('aria-label')).toMatch(/^Help: /);
    }
  });

  test('a help button is reached with Tab and opens the matching Help section from the keyboard', async ({ page }) => {
    await page.focus('#sq');
    await page.keyboard.press('Tab');
    const info = page.locator('#app button.info[data-id="library"]');
    await expect(info).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page.locator('#h-library')).toBeVisible();
    await expect(page.locator('#app')).toContainText('Courses are grouped by category');
  });

  test('offline mode works after first load', async ({ page, context, browserName }) => {
    // First load online
    await page.goto('http://localhost:8080/');
    await page.waitForSelector('#app');
    await page.waitForTimeout(500);

    // Check service worker registered
    const swReg = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return reg.active !== null;
    });
    expect(swReg).toBe(true);

    // Go offline
    await context.setOffline(true);

    // Reload - should still work (handle potential redirect on WebKit)
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
    } catch (e) {
      // WebKit may fail with service worker redirect; try a fresh navigation
      if (browserName === 'webkit') {
        await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
      } else {
        throw e;
      }
    }
    await page.waitForSelector('#app');
    await expect(page.locator('#app')).toContainText('library is empty');
  });
});