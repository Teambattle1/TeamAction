# E2E Tests with Playwright

## Overview

This directory contains end-to-end tests for the Team Challenge application using Playwright.

## Setup

### Install Playwright

```bash
npm install -D @playwright/test@latest
npx playwright install
```

### Install Browsers

```bash
npx playwright install chromium firefox webkit
```

## Running Tests

### Run all tests

```bash
npx playwright test
```

### Run tests in headed mode (see browser)

```bash
npx playwright test --headed
```

### Run specific test file

```bash
npx playwright test e2e/critical-flows.spec.ts
```

### Run tests in UI mode (interactive)

```bash
npx playwright test --ui
```

### Debug tests

```bash
npx playwright test --debug
```

## Test Structure

### Critical Flows (`critical-flows.spec.ts`)

Tests the most important user journeys:

- **Landing Page**: Verifies the initial landing screen loads correctly
- **Game Creation**: Tests instructor creating a new game
- **Offline Mode**: Verifies offline indicator appears/disappears
- **Error Handling**: Ensures no crashes or white screens
- **Measure Tool**: Tests distance calculation in editor mode

## Writing New Tests

### Example Test

```typescript
test('should do something important', async ({ page }) => {
  // Navigate to page
  await page.goto('/');
  
  // Interact with elements
  await page.click('button:has-text("Click Me")');
  
  // Assert expectations
  await expect(page.locator('text=Success')).toBeVisible();
});
```

### Best Practices

1. **Use data-testid attributes**: Add `data-testid="element-name"` to important elements
2. **Wait for elements**: Use `await expect(...).toBeVisible()` instead of `waitForTimeout`
3. **Keep tests isolated**: Each test should be independent
4. **Use page object model**: For complex pages, create page objects
5. **Test critical paths first**: Focus on user flows that matter most

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Coverage Goals

- ✅ **Landing page loads**
- ✅ **Offline mode detection**
- ✅ **Error boundary handling**
- 🔲 Game creation flow
- 🔲 Task editing workflow
- 🔲 Measure tool accuracy
- 🔲 Team synchronization
- 🔲 Playground management
- 🔲 Mobile responsiveness

## Debugging Tips

### View test report

```bash
npx playwright show-report
```

### Generate trace for debugging

```bash
npx playwright test --trace on
```

### Take screenshots

Tests automatically take screenshots on failure. Find them in `test-results/`

### Record video

Videos are recorded on failure. Configure in `playwright.config.ts`

## Known Issues

- Some tests require authentication setup (Supabase integration)
- GPS mocking needed for location-based tests
- Database state management between tests

## Next Steps

1. Add authentication helper utilities
2. Create page object models for complex pages
3. Add visual regression tests
4. Integrate with CI/CD pipeline
5. Add performance testing
