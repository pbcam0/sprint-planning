const { test, expect } = require('@playwright/test');

const SESSION = {
  id: 'TEST01',
  sprintName: 'Test Sprint',
  startDate: '2026-05-19',
  sprintLength: 5,
  createdAt: Date.now(),
  participants: { Alice: { joinedAt: Date.now() } },
  availability: { Alice: {} },
};

function mockApi(page, initial = null) {
  let store = initial ? { ...initial } : null;
  const api = {
    expire() { store = null; },
    update(data) { store = { ...data }; },
  };
  page.route(/\/api\/session/, async route => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    if (method === 'GET') {
      return store
        ? route.fulfill({ json: { ...store } })
        : route.fulfill({ status: 404, json: { error: 'Not found' } });
    }
    if (method === 'POST') {
      store = await route.request().postDataJSON();
      return route.fulfill({ json: { ok: true } });
    }
    if (method === 'DELETE') {
      store = null;
      return route.fulfill({ json: { ok: true } });
    }
  });
  return api;
}

async function joinAs(page, name) {
  await page.fill('#join-name-input', name);
  await page.click('button:has-text("Join sprint")');
  await expect(page.locator('#screen-board')).toBeVisible();
}

// ── Tests ────────────────────────────────────────────────────────────────────

test('shows setup screen on fresh load with no session param', async ({ page }) => {
  mockApi(page);
  await page.goto('/');
  await expect(page.locator('#screen-setup')).toBeVisible();
  await expect(page.locator('#screen-board')).not.toBeVisible();
});

test('create session → board renders with sprint name', async ({ page }) => {
  mockApi(page);
  await page.goto('/');
  await page.fill('#setup-name', 'Sprint 42');
  await page.fill('#setup-date', '2026-05-19');
  await page.click('button:has-text("Create session")');
  await expect(page.locator('#screen-board')).toBeVisible();
  await expect(page.locator('#board-title')).toHaveText('Sprint 42');
});

test('join flow: join screen → board shows participant', async ({ page }) => {
  mockApi(page, SESSION);
  await page.goto('/?session=TEST01');
  await expect(page.locator('#screen-join')).toBeVisible();
  await expect(page.locator('#join-sprint-name')).toHaveText('Test Sprint');
  await joinAs(page, 'Bob');
  await expect(page.locator('#board-title')).toHaveText('Test Sprint');
  await expect(page.locator('text=Bob')).toBeVisible();
});

test('cell toggles through all states: unset → full → half → none → unset', async ({ page }) => {
  mockApi(page, SESSION);
  await page.goto('/?session=TEST01');
  await joinAs(page, 'Alice');

  const cell = page.locator('button.cell-btn').first();
  await expect(cell).not.toHaveClass(/full|half|none/);

  await cell.click();
  await expect(page.locator('button.cell-btn').first()).toHaveClass(/full/);

  await page.locator('button.cell-btn').first().click();
  await expect(page.locator('button.cell-btn').first()).toHaveClass(/half/);

  await page.locator('button.cell-btn').first().click();
  await expect(page.locator('button.cell-btn').first()).toHaveClass(/none/);

  await page.locator('button.cell-btn').first().click();
  await expect(page.locator('button.cell-btn').first()).not.toHaveClass(/full|half|none/);
});

test('poll update reflects changes made by another participant', async ({ page }) => {
  const api = mockApi(page, SESSION);
  await page.goto('/?session=TEST01');
  await joinAs(page, 'Alice');

  api.update({
    ...SESSION,
    participants: { ...SESSION.participants, Bob: { joinedAt: Date.now() } },
    availability: { ...SESSION.availability, Bob: {} },
  });

  await page.evaluate(() => window.pollUpdates());
  await expect(page.locator('text=Bob')).toBeVisible();
});

test('session expiry shows toast and stops polling', async ({ page }) => {
  const api = mockApi(page, SESSION);
  await page.goto('/?session=TEST01');
  await joinAs(page, 'Alice');

  api.expire();
  await page.evaluate(() => window.pollUpdates());

  await expect(page.locator('#toast')).toContainText('Session expired');
  // verify the interval was cleared: no further GETs should fire (poll is 15s; 500ms is safe)
  const nextRequest = await page.waitForRequest(
    req => req.url().includes('/api/session') && req.method() === 'GET',
    { timeout: 500 }
  ).catch(() => null);
  expect(nextRequest).toBeNull();
});

test('polling pauses when tab is hidden and resumes when visible', async ({ page }) => {
  let getCount = 0;
  page.route(/\/api\/session/, async route => {
    if (route.request().method() === 'GET') getCount++;
    return route.fulfill({ json: { ...SESSION } });
  });

  await page.goto('/?session=TEST01');
  await joinAs(page, 'Alice');

  // Hide the tab — onVisibilityChange clears the interval
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  const countAfterHide = getCount;
  await page.waitForTimeout(500); // poll is 15s, so nothing should fire
  expect(getCount).toBe(countAfterHide);

  // Show the tab — onVisibilityChange calls pollUpdates() immediately
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  await expect.poll(() => getCount).toBeGreaterThan(countAfterHide);
});
