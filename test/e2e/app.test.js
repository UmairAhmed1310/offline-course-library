import { test, expect } from '@playwright/test';

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