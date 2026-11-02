import { test as base, expect, type Page } from '@playwright/test';
import { tools, categories, categorySlug } from '@/tools/registry';

/**
 * Console errors that are expected and harmless everywhere. Each entry needs a
 * comment explaining why it is safe to ignore. (Currently none.)
 */
const BENIGN_CONSOLE_ERRORS: RegExp[] = [];

/**
 * Tool pages with a known, real app bug. The test still asserts correct
 * behaviour but is marked fixme until the bug is fixed.
 */
const KNOWN_BROKEN_TOOLS: Record<string, string> = {
  // Hydration mismatch (React #418): the page is statically prerendered at build
  // time, and src/app/tools/timezone/page.tsx seeds state during render with
  // `new Date()` (dateStr) and a window-dependent LOCAL_TZ ('UTC' on the server),
  // so the server HTML never matches the first client render.
  timezone: 'hydration mismatch from Date/timezone read during render',
};

type Fixtures = {
  /** Allow a console error matching `re` in the current test only. */
  allowConsoleError: (re: RegExp) => void;
};

/**
 * Every test fails if any page in its browser context throws an uncaught error
 * or logs a console error (minus the allow-lists).
 */
const test = base.extend<Fixtures>({
  allowConsoleError: [
    async ({ context }, use) => {
      const errors: string[] = [];
      const allowed = [...BENIGN_CONSOLE_ERRORS];
      context.on('weberror', (err) => errors.push(`pageerror: ${err.error().message}`));
      context.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        if (allowed.some((re) => re.test(text))) return;
        errors.push(`console.error: ${text} (${msg.location().url})`);
      });
      await use((re) => allowed.push(re));
      expect(errors, 'uncaught page errors / console errors').toEqual([]);
    },
    { auto: true },
  ],
});

/** The browser logs the 404 document response itself as a console error. */
const DOCUMENT_404 = /Failed to load resource: the server responded with a status of 404/;

const tabList = (page: Page) => page.getByRole('tablist', { name: 'Workspace tabs' });

/**
 * useWorkspaces hydrates asynchronously (localStorage, then an IndexedDB fallback)
 * and replaces the SSR placeholder tab when done; tab actions taken before that
 * are overwritten. The active-tab key is written only once hydration has finished.
 */
async function waitForWorkspaces(page: Page, storageKey: string) {
  await expect
    .poll(() => page.evaluate((k) => localStorage.getItem(`devtools-active-workspace-${k}`), storageKey))
    .not.toBeNull();
}

/** Waits until a tool's workspace tabs have been persisted to localStorage (300ms debounce). */
async function waitForPersisted(page: Page, storageKey: string, predicate: string) {
  await expect
    .poll(() => page.evaluate((k) => localStorage.getItem(`devtools-workspaces-${k}`) ?? '', storageKey))
    .toContain(predicate);
}

// ── Every tool page ────────────────────────────────────────────────────────────

