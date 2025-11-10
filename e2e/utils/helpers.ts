import { Page, BrowserContext, expect } from '@playwright/test';

/**
 * Common helper functions for E2E tests
 * These utilities reduce code duplication and improve test maintainability
 */

/**
 * Wait for restaurants to load on the page
 */
export async function waitForRestaurantsLoad(page: Page, timeout = 8000) {
  try {
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded', { timeout: 3000 });

    // Wait for restaurants data to load - try multiple selectors
    const restaurantSelectors = [
      'text=Pizza Place',
      'text=Burger King',
      'text=Sushi Spot',
      '[data-testid="restaurant-card"]',
      'article',
      '.restaurant-item',
    ];

    let found = false;
    for (const selector of restaurantSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 1500 });
        found = true;
        break;
      } catch (e) {
        // Continue to next selector
        continue;
      }
    }

    if (!found) {
      throw new Error('No restaurant elements found on page');
    }

    // Wait for any network requests to complete
    await page.waitForLoadState('networkidle', { timeout: timeout - 3000 }).catch(() => {
      // Don't fail if networkidle times out, we have content
    });
  } catch (error) {
    throw new Error(`Restaurants failed to load within ${timeout}ms. ${error}`);
  }
}

/**
 * Navigate to homepage and wait for content to load
 */
export async function navigateToHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // Don't wait for networkidle on mobile - can take too long
  // Instead, wait for restaurants to be visible
  await page.waitForTimeout(500);
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      // Timeout is OK, we have content
    });
  } catch (e) {
    // Continue even if networkidle fails
  }
}

/**
 * Navigate to a restaurant detail page
 */
export async function navigateToRestaurant(page: Page, restaurantId: string) {
  await page.goto(`/restaurants/${restaurantId}`);
  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

/**
 * Navigate to bookmarks page
 */
export async function navigateToBookmarks(page: Page) {
  await page.goto('/bookmarks');
  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

/**
 * Search for a restaurant by name
 */
export async function searchRestaurant(page: Page, searchTerm: string) {
  const searchInput = page
    .locator('input[placeholder*="Search"], input[placeholder*="search"]')
    .first();
  await searchInput.fill(searchTerm);

  // Wait for search results to update
  await page.waitForTimeout(500);
}

/**
 * Clear search input
 */
export async function clearSearch(page: Page) {
  const searchInput = page
    .locator('input[placeholder*="Search"], input[placeholder*="search"]')
    .first();
  await searchInput.clear();
  await page.waitForTimeout(500);
}

/**
 * Get all visible restaurant names on current page
 */
export async function getVisibleRestaurants(page: Page): Promise<string[]> {
  // This assumes restaurants are displayed in a list or grid
  const restaurants = await page
    .locator('[data-testid="restaurant-card"], article, .restaurant-item')
    .allTextContents();
  return restaurants.filter((text) => text.trim().length > 0);
}

/**
 * Click on a restaurant by name
 */
export async function clickRestaurant(page: Page, restaurantName: string) {
  const link = page
    .locator(`a:has-text("${restaurantName}"), button:has-text("${restaurantName}")`)
    .first();
  await link.click();
  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

/**
 * Toggle theme if theme button exists
 */
export async function toggleTheme(page: Page) {
  const themeButton = page
    .locator(
      'button[title*="theme" i], button[aria-label*="theme" i], button[data-testid="theme-toggle"]'
    )
    .first();

  if (await themeButton.isVisible()) {
    await themeButton.click();
    await page.waitForTimeout(300); // Allow animation
    return true;
  }
  return false;
}

/**
 * Check if element is visible and has content
 */
export async function verifyElementVisible(page: Page, selector: string, expectedContent?: string) {
  const element = page.locator(selector).first();
  await expect(element).toBeVisible();

  if (expectedContent) {
    await expect(element).toContainText(expectedContent);
  }
}

/**
 * Get current page URL without query parameters
 */
export function getCleanUrl(page: Page): string {
  const url = new URL(page.url());
  return `${url.pathname}`;
}

/**
 * Wait for API response with specific pattern
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp, timeout = 5000) {
  const response = await page.waitForResponse(
    (response) =>
      typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url()),
    { timeout }
  );
  return response;
}

/**
 * Check if page shows error message
 */
export async function hasErrorMessage(page: Page): Promise<boolean> {
  const errorSelectors = [
    'text=Error',
    'text=error',
    '.error',
    '[role="alert"]',
    '[data-testid="error-message"]',
  ];

  for (const selector of errorSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible()) {
      return true;
    }
  }
  return false;
}

/**
 * Check if page shows loading state
 */
export async function isLoading(page: Page): Promise<boolean> {
  const loadingSelectors = [
    'text=Loading',
    'text=loading',
    '.spinner',
    '.loader',
    '[role="status"]',
    '[data-testid="loading"]',
  ];

  for (const selector of loadingSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible()) {
      return true;
    }
  }
  return false;
}

/**
 * Wait for loading to complete
 */
export async function waitForLoadingComplete(page: Page, timeout = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (!(await isLoading(page))) {
      return true;
    }
    await page.waitForTimeout(100);
  }
  throw new Error(`Loading did not complete within ${timeout}ms`);
}

/**
 * Take screenshot for debugging (if test fails)
 */
export async function debugScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `debug-${name}-${timestamp}.png`;
  await page.screenshot({ path: filename });
  console.log(`Screenshot saved: ${filename}`);
}

/**
 * Get and log console messages
 */
export async function setupConsoleLogging(page: Page) {
  const logs: Array<{ type: string; message: string }> = [];

  page.on('console', (msg) => {
    logs.push({ type: msg.type(), message: msg.text() });
  });

  page.on('pageerror', (error) => {
    logs.push({ type: 'error', message: error.toString() });
  });

  return logs;
}

/**
 * Check mobile viewport
 */
export async function setMobileViewport(page: Page) {
  await page.setViewportSize({ width: 375, height: 667 });
}

/**
 * Check tablet viewport
 */
export async function setTabletViewport(page: Page) {
  await page.setViewportSize({ width: 768, height: 1024 });
}

/**
 * Check desktop viewport
 */
export async function setDesktopViewport(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
}

/**
 * Simulate network offline
 */
export async function goOffline(context: BrowserContext) {
  await context.setOffline(true);
}

/**
 * Restore network connection
 */
export async function goOnline(context: BrowserContext) {
  await context.setOffline(false);
}

/**
 * Get performance metrics
 */
export async function getPerformanceMetrics(page: Page) {
  return await page.evaluate(() => {
    const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
      loadComplete: perf.loadEventEnd - perf.loadEventStart,
      totalTime: perf.loadEventEnd - perf.fetchStart,
    };
  });
}

/**
 * Check for accessibility issues (basic check)
 */
export async function checkBasicAccessibility(page: Page): Promise<string[]> {
  const issues: string[] = [];

  // Check for missing alt text on images
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  if (imagesWithoutAlt > 0) {
    issues.push(`Found ${imagesWithoutAlt} images without alt text`);
  }

  // Check for buttons without text or aria-label
  const emptyButtons = await page.locator('button:not(:has-text("*")):not([aria-label])').count();
  if (emptyButtons > 0) {
    issues.push(`Found ${emptyButtons} buttons without text or aria-label`);
  }

  // Check for links without text or aria-label
  const emptyLinks = await page.locator('a:not(:has-text("*")):not([aria-label])').count();
  if (emptyLinks > 0) {
    issues.push(`Found ${emptyLinks} links without text or aria-label`);
  }

  return issues;
}