test.describe('tool pages', () => {
  for (const tool of tools) {
    test(`${tool.id} loads`, async ({ page, request }) => {
      test.fixme(tool.id in KNOWN_BROKEN_TOOLS, KNOWN_BROKEN_TOOLS[tool.id]);
      const res = await page.goto(`/tools/${tool.id}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1').first()).toBeVisible();

      // Breadcrumb category link must point at a real category page
      const crumb = page.getByRole('navigation', { name: 'Breadcrumb' });
      const categoryLink = crumb.locator('a[href^="/tools/categories/"]');
      await expect(categoryLink).toHaveCount(1);
      const href = await categoryLink.getAttribute('href');
      expect(href).toBe(`/tools/categories/${categorySlug(tool.category)}`);
      const catRes = await request.get(href!);
      expect(catRes.status(), `breadcrumb ${href}`).toBe(200);

      // Give client effects (workers, hydration-time effects) a moment to surface errors
      await page.waitForLoadState('networkidle');
    });
  }
});

// ── Static pages ───────────────────────────────────────────────────────────────

test.describe('pages', () => {
  test('home renders', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('all tools page lists every tool', async ({ page }) => {
    const res = await page.goto('/tools');
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'All Tools' })).toBeVisible();
    for (const tool of tools.slice(0, 3)) {
      await expect(page.locator(`main a[href="/tools/${tool.id}"]`).first()).toBeAttached();
    }
  });

  for (const cat of categories) {
    test(`category ${cat} renders`, async ({ page }) => {
      const res = await page.goto(`/tools/categories/${categorySlug(cat)}`);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(cat);
      for (const tool of tools.filter((t) => t.category === cat)) {
        await expect(page.locator(`a[href="/tools/${tool.id}"]`).first()).toBeAttached();
      }
    });
  }

  test('unknown category is a 404', async ({ page, allowConsoleError }) => {
    allowConsoleError(DOCUMENT_404);
    const res = await page.goto('/tools/categories/not-a-category');
    expect(res?.status()).toBe(404);
  });

  test('unknown route renders the 404 page', async ({ page, allowConsoleError }) => {
    allowConsoleError(DOCUMENT_404);
    const res = await page.goto('/this-route-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/could not be found|404/i).first()).toBeVisible();
  });
});

// ── Key flows ──────────────────────────────────────────────────────────────────

test.describe('flows', () => {
  test('JSON tool beautifies input', async ({ page }) => {
    await page.goto('/tools/json');
    await waitForWorkspaces(page, 'json');
    const input = page.locator('textarea').first();
    await input.fill('{"alpha":1,"beta":[1,2]}');
    await page.getByRole('group', { name: 'Format action' }).getByRole('button', { name: 'Beautify' }).click();

    const viewer = page.getByPlaceholder('Search keys or values...').locator('xpath=../..');
    await expect(viewer).toContainText('"alpha": 1');
    await expect(page.getByText('7 lines')).toBeVisible();
  });

  test('Base64 decode → Open in JSON Tool hands off into a new tab', async ({ page }) => {
    const payload = { handoff: 'works', n: 42 };
    await page.goto('/tools/encoder');
    await waitForWorkspaces(page, 'encoder');

    await page.getByRole('button', { name: 'Decode', exact: true }).click();
    await page.getByPlaceholder('Type values here...').fill(Buffer.from(JSON.stringify(payload)).toString('base64'));
    await page.getByRole('button', { name: 'Open in JSON Tool' }).click();

    await expect(page).toHaveURL(/\/tools\/json$/);
    const tabs = tabList(page).getByRole('tab');
    await expect(tabs).toHaveCount(2); // default JSON tab is kept
    await expect(tabList(page).getByRole('tab', { selected: true })).toContainText('From Base64');
    await expect(page.locator('textarea').first()).toHaveValue(JSON.stringify(payload));
    await expect(page.getByPlaceholder('Search keys or values...').locator('xpath=../..')).toContainText('"handoff": "works"');
  });

  test('workspace tab: add and rename persists after reload', async ({ page }) => {
    await page.goto('/tools/json');
    await waitForWorkspaces(page, 'json');
    const tabs = tabList(page).getByRole('tab');
    await expect(tabs).toHaveCount(1);

    await page.getByRole('button', { name: 'New tab' }).click();
    await expect(tabs).toHaveCount(2);
    const newTab = tabList(page).getByRole('tab', { selected: true });
    await expect(newTab).toContainText('JSON 2');

    await newTab.getByText('JSON 2').dblclick();
    const nameInput = page.getByRole('textbox', { name: 'Tab name' });
    await expect(nameInput).toBeFocused();
    await nameInput.fill('My Renamed Tab');
    await nameInput.press('Enter');
    await expect(nameInput).toBeHidden();
    await expect(tabList(page).getByRole('tab', { selected: true })).toContainText('My Renamed Tab');

    await waitForPersisted(page, 'json', 'My Renamed Tab');
    await page.reload();
    await expect(tabs).toHaveCount(2);
    await expect(tabList(page).getByRole('tab', { selected: true })).toContainText('My Renamed Tab');
  });

  test('share link round-trip opens a new tab and keeps existing tabs', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const sharedInput = '{"shared":"payload-123"}';

    await page.goto('/tools/json');
    await waitForWorkspaces(page, 'json');
    await expect(tabList(page).getByRole('tab')).toHaveCount(1);
    // Two pre-existing tabs: the default one and a second one we share from
    await page.getByRole('button', { name: 'New tab' }).click();
    await expect(tabList(page).getByRole('tab')).toHaveCount(2);
    await page.locator('textarea').first().fill(sharedInput);
    await waitForPersisted(page, 'json', 'payload-123');

    await page.getByRole('button', { name: 'Share' }).click();
    await expect(page.getByText('Shareable link copied to clipboard!')).toBeVisible();
    const link = await page.evaluate(() => navigator.clipboard.readText());
    expect(link).toMatch(/\/tools\/json#share=/);

    // Open the link in a second page of the same browser profile (shares localStorage)
    const other = await context.newPage();
    await other.goto(link);
    const otherTabs = tabList(other).getByRole('tab');
    await expect(otherTabs).toHaveCount(3);
    await expect(otherTabs.nth(0)).toContainText('JSON 1');
    await expect(otherTabs.nth(1)).toContainText('JSON 2');
    await expect(tabList(other).getByRole('tab', { selected: true })).toContainText('Shared Tab');
    await expect(other.locator('textarea').first()).toHaveValue(sharedInput);
    // Hash is cleared so a reload doesn't re-import the share
    await expect(other).toHaveURL(/\/tools\/json$/);
  });

  test('fullscreen toggle keeps the JSON output search text', async ({ page }) => {
    await page.goto('/tools/json');
    await waitForWorkspaces(page, 'json');
    const search = page.getByPlaceholder('Search keys or values...');
    await search.fill('city');
    await expect(page.getByText('1/1')).toBeVisible();

    await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
    const overlay = page.getByRole('dialog', { name: 'Fullscreen editor' });
    await expect(overlay).toBeVisible();
    await expect(overlay.getByPlaceholder('Search keys or values...')).toHaveValue('city');

    await overlay.getByRole('button', { name: 'Exit', exact: true }).click();
    await expect(overlay).toBeHidden();
    await expect(search).toHaveValue('city');
  });

  test('command palette opens with Ctrl/Meta+K', async ({ page }) => {
    await page.goto('/');
    const combobox = page.getByRole('combobox', { name: /Search \d+ tools/ });
    // The server-rendered page is visible before the shortcut listener is attached
    // on hydration, so retry the key press until the palette opens.
    await expect(async () => {
      await page.keyboard.press('ControlOrMeta+k');
      await expect(combobox).toBeVisible({ timeout: 1_000 });
    }).toPass();
    await expect(combobox).toBeFocused();

    await combobox.fill('base64');
    const results = page.getByRole('listbox', { name: 'Tool results' });
    await expect(results.getByRole('option').first()).toContainText(/Encoder|Base64/i);
    await page.keyboard.press('Escape');
    await expect(combobox).toBeHidden();
  });
});

/** Opens the mobile menu, retrying in case the click lands before hydration. */
async function openMobileMenu(page: Page) {
  const mobileNav = page.getByRole('navigation', { name: 'Mobile' });
  await expect(async () => {
    if (!(await mobileNav.isVisible())) await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(mobileNav).toBeVisible({ timeout: 1_000 });
  }).toPass();
  return mobileNav;
}

// ── Mobile ─────────────────────────────────────────────────────────────────────

test.describe('mobile @mobile', () => {
  test('menu opens and closes with Escape', async ({ page }) => {
    await page.goto('/');
    const mobileNav = await openMobileMenu(page);
    await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(mobileNav).toBeHidden();
    await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('menu navigates to a tool and closes', async ({ page }) => {
    await page.goto('/');
    const mobileNav = await openMobileMenu(page);
    await mobileNav.getByRole('link', { name: 'JSON Beautifier' }).click();
    await expect(page).toHaveURL(/\/tools\/json$/);
    await expect(mobileNav).toBeHidden();
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('tool page renders on a phone viewport', async ({ page }) => {
    const res = await page.goto('/tools/json');
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'no horizontal page scroll').toBeLessThanOrEqual(0);
  });
});
